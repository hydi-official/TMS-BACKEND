const Submission = require('../models/Submission');
const Student = require('../models/Student');
const { createNotification } = require('../services/notificationService');
const { sendSubmissionNotificationEmail } = require('../services/emailService');

// Create submission (lecturer)
const createSubmission = async (req, res) => {
  try {
    const { title, description, stage, deadline, studentIds } = req.body;

    // For single student
    if (studentIds && studentIds.length === 1) {
      const student = await Student.findById(studentIds[0])
        .populate('user', 'fullName email');
      
      const submission = await Submission.create({
        title,
        description,
        stage,
        deadline: new Date(deadline),
        student: studentIds[0],
        supervisor: req.lecturer._id,
      });

      // Create notification for student
      await createNotification({
        user: student.user._id,
        title: 'New Submission Created',
        message: `A new submission "${title}" has been created with deadline ${deadline}.`,
        type: 'submission',
        relatedId: submission._id
      });

      // Send email notification using the template
      await sendSubmissionNotificationEmail(student.user, submission, 'created');

      return res.status(201).json(submission);
    }

    // For multiple students
    const submissions = [];
    for (const studentId of studentIds) {
      const student = await Student.findById(studentId)
        .populate('user', 'fullName email');
      
      const submission = await Submission.create({
        title,
        description,
        stage,
        deadline: new Date(deadline),
        student: studentId,
        supervisor: req.lecturer._id,
      });

      submissions.push(submission);

      // Create notification for student
      await createNotification({
        user: student.user._id,
        title: 'New Submission Created',
        message: `A new submission "${title}" has been created with deadline ${deadline}.`,
        type: 'submission',
        relatedId: submission._id
      });

      // Send email notification using the template
      await sendSubmissionNotificationEmail(student.user, submission, 'created');
    }

    res.status(201).json(submissions);
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get submissions
const getSubmissions = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      query = { student: student._id };
    } else if (req.user.role === 'lecturer') {
      query = { supervisor: req.lecturer._id };
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
    res.status(500).json({ message: error.message });
  }
};

// Submit work (student)
// Submit work (student)
const submitWork = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.student.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if deadline has passed
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

    // Create notification for supervisor (lecturer)
    // Fix: Use Lecturer model instead of Student model
    const Lecturer = require('../models/Lecturer'); // Make sure to require the Lecturer model
    
    const supervisorUser = await Lecturer.findById(submission.supervisor).populate('user');
    
    if (supervisorUser && supervisorUser.user) {
      await createNotification({
        user: supervisorUser.user._id,
        title: 'New Submission',
        message: `${req.user.fullName} has submitted "${submission.title}".`,
        type: 'submission',
        relatedId: submission._id
      });
    }

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

    if (submission.supervisor.toString() !== req.lecturer._id.toString()) {
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

    // Send email notification using the template
    await sendSubmissionNotificationEmail(submission.student.user, submission, 'graded');

    res.json({ message: 'Submission graded successfully', submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSubmission,
  getSubmissions,
  submitWork,
  gradeSubmission,
};