const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('lecturer', 'admin'), createAnnouncement);
router.put('/:id', authorize('lecturer', 'admin'), updateAnnouncement);
router.delete('/:id', authorize('lecturer', 'admin'), deleteAnnouncement);

module.exports = router;