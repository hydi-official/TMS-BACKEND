const Announcement = require('../models/Announcement');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');
const { createNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, targetAudience, specificTargets, expiresAt } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      author: req.user._id,
      targetAudience,
      specificTargets,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    // Determine target users
    let targetUsers = [];
    
    if (targetAudience === 'all') {
      const students = await Student.find().populate('user');
      const lecturers = await Lecturer.find().populate('user');
      
      targetUsers = [
        ...students.map(s => s.user._id),
        ...lecturers.map(l => l.user._id)
      ];
    } else if (targetAudience === 'students') {
      const students = await Student.find().populate('user');
      targetUsers = students.map(s => s.user._id);
    } else if (targetAudience === 'lecturers') {
      const lecturers = await Lecturer.find().populate('user');
      targetUsers = lecturers.map(l => l.user._id);
    } else if (targetAudience === 'specific' && specificTargets) {
      targetUsers = specificTargets;
    }

    // Create notifications for target users
    for (const userId of targetUsers) {
      await createNotification({
        user: userId,
        title: 'New Announcement',
        message: title,
        type: 'announcement',
        relatedId: announcement._id
      });
    }

    // Send email notifications
    // This would be implemented based on your email service

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get announcements
const getAnnouncements = async (req, res) => {
  try {
    let query = { isActive: true };
    
    if (req.user.role === 'student') {
      query.$or = [
        { targetAudience: 'all' },
        { targetAudience: 'students' },
        { specificTargets: req.user._id }
      ];
    } else if (req.user.role === 'lecturer') {
      query.$or = [
        { targetAudience: 'all' },
        { targetAudience: 'lecturers' },
        { specificTargets: req.user._id }
      ];
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'fullName')
      .sort('-createdAt');

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const { title, message, isActive, expiresAt } = req.body;

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is author or admin
    if (announcement.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, message, isActive, expiresAt: expiresAt ? new Date(expiresAt) : null },
      { new: true, runValidators: true }
    ).populate('author', 'fullName');

    res.json(updatedAnnouncement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is author or admin
    if (announcement.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
};