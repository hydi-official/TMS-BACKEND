const Submission = require('../models/Submission');
const Student = require('../models/Student');
const { createNotification } = require('../services/notificationService');
const { sendSubmissionNotificationEmail } = require('../services/emailService');

// Create submission (lecturer) - Auto-assign to all students under supervisor
const createSubmission = async (req, res) => {
  try {
    const { title, description, stage, deadline } = req.body;
    
    // Validate required fields
    if (!title || !description || !stage || !deadline) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['title', 'description', 'stage', 'deadline']
      });
    }

    // Get lecturer profile
    const Lecturer = require('../models/Lecturer');
    const lecturer = await Lecturer.findOne({ user: req.user._id });
    
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer profile not found' });
    }

    // Find all students under this supervisor
    const students = await Student.find({ supervisor: lecturer._id })
      .populate('user', 'fullName email');

    if (students.length === 0) {
      return res.status(400).json({ 
        message: 'No students found under your supervision',
        suggestion: 'You need to have students assigned to you before creating submissions'
      });
    }

    console.log(`Creating submissions for ${students.length} students under lecturer ${lecturer.user}`);

    // Create individual submissions for each student
    const submissionPromises = students.map(async (student) => {
      console.log(`Creating submission for student: ${student.user.fullName} (${student.user.email})`);
      
      const newSubmission = new Submission({
        title,
        description,
        stage,
        deadline: new Date(deadline),
        student: student._id,
        supervisor: lecturer._id,
        status: 'not-submitted',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedSubmission = await newSubmission.save();

      // Create notification for student
      try {
        await createNotification({
          user: student.user._id,
          title: 'New Submission Created',
          message: `A new submission "${title}" has been created with deadline ${new Date(deadline).toLocaleDateString()}.`,
          type: 'submission',
          relatedId: savedSubmission._id
        });

        // Send email notification
        if (sendSubmissionNotificationEmail) {
          await sendSubmissionNotificationEmail(student.user, savedSubmission, 'created');
        }
      } catch (notificationError) {
        console.error(`Failed to send notification to ${student.user.email}:`, notificationError);
        // Continue with submission creation even if notification fails
      }

      return savedSubmission;
    });

    // Wait for all submissions to be created
    const createdSubmissions = await Promise.all(submissionPromises);

    // Populate the submissions with student and supervisor details for response
    const populatedSubmissions = await Submission.find({
      _id: { $in: createdSubmissions.map(s => s._id) }
    })
    .populate('student', 'studentId thesisTopic')
    .populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'fullName email'
      }
    })
    .populate('supervisor', 'staffId')
    .populate({
      path: 'supervisor',
      populate: {
        path: 'user',
        select: 'fullName'
      }
    });

    console.log(`Successfully created ${createdSubmissions.length} submissions`);

    res.status(201).json({
      message: `Successfully created ${createdSubmissions.length} submissions for all your students`,
      submissions: populatedSubmissions,
      count: createdSubmissions.length,
      studentsNotified: students.map(s => ({
        name: s.user.fullName,
        email: s.user.email,
        studentId: s.studentId
      }))
    });

  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ 
      message: 'Failed to create submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get submissions
const getSubmissions = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      query = { student: student._id };
    } else if (req.user.role === 'lecturer') {
      const Lecturer = require('../models/Lecturer');
      const lecturer = await Lecturer.findOne({ user: req.user._id });
      if (!lecturer) {
        return res.status(404).json({ message: 'Lecturer profile not found' });
      }
      query = { supervisor: lecturer._id };
    }

    const submissions = await Submission.find(query)
      .populate('student', 'studentId thesisTopic')
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'fullName email'
        }
      })
      .populate('supervisor', 'staffId')
      .populate({
        path: 'supervisor',
        populate: {
          path: 'user',
          select: 'fullName'
        }
      })
      .sort('-createdAt');

    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get current user's submissions (students only)
