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
    
    const student = await Student.findById(studentId);
    const request = student.requestedSupervisors.find(
      req => req.lecturer.toString() === req.lecturer._id.toString()
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    
    if (status === 'accepted') {
      student.supervisor = req.lecturer._id;
      
      // Update lecturer's current students count
      await Lecturer.findByIdAndUpdate(
        req.lecturer._id,
        { $inc: { currentStudents: 1 } }
      );

      // Create thesis record
      const Thesis = require('../models/Thesis');
      await Thesis.create({
        title: student.thesisTopic || 'Untitled Thesis',
        student: student._id,
        supervisor: req.lecturer._id
      });
    }

    await student.save();

    // Create notification for student
    await createNotification({
      user: student.user,
      title: 'Supervision Request Update',
      message: `Your supervisor request has been ${status}.`,
      type: 'request',
      relatedId: req.lecturer._id
    });

    res.json({ message: `Request ${status} successfully` });
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
};