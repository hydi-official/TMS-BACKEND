const { sendEmail } = require('../config/email');

const sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: `"Thesis Management System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Welcome to Thesis Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Welcome to Thesis Management System</h2>
        <p>Hello ${user.fullName},</p>
        <p>Your account has been created successfully.</p>
        <p><strong>User ID:</strong> ${user.userId}</p>
        <p><strong>Role:</strong> ${user.role}</p>
        <p>You can now login to the system using your User ID and PIN.</p>
        <br>
        <p>Best regards,<br>Thesis Management Team</p>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

const sendPasswordResetEmail = async (user, tempPin) => {
  const mailOptions = {
    from: `"Thesis Management System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Password Reset Request</h2>
        <p>Hello ${user.fullName},</p>
        <p>You have requested to reset your password.</p>
        <p>Your temporary PIN is: <strong style="font-size: 18px;">${tempPin}</strong></p>
        <p>Please login with this PIN and change it immediately for security reasons.</p>
        <br>
        <p>If you didn't request this reset, please contact support immediately.</p>
        <br>
        <p>Best regards,<br>Thesis Management Team</p>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

const sendSubmissionNotificationEmail = async (user, submission, action) => {
  let subject, message;
  
  if (action === 'created') {
    subject = 'New Submission Created';
    message = `A new submission "${submission.title}" has been created with deadline ${submission.deadline}.`;
  } else if (action === 'graded') {
    subject = 'Submission Graded';
    message = `Your submission "${submission.title}" has been graded. Grade: ${submission.grade}`;
  }
  
  const mailOptions = {
    from: `"Thesis Management System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">${subject}</h2>
        <p>Hello ${user.fullName},</p>
        <p>${message}</p>
        <p>Please login to the system to view details.</p>
        <br>
        <p>Best regards,<br>Thesis Management Team</p>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

const sendSupervisorRequestEmail = async (lecturer, student) => {
  const mailOptions = {
    from: `"Thesis Management System" <${process.env.EMAIL_USER}>`,
    to: lecturer.email,
    subject: 'New Supervision Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">New Supervision Request</h2>
        <p>Hello ${lecturer.fullName},</p>
        <p>${student.fullName} (${student.userId}) has requested you as their supervisor.</p>
        <p>Please login to the system to accept or reject this request.</p>
        <br>
        <p>Best regards,<br>Thesis Management Team</p>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

const sendSupervisorResponseEmail = async (student, lecturer, status) => {
  const mailOptions = {
    from: `"Thesis Management System" <${process.env.EMAIL_USER}>`,
    to: student.email,
    subject: 'Supervision Request Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Supervision Request Update</h2>
        <p>Hello ${student.fullName},</p>
        <p>Your supervisor request to ${lecturer.fullName} has been <strong>${status}</strong>.</p>
        <p>Please login to the system for more details.</p>
        <br>
        <p>Best regards,<br>Thesis Management Team</p>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

const sendAnnouncementEmail = async (user, announcement) => {
  const mailOptions = {
    from: `"Thesis Management System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Announcement: ${announcement.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">${announcement.title}</h2>
        <p>Hello ${user.fullName},</p>
        <p>${announcement.message}</p>
        <br>
        <p>Best regards,<br>Thesis Management Team</p>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendSubmissionNotificationEmail,
  sendSupervisorRequestEmail,
  sendSupervisorResponseEmail,
  sendAnnouncementEmail,
};