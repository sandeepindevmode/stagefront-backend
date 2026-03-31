
      const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    artist: {
      type: String,
      required: [true, 'Artist name is required'],
      trim: true,
      maxlength: [100, 'Artist name cannot exceed 100 characters']
    },
    dateTime: {
      type: Date,
      required: [true, 'Event date and time is required'],
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: 'Event date must be in the future'
      }
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: ''
    },
    ticketLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL (starting with http/https)'],
      default: ''
    },
    genre: {
      type: String,
      enum: ['Electronic', 'House', 'Techno', 'Synthwave', 'Jazz / Indie', 'Psychedelic', 'Hip-Hop', 'Rock', 'Pop', 'Other'],
      default: 'Other'
    },
    price: {
      type: String,
      trim: true,
      default: 'TBA'
    },
    image: {
      type: String,
      default: '🎵'
    },
    posterUrl: {
      type: String,
      trim: true,
      default: ''
    },
    artistPhotoUrl: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// ── Indexes for common queries ────────────────────────────────────────────────
EventSchema.index({ dateTime: 1 });
EventSchema.index({ genre: 1 });
EventSchema.index({ createdBy: 1 });
EventSchema.index({ title: 'text', artist: 'text', location: 'text' });

// ── Virtual: likesCount ───────────────────────────────────────────────────────
EventSchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

EventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Event', EventSchema);
