const Thesis = require('../models/Thesis');
const Student = require('../models/Student');
const Submission = require('../models/Submission');
const { createNotification } = require('../services/notificationService');

// Get all theses for a user
const getTheses = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      query = { student: student._id };
    } else if (req.user.role === 'lecturer') {
      query = { supervisor: req.lecturer._id };
    }

    const theses = await Thesis.find(query)
      .populate('student', 'studentId thesisTopic')
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'fullName email'
        }
      })
      .populate('supervisor', 'staffId researchArea')
      .populate({
        path: 'supervisor',
        populate: {
          path: 'user',
          select: 'fullName email'
        }
      });

    res.json(theses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single thesis
const getThesis = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id)
      .populate('student', 'studentId thesisTopic')
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'fullName email'
        }
      })
      .populate('supervisor', 'staffId researchArea')
      .populate({
        path: 'supervisor',
        populate: {
          path: 'user',
          select: 'fullName email'
        }
      });

    if (!thesis) {
      return res.status(404).json({ message: 'Thesis not found' });
    }

    // Check authorization
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (thesis.student._id.toString() !== student._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    } else if (req.user.role === 'lecturer') {
      if (thesis.supervisor._id.toString() !== req.lecturer._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    res.json(thesis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update thesis
const updateThesis = async (req, res) => {
  try {
    const { title, status, finalGrade } = req.body;
    
    const thesis = await Thesis.findById(req.params.id);
    
    if (!thesis) {
      return res.status(404).json({ message: 'Thesis not found' });
    }

    // Check authorization
    if (req.user.role === 'lecturer') {
      if (thesis.supervisor.toString() !== req.lecturer._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedThesis = await Thesis.findByIdAndUpdate(
      req.params.id,
      { title, status, finalGrade },
      { new: true, runValidators: true }
    ).populate('student supervisor');

    res.json(updatedThesis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get thesis progress
const getThesisProgress = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    const submissions = await Submission.find({ student: student._id })
      .select('stage status grade submittedAt deadline')
      .sort('stage');

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTheses,
  getThesis,
  updateThesis,
  getThesisProgress,
};