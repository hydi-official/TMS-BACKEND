const Notification = require('../models/Notification');

const createNotification = async ({ user, title, message, type, relatedId }) => {
  try {
    const notification = await Notification.create({
      user,
      title,
      message,
      type,
      relatedId,
    });

    // Emit socket event
    // This would be implemented in your socket setup
    // io.to(user.toString()).emit('newNotification', notification);

    return notification;
  } catch (error) {
    console.error('Error creating notification: ', error);
    throw new Error('Notification could not be created');
  }
};

module.exports = { createNotification };