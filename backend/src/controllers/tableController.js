const QRCode = require('qrcode');
const Table = require('../models/Table');

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

// @desc    Get all tables with QR codes
// @route   GET /api/tables
// @access  Public (or Admin)
const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find({ isActive: true }).sort({ tableNumber: 1 });
    res.json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single table by table number
// @route   GET /api/tables/:tableNumber
// @access  Public (used on customer landing)
const getTableByNumber = async (req, res, next) => {
  try {
    const tableNumber = Number(req.params.tableNumber);
    if (isNaN(tableNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table number'
      });
    }

    let table = await Table.findOne({ tableNumber, isActive: true });
    
    // Auto-create table if not found (convenience for demo/initial deployment)
    if (!table) {
      const baseUrl = getFrontendBaseUrl();
      const tableUrl = `${baseUrl}/table/${tableNumber}`;
      const qrCodeDataUrl = await QRCode.toDataURL(tableUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });

      table = await Table.create({
        tableNumber,
        capacity: 4,
        status: 'available',
        tableUrl,
        qrCodeDataUrl
      });
    }

    res.json({
      success: true,
      data: table
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new table with QR code
// @route   POST /api/tables
// @access  Private (Admin)
const createTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity, status } = req.body;

    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: 'Table number is required'
      });
    }

    const existing = await Table.findOne({ tableNumber: Number(tableNumber) });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Table #${tableNumber} already exists`
      });
    }

    const baseUrl = getFrontendBaseUrl();
    const tableUrl = `${baseUrl}/table/${tableNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(tableUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    const table = await Table.create({
      tableNumber: Number(tableNumber),
      capacity: capacity ? Number(capacity) : 4,
      status: status || 'available',
      tableUrl,
      qrCodeDataUrl
    });

    res.status(201).json({
      success: true,
      data: table
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update table status (available, occupied, reserved)
// @route   PATCH /api/tables/:tableNumber/status
// @access  Private (Admin)
const updateTableStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const tableNumber = Number(req.params.tableNumber);

    const table = await Table.findOne({ tableNumber });
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    table.status = status;
    await table.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('table_status_updated', table);
    }

    res.json({
      success: true,
      data: table
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate QR code with custom frontend URL
// @route   POST /api/tables/:tableNumber/regenerate-qr
// @access  Private (Admin)
const regenerateTableQR = async (req, res, next) => {
  try {
    const tableNumber = Number(req.params.tableNumber);
    const { customBaseUrl } = req.body;

    const table = await Table.findOne({ tableNumber });
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    const baseUrl = customBaseUrl || getFrontendBaseUrl();
    const tableUrl = `${baseUrl}/table/${tableNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(tableUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    table.tableUrl = tableUrl;
    table.qrCodeDataUrl = qrCodeDataUrl;
    await table.save();

    res.json({
      success: true,
      data: table
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete table
// @route   DELETE /api/tables/:tableNumber
// @access  Private (Admin)
const deleteTable = async (req, res, next) => {
  try {
    const tableNumber = Number(req.params.tableNumber);
    const table = await Table.findOneAndDelete({ tableNumber });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.json({
      success: true,
      message: `Table #${tableNumber} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTables,
  getTableByNumber,
  createTable,
  updateTableStatus,
  regenerateTableQR,
  deleteTable
};