const getMySubmissions = async (req, res) => {
  try {
    console.log('=== GET MY SUBMISSIONS ===');
    console.log('Authenticated user ID:', req.user._id);
    console.log('User role:', req.user.role);

    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'fullName email');
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    console.log('Found student profile:', {
      studentId: student._id,
      name: student.user.fullName,
      email: student.user.email
    });

    const submissions = await Submission.find({ student: student._id })
      .populate('student', 'studentId thesisTopic')
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'fullName email'
        }
      })
      .populate('supervisor', 'staffId')
      .populate({
        path: 'supervisor',
        populate: {
          path: 'user',
          select: 'fullName'
        }
      })
      .sort('-createdAt');

    console.log(`Found ${submissions.length} submissions for this student`);
    
    // Log submission IDs for debugging
    submissions.forEach((submission, index) => {
      console.log(`Submission ${index + 1}: ID = ${submission._id}, Status = ${submission.status}`);
    });

    res.json({
      submissions,
      userInfo: {
        studentId: student._id,
        name: student.user.fullName,
        email: student.user.email
      }
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Submit work (student) - Enhanced with better error handling
const submitWork = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Add debugging information
    console.log('=== SUBMIT WORK DEBUGGING ===');
    console.log('Authenticated user ID:', req.user._id);
    console.log('Submission ID from params:', req.params.id);

    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'fullName email');
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    console.log('Found student profile:', {
      studentId: student._id,
      name: student.user.fullName,
      email: student.user.email
    });

    const submission = await Submission.findById(req.params.id)
      .populate('student')
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'fullName email'
        }
      });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    console.log('Found submission:', {
      submissionId: submission._id,
      assignedToStudentId: submission.student._id,
      assignedToName: submission.student.user?.fullName,
      assignedToEmail: submission.student.user?.email
    });

    console.log('Authorization check:', {
      submissionStudentId: submission.student._id.toString(),
      currentStudentId: student._id.toString(),
      match: submission.student._id.toString() === student._id.toString()
    });

    // Enhanced authorization check
    if (submission.student._id.toString() !== student._id.toString()) {
      return res.status(403).json({ 
        message: 'This submission was not assigned to you',
        details: {
          assignedTo: submission.student.user?.fullName,
          assignedToEmail: submission.student.user?.email,
          yourName: student.user.fullName,
          yourEmail: student.user.email,
          submissionId: submission._id,
          yourStudentId: student._id,
          assignedStudentId: submission.student._id
        }
      });
    }

    // Check if already submitted
    if (submission.status === 'submitted' || submission.status === 'accepted' || submission.status === 'rejected') {
      return res.status(400).json({ 
        message: 'This submission has already been submitted',
        currentStatus: submission.status 
      });
    }

    // Check deadline
    if (new Date() > submission.deadline) {
      return res.status(400).json({ message: 'Submission deadline has passed' });
    }

    submission.file = {
      url: req.file.path,
      public_id: req.file.filename,
      uploadedAt: new Date()
    };
    submission.status = 'submitted';
    submission.submittedAt = new Date();

    await submission.save();

    // Notify supervisor
    const Lecturer = require('../models/Lecturer');
    const supervisorUser = await Lecturer.findById(submission.supervisor).populate('user');
    
    if (supervisorUser && supervisorUser.user) {
      await createNotification({
        user: supervisorUser.user._id,
        title: 'New Submission',
        message: `${student.user.fullName} has submitted "${submission.title}".`,
        type: 'submission',
        relatedId: submission._id
      });
    }

    console.log('=== SUBMISSION SUCCESSFUL ===');
    res.json({ message: 'Work submitted successfully', submission });
  } catch (error) {
    console.error('Submit work error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Grade submission (lecturer)
const gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback, status } = req.body;
    
    const Lecturer = require('../models/Lecturer');
    const lecturer = await Lecturer.findOne({ user: req.user._id });
    
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer profile not found' });
    }
    
    const submission = await Submission.findById(req.params.id)
      .populate('student')
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'fullName email'
        }
      });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.supervisor.toString() !== lecturer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = status;
    submission.gradedAt = new Date();

    await submission.save();

    // Create notification for student
    await createNotification({
      user: submission.student.user._id,
      title: 'Submission Graded',
      message: `Your submission "${submission.title}" has been graded.`,
      type: 'grade',
      relatedId: submission._id
    });

    // Send email notification
    if (sendSubmissionNotificationEmail) {
      await sendSubmissionNotificationEmail(submission.student.user, submission, 'graded');
    }

    res.json({ message: 'Submission graded successfully', submission });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSubmission,
  getSubmissions,
  getMySubmissions, // Make sure this is exported
  submitWork,
  gradeSubmission,
};