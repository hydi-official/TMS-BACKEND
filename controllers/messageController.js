const Message = require('../models/Message');
const ChatGroup = require('../models/ChatGroup');
const Student = require('../models/Student');
const { createNotification } = require('../services/notificationService');

// Send message to user
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      message,
    });

    // Populate sender info
    await newMessage.populate('sender', 'fullName');

    // Create notification for receiver
    await createNotification({
      user: receiverId,
      title: 'New Message',
      message: `You have a new message from ${req.user.fullName}.`,
      type: 'message',
      relatedId: newMessage._id
    });

    // Emit socket event
    req.app.get('io').to(receiverId.toString()).emit('newMessage', newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send message to group
const sendGroupMessage = async (req, res) => {
  try {
    const { groupId, message } = req.body;

    const group = await ChatGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member of group
    const isMember = group.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (!isMember && group.supervisor.toString() !== req.lecturer?._id.toString()) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      group: groupId,
      message,
    });

    // Populate sender info
    await newMessage.populate('sender', 'fullName');

    // Emit socket event to all group members
    group.members.forEach(member => {
      req.app.get('io').to(member.user.toString()).emit('newGroupMessage', {
        ...newMessage.toObject(),
        groupId
      });
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages between users
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
    .populate('sender', 'fullName')
    .populate('receiver', 'fullName')
    .sort('createdAt');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get group messages
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await ChatGroup.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member of group
    const isMember = group.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (!isMember && group.supervisor.toString() !== req.lecturer?._id.toString()) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const messages = await Message.find({ group: groupId })
      .populate('sender', 'fullName')
      .sort('createdAt');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create group (lecturer)
const createGroup = async (req, res) => {
  try {
    const { name, description, studentIds } = req.body;

    const group = await ChatGroup.create({
      name,
      description,
      supervisor: req.lecturer._id,
      members: studentIds.map(id => ({ user: id }))
    });

    // Add lecturer to members
    group.members.push({ user: req.user._id });
    await group.save();

    // Create notifications for students
    for (const studentId of studentIds) {
      await createNotification({
        user: studentId,
        title: 'Added to Group',
        message: `You have been added to group "${name}" by your supervisor.`,
        type: 'message',
        relatedId: group._id
      });
    }

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user groups
const getGroups = async (req, res) => {
  try {
    let groups;
    
    if (req.user.role === 'student') {
      groups = await ChatGroup.find({
        'members.user': req.user._id,
        isActive: true
      })
      .populate('supervisor', 'staffId researchArea')
      .populate({
        path: 'supervisor',
        populate: {
          path: 'user',
          select: 'fullName'
        }
      })
      .populate('members.user', 'fullName');
    } else if (req.user.role === 'lecturer') {
      groups = await ChatGroup.find({
        supervisor: req.lecturer._id,
        isActive: true
      })
      .populate('members.user', 'fullName');
    }

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  sendGroupMessage,
  getMessages,
  getGroupMessages,
  createGroup,
  getGroups,
};