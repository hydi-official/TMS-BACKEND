const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  sendMessage,
  sendGroupMessage,
  getMessages,
  getGroupMessages,
  createGroup,
  getGroups,
} = require('../controllers/messageController');

router.use(protect);

router.get('/groups', getGroups);
router.get('/:userId', getMessages);
router.get('/group/:groupId', getGroupMessages);
router.post('/', sendMessage);
router.post('/group', sendGroupMessage);
router.post('/create-group', authorize('lecturer'), createGroup);

module.exports = router;