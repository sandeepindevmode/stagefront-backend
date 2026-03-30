/**
 * Seed script — populates DB with sample events
 * Usage: node seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Event = require('./models/Event');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany();
    await Event.deleteMany();
    console.log('🗑  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@stagefront.com',
      password: 'admin123',
      role: 'admin'
    });

    // Create a regular user
    const user1 = await User.create({
      name: 'Alex Rivera',
      email: 'alex@example.com',
      password: 'password123'
    });

    console.log('👤 Users created');

    // Create sample events
    const events = [
      {
        title: 'NEON ECLIPSE',
        artist: 'The Midnight',
        dateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        location: 'Brooklyn Steel, New York',
        description: 'An immersive synthwave journey through neon-soaked dreamscapes.',
        ticketLink: 'https://ticketmaster.com',
        genre: 'Synthwave',
        price: '$45–$85',
        image: '🌙',
        createdBy: admin._id
      },
      {
        title: 'BASS CATHEDRAL',
        artist: 'Fred again..',
        dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        location: 'Fabric, London',
        description: 'Fred again.. brings his legendary live-sampling experience to Fabric.',
        ticketLink: 'https://ticketmaster.com',
        genre: 'Electronic',
        price: '$30–$60',
        image: '🔊',
        createdBy: admin._id
      },
      {
        title: 'INDIGO SESSIONS',
        artist: 'FKJ',
        dateTime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        location: 'Hollywood Bowl, Los Angeles',
        description: 'French Kiwi Juice takes the Hollywood Bowl stage for an intimate one-man-band performance.',
        ticketLink: 'https://ticketmaster.com',
        genre: 'Jazz / Indie',
        price: '$55–$120',
        image: '🎷',
        createdBy: user1._id
      },
      {
        title: 'VOID RITUAL',
        artist: 'Overmono',
        dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        location: 'Printworks, London',
        description: 'Brothers Tom and Ed Russell throw down a massive all-night rave at Printworks London.',
        ticketLink: 'https://resident-advisor.net',
        genre: 'Techno',
        price: '$25–$40',
        image: '⚡',
        createdBy: user1._id
      }
    ];

    await Event.insertMany(events);
    console.log('🎵 Sample events created');

    console.log('\n✅ Seed complete!\n');
    console.log('Test credentials:');
    console.log('  Admin → admin@stagefront.com / admin123');
    console.log('  User  → alex@example.com / password123\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
