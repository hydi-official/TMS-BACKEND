const Submission = require('../models/Submission');
const Student = require('../models/Student');
const { createNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

// Create submission (lecturer)
const createSubmission = async (req, res) => {
  try {
    const { title, description, stage, deadline, studentIds } = req.body;

    // For single student
    if (studentIds && studentIds.length === 1) {
      const student = await Student.findById(studentIds[0]);
      
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
        user: student.user,
        title: 'New Submission Created',
        message: `A new submission "${title}" has been created with deadline ${deadline}.`,
        type: 'submission',
        relatedId: submission._id
      });

      // Send email notification
      await sendEmail({
        to: student.user.email,
        subject: 'New Submission Created',
        html: `<p>Hello ${student.user.fullName},</p>
               <p>A new submission "${title}" has been created by your supervisor.</p>
               <p>Deadline: ${new Date(deadline).toLocaleDateString()}</p>
               <p>Please submit before the deadline.</p>`
      });

      return res.status(201).json(submission);
    }

    // For multiple students
    const submissions = [];
    for (const studentId of studentIds) {
      const student = await Student.findById(studentId);
      
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
        user: student.user,
        title: 'New Submission Created',
        message: `A new submission "${title}" has been created with deadline ${deadline}.`,
        type: 'submission',
        relatedId: submission._id
      });

      // Send email notification
      await sendEmail({
        to: student.user.email,
        subject: 'New Submission Created',
        html: `<p>Hello ${student.user.fullName},</p>
               <p>A new submission "${title}" has been created by your supervisor.</p>
               <p>Deadline: ${new Date(deadline).toLocaleDateString()}</p>
               <p>Please submit before the deadline.</p>`
      });
    }

    res.status(201).json(submissions);
  } catch (error) {
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
const submitWork = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const student = await Student.findOne({ user: req.user._id });
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

    // Create notification for supervisor
    await createNotification({
      user: submission.supervisor.user,
      title: 'New Submission',
      message: `${req.user.fullName} has submitted "${submission.title}".`,
      type: 'submission',
      relatedId: submission._id
    });

    res.json({ message: 'Work submitted successfully', submission });
  } catch (error) {
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
      user: submission.student.user,
      title: 'Submission Graded',
      message: `Your submission "${submission.title}" has been graded.`,
      type: 'grade',
      relatedId: submission._id
    });

    // Send email notification
    await sendEmail({
      to: submission.student.user.email,
      subject: 'Submission Graded',
      html: `<p>Hello ${submission.student.user.fullName},</p>
             <p>Your submission "${submission.title}" has been graded.</p>
             <p>Grade: ${grade}</p>
             <p>Status: ${status}</p>
             <p>Feedback: ${feedback}</p>`
    });

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