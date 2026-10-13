const express = require('express');
const router = express.Router();
const {
  getTables,
  getTableByNumber,
  createTable,
  updateTableStatus,
  regenerateTableQR,
  deleteTable
} = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getTables);
router.get('/:tableNumber', getTableByNumber);

// Protected Admin Routes
router.post('/', protect, authorize('admin'), createTable);
router.patch('/:tableNumber/status', protect, authorize('admin', 'staff'), updateTableStatus);
router.post('/:tableNumber/regenerate-qr', protect, authorize('admin'), regenerateTableQR);
router.delete('/:tableNumber', protect, authorize('admin'), deleteTable);

module.exports = router;
