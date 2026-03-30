const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const { protect, adminOnly } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/profile
// Protected — get current user's profile + their events
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profile', protect, async (req, res) => {
  try {
    const myEvents = await Event.find({ createdBy: req.user._id, isActive: true })
      .sort({ dateTime: 1 });

    res.json({
      success: true,
      user: req.user,
      myEvents
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/profile
// Protected — update name / password
// ─────────────────────────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const { name, currentPassword, newPassword } = req.body;

    if (name) user.name = name;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Please provide your current password' });
      }
      const match = await user.matchPassword(currentPassword);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }
      user.password = newPassword;
    }

    await user.save();
    res.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/save/:eventId
// Protected — toggle save/unsave an event
// ─────────────────────────────────────────────────────────────────────────────
router.post('/save/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event || !event.isActive) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const user = await User.findById(req.user._id);
    const alreadySaved = user.savedEvents.some(id => id.toString() === req.params.eventId);

    if (alreadySaved) {
      user.savedEvents = user.savedEvents.filter(id => id.toString() !== req.params.eventId);
    } else {
      user.savedEvents.push(req.params.eventId);
    }

    await user.save();

    res.json({
      success: true,
      saved: !alreadySaved,
      message: alreadySaved ? 'Event removed from saved' : 'Event saved'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle save' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/saved
// Protected — get all saved events for current user
// ─────────────────────────────────────────────────────────────────────────────
router.get('/saved', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedEvents',
      match: { isActive: true, dateTime: { $gte: new Date() } },
      options: { sort: { dateTime: 1 } }
    });

    res.json({ success: true, data: user.savedEvents });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch saved events' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

module.exports = router;
