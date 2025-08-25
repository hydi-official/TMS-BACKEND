const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTheses,
  getThesis,
  updateThesis,
  getThesisProgress,
} = require('../controllers/thesisController');

router.use(protect);

router.get('/', getTheses);
router.get('/progress', authorize('student'), getThesisProgress);
router.get('/:id', getThesis);
router.put('/:id', authorize('lecturer', 'admin'), updateThesis);

module.exports = router;