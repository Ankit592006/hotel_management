const MenuItem = require('../models/MenuItem');

// @desc    Get all menu items with category/diet/search filters
// @route   GET /api/menu
// @access  Public
const getMenuItems = async (req, res, next) => {
  try {
    const { category, isVeg, isAvailable, search } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (isVeg !== undefined && isVeg !== '') {
      query.isVeg = isVeg === 'true';
    }

    if (isAvailable !== undefined && isAvailable !== '') {
      query.isAvailable = isAvailable === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await MenuItem.find(query).sort({ category: 1, name: 1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of distinct menu categories
// @route   GET /api/menu/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await MenuItem.distinct('category');
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
const getMenuItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private (Admin)
const createMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, category, imageUrl, isVeg, isAvailable, preparationTime, spicyLevel } = req.body;

    const item = await MenuItem.create({
      name,
      description,
      price: Number(price),
      category,
      imageUrl: imageUrl || undefined,
      isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      preparationTime: preparationTime !== undefined ? Number(preparationTime) : 15,
      spicyLevel: spicyLevel !== undefined ? Number(spicyLevel) : 1
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('menu_item_created', item);
    }

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update menu item (whitelisted fields only)
// @route   PUT /api/menu/:id
// @access  Private (Admin)
const updateMenuItem = async (req, res, next) => {
  try {
    const allowedFields = [
      'name',
      'description',
      'price',
      'category',
      'imageUrl',
      'isVeg',
      'isAvailable',
      'preparationTime',
      'spicyLevel',
      'rating'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (['price', 'preparationTime', 'spicyLevel', 'rating'].includes(field)) {
          updates[field] = Number(req.body[field]);
        } else if (['isVeg', 'isAvailable'].includes(field)) {
          updates[field] = Boolean(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('menu_item_updated', item);
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle item availability
// @route   PATCH /api/menu/:id/availability
// @access  Private (Admin / Staff)
const toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('menu_item_updated', item);
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (Admin)
const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('menu_item_deleted', { _id: item._id });
    }

    res.json({
      success: true,
      message: 'Menu item removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenuItems,
  getCategories,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem
};
