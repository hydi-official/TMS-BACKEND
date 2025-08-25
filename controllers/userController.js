const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');
const Admin = require('../models/Admin');
const { createNotification } = require('../services/notificationService');
const { validateProfileUpdate } = require('../utils/validation');

// Get current user profile
const getProfile = async (req, res) => {
  try {
    let profile;
    
    if (req.user.role === 'student') {
      profile = await Student.findOne({ user: req.user._id })
        .populate('supervisor')
        .populate('requestedSupervisors.lecturer');
    } else if (req.user.role === 'lecturer') {
      profile = await Lecturer.findOne({ user: req.user._id })
        .populate({
          path: 'user',
          select: 'fullName email'
        });
    } else if (req.user.role === 'admin') {
      profile = await Admin.findOne({ user: req.user._id });
    }

    res.json({
      user: req.user,
      profile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, department, researchArea, thesisTopic } = req.body;
    
    // Validate input
    const { errors, isValid } = validateProfileUpdate(req.body, req.user.role);
    
    if (!isValid) {
      return res.status(400).json({ errors });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, email, department },
      { new: true, runValidators: true }
    ).select('-pin');

    // Update role-specific profile
    if (req.user.role === 'student') {
      await Student.findOneAndUpdate(
        { user: req.user._id },
        { thesisTopic },
        { new: true, runValidators: true }
      );
    } else if (req.user.role === 'lecturer') {
      await Lecturer.findOneAndUpdate(
        { user: req.user._id },
        { researchArea, department },
        { new: true, runValidators: true }
      );
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all students (for admin/lecturer)
const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('user', 'fullName email department')
      .populate('supervisor', 'staffId researchArea')
      .populate({
        path: 'supervisor',
        populate: {
          path: 'user',
          select: 'fullName'
        }
      });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all lecturers
const getLecturers = async (req, res) => {
  try {
    const lecturers = await Lecturer.find()
      .populate('user', 'fullName email department')
      .populate({
        path: 'user',
        select: 'fullName email department'
      });

    res.json(lecturers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request supervisor (student)
const requestSupervisor = async (req, res) => {
  try {
    const { lecturerId } = req.body;
    const student = await Student.findOne({ user: req.user._id });

    // Check if already requested
    const existingRequest = student.requestedSupervisors.find(
      req => req.lecturer.toString() === lecturerId
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'Already requested this supervisor' });
    }

    // Add request
    student.requestedSupervisors.push({
      lecturer: lecturerId,
      status: 'pending'
    });

    await student.save();

    // Create notification for lecturer
    const lecturer = await Lecturer.findById(lecturerId).populate('user');
    await createNotification({
      user: lecturer.user._id,
      title: 'New Supervision Request',
      message: `${req.user.fullName} has requested you as their supervisor.`,
      type: 'request',
      relatedId: student._id
    });

    res.json({ message: 'Supervisor request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Respond to supervisor request (lecturer)
const respondToRequest = async (req, res) => {
  try {
    const { studentId, status } = req.body;
    
    // Get lecturer profile first
    const lecturer = await Lecturer.findOne({ user: req.user._id });
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer profile not found' });
    }
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const request = student.requestedSupervisors.find(
      req => req.lecturer.toString() === lecturer._id.toString()
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    request.respondedAt = new Date();
    
    if (status === 'accepted') {
      student.supervisor = lecturer._id;
      
      // Update lecturer's current students count
      await Lecturer.findByIdAndUpdate(
        lecturer._id,
        { $inc: { currentStudents: 1 } }
      );

      // Create thesis record
      const Thesis = require('../models/Thesis');
      await Thesis.create({
        title: student.thesisTopic || 'Untitled Thesis',
        student: student._id,
        supervisor: lecturer._id
      });
    }

    await student.save();

    // Create notification for student
    await createNotification({
      user: student.user,
      title: 'Supervision Request Update',
      message: `Your supervisor request has been ${status}.`,
      type: 'request',
      relatedId: lecturer._id
    });

    res.json({ message: `Request ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all supervision requests for a lecturer
const getLecturerRequests = async (req, res) => {
  try {
    const lecturer = await Lecturer.findOne({ user: req.user._id });
    
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer profile not found' });
    }

    // Find all students who have requested this lecturer
    const students = await Student.find({
      'requestedSupervisors.lecturer': lecturer._id
    })
    .populate('user', 'fullName email department');

    // Extract and format the requests
    const requests = [];
    students.forEach(student => {
      student.requestedSupervisors.forEach(request => {
        // Check if this request is for the current lecturer
        if (request.lecturer && request.lecturer.toString() === lecturer._id.toString()) {
          requests.push({
            _id: request._id,
            student: {
              _id: student._id,
              user: student.user,
              studentId: student.studentId,
              thesisTopic: student.thesisTopic,
              yearOfStudy: student.yearOfStudy
            },
            status: request.status,
            requestedAt: request.requestedAt,
            respondedAt: request.respondedAt
          });
        }
      });
    });

    // Sort by request date (newest first)
    requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    res.json({ requests });
  } catch (error) {
    console.error('Error in getLecturerRequests:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's supervision requests (for students)
const getUserRequests = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can access this endpoint' });
    }

    const student = await Student.findOne({ user: req.user._id })
      .populate({
        path: 'requestedSupervisors.lecturer',
        select: 'staffId researchArea',
        populate: {
          path: 'user',
          select: 'fullName email department'
        }
      });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Format the requests for better frontend consumption
    const formattedRequests = student.requestedSupervisors.map(request => ({
      _id: request._id,
      lecturer: request.lecturer,
      status: request.status,
      requestedAt: request.requestedAt,
      respondedAt: request.respondedAt
    }));

    // Sort by request date (newest first)
    formattedRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    res.json({ 
      requests: formattedRequests,
      currentSupervisor: student.supervisor 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getStudents,
  getLecturers,
  requestSupervisor,
  respondToRequest,
  getLecturerRequests,
  getUserRequests,
};