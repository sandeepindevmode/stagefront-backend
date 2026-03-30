const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/events
// Public — list all upcoming events with search, filter, pagination
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      genre,
      page = 1,
      limit = 12,
      sortBy = 'dateTime',
      order = 'asc'
    } = req.query;

    const filter = { isActive: true, dateTime: { $gte: new Date() } };

    // Text search across title, artist, location
    if (search) {
      filter.$text = { $search: search };
    }

    // Genre filter
    if (genre && genre !== 'All') {
      filter.genre = genre;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('createdBy', 'name')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: events.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: events
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/events/:id
// Public — single event detail
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');

    if (!event || !event.isActive) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Attach hasLiked for logged-in user
    const eventObj = event.toJSON();
    if (req.user) {
      eventObj.hasLiked = event.likes.some(id => id.toString() === req.user._id.toString());
    }

    res.json({ success: true, data: eventObj });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/events
// Protected — create a new event
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('artist').trim().notEmpty().withMessage('Artist is required'),
    body('dateTime').isISO8601().withMessage('Valid date/time is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('ticketLink')
      .optional({ checkFalsy: true })
      .isURL()
      .withMessage('Please enter a valid ticket URL')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { title, artist, dateTime, location, description, ticketLink, genre, price, image } = req.body;

      const event = await Event.create({
        title,
        artist,
        dateTime,
        location,
        description,
        ticketLink,
        genre,
        price,
        image,
        createdBy: req.user._id
      });

      await event.populate('createdBy', 'name');

      res.status(201).json({ success: true, data: event });
    } catch (err) {
      console.error(err);
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
      }
      res.status(500).json({ success: false, message: 'Failed to create event' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/events/:id
// Protected — update event (owner or admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event || !event.isActive) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only event creator or admin can update
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    }

    const allowedFields = ['title', 'artist', 'dateTime', 'location', 'description', 'ticketLink', 'genre', 'price', 'image'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('createdBy', 'name');

    res.json({ success: true, data: event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/events/:id
// Protected — soft delete (owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event || !event.isActive) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    // Soft delete — keeps data in DB
    event.isActive = false;
    await event.save();

    res.json({ success: true, message: 'Event removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/events/:id/like
// Protected — toggle like on an event
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/like', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || !event.isActive) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const userId = req.user._id;
    const alreadyLiked = event.likes.some(id => id.toString() === userId.toString());

    if (alreadyLiked) {
      event.likes = event.likes.filter(id => id.toString() !== userId.toString());
    } else {
      event.likes.push(userId);
    }

    await event.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: event.likes.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
});

module.exports = router;
