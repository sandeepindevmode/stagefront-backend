# 🎵 Stagefront Backend

Node.js + Express + MongoDB REST API for the Stagefront concert discovery platform.

---

## 📁 Project Structure

```
stagefront-backend/
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   └── auth.js            # JWT protect / adminOnly / optionalAuth
├── models/
│   ├── User.js            # User schema (bcrypt hashed password)
│   └── Event.js           # Event schema (text index, virtuals)
├── routes/
│   ├── auth.js            # /api/auth — register, login, me
│   ├── events.js          # /api/events — full CRUD + like toggle
│   └── users.js           # /api/users — profile, saved events
├── server.js              # Express app entry point
├── seed.js                # DB seed script
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
```
Edit `.env` and fill in:
- `MONGODB_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string (keep it secret!)

### 3. (Optional) Seed the database
```bash
node seed.js
```

### 4. Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs at **http://localhost:5000**

---

## 🔗 API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

#### Register
```json
POST /api/auth/register
{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "password": "mypassword"
}
```

#### Login
```json
POST /api/auth/login
{
  "email": "alex@example.com",
  "password": "mypassword"
}
```
→ Returns `{ token, user }`

---

### Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | ❌ | List all upcoming events |
| GET | `/api/events/:id` | ❌ | Get single event |
| POST | `/api/events` | ✅ | Create event |
| PUT | `/api/events/:id` | ✅ | Update event (owner/admin) |
| DELETE | `/api/events/:id` | ✅ | Soft-delete event |
| POST | `/api/events/:id/like` | ✅ | Toggle like |

#### GET /api/events — Query Params
| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `search` | string | `?search=london` | Full-text search |
| `genre` | string | `?genre=Techno` | Filter by genre |
| `page` | number | `?page=2` | Pagination |
| `limit` | number | `?limit=6` | Items per page |
| `sortBy` | string | `?sortBy=dateTime` | Sort field |
| `order` | string | `?order=asc` | `asc` or `desc` |

#### Create Event (requires Bearer token)
```json
POST /api/events
Authorization: Bearer <token>
{
  "title": "NEON ECLIPSE",
  "artist": "The Midnight",
  "dateTime": "2025-08-15T20:00:00Z",
  "location": "Brooklyn Steel, New York",
  "description": "An epic synthwave show.",
  "ticketLink": "https://ticketmaster.com",
  "genre": "Synthwave",
  "price": "$45–$85",
  "image": "🌙"
}
```

---

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | ✅ | Get profile + my events |
| PUT | `/api/users/profile` | ✅ | Update name/password |
| POST | `/api/users/save/:eventId` | ✅ | Toggle save event |
| GET | `/api/users/saved` | ✅ | Get saved events |
| GET | `/api/users` | 👑 Admin | List all users |

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <your_jwt_token>
```

Store the token in `localStorage` on the frontend:
```js
localStorage.setItem('token', data.token);

// Attach to every request via Axios:
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

---

## 🌐 Connecting to the React Frontend

In your React app, create `src/api/axios.js`:
```js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

Then use it anywhere:
```js
// Get all events
const { data } = await api.get('/events?genre=Techno&page=1');

// Create event (must be logged in)
const { data } = await api.post('/events', eventPayload);

// Login
const { data } = await api.post('/auth/login', { email, password });
localStorage.setItem('token', data.token);
```

---

## ☁️ Deployment

### Backend → Render
1. Push this folder to GitHub
2. New Web Service on [render.com](https://render.com)
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables in Render dashboard

### Database → MongoDB Atlas
1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Add IP `0.0.0.0/0` to Network Access
3. Copy connection string → paste into `MONGODB_URI`

### Frontend → Vercel
1. Set `REACT_APP_API_URL=https://your-render-app.onrender.com/api`
2. Deploy with `vercel --prod`

---

## 🧪 Test Credentials (after seeding)
- **Admin**: `admin@stagefront.com` / `admin123`
- **User**: `alex@example.com` / `password123`
