# User Messaging System

A full-stack web application for user-to-user messaging with threaded conversations. Built with Node.js, Express, TypeScript, SQLite, and vanilla JavaScript.

## Features

- User registration and authentication with JWT
- Send messages between registered users
- Threaded conversations (replies to messages)
- Real-time message polling (client-side)
- Responsive web interface
- SQLite database with proper indexing

## Tech Stack

### Backend

- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **SQLite** with **better-sqlite3** for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

### Frontend

- **HTML5**, **CSS3**, **JavaScript (ES6+)**
- No frameworks - vanilla JavaScript for simplicity
- Local storage for session management

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd user-messaging-system
```

2. Install dependencies:

```bash
npm install
```

3. The project uses TypeScript, so ensure you have it set up. Dependencies include:
   - express
   - jsonwebtoken
   - bcryptjs
   - better-sqlite3
   - cors
   - And their TypeScript types

## Running the Application

### Development Mode (with TypeScript compilation)

```bash
npm run start:ts
```

This runs the server using ts-node and serves on `http://localhost:3000`

### Production Mode

```bash
npm run build
npm start
```

This compiles TypeScript to JavaScript and runs the compiled version.

## API Endpoints

### Authentication

- `POST /api/register` - Register new user
  - Body: `{ username, email, password }`
- `POST /api/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ token, userId }`

### Users

- `GET /api/users` - Get list of users (authenticated)
  - Returns: Array of users excluding current user

### Messages

- `POST /api/messages` - Send new message (authenticated)
  - Body: `{ recipient_id, content, parent_id? }`
- `GET /api/messages` - Get all messages for current user (authenticated)
- `GET /api/messages/conversation/:userId` - Get conversation with specific user
- `GET /api/messages/thread/:id` - Get threaded conversation for a message

## Usage

1. **Registration/Login**: Visit `http://localhost:3000` and register or login
2. **View Users**: After login, you'll see a list of other registered users
3. **Send Messages**: Click "Send Message" next to any user to compose a message
4. **View Messages**: Click "View Messages" to see your inbox
5. **Threaded Conversations**: Click "View Thread" on any message to see replies, or "Reply" to add a response
6. **Logout**: Use the logout button on any page

## Test Data

The application includes seed data for testing:

### Test Users

- Alice: alice@example.com / password123
- Bob: bob@example.com / password123
- Charlie: charlie@example.com / password123

### Sample Messages

- Alice ↔ Bob conversation
- Charlie ↔ Alice conversation
- Threaded replies on Alice's "Hello Bob!" message

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  passHash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  parent_msg_id INTEGER,
  is_read INTEGER DEFAULT 0,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id),
  FOREIGN KEY (parent_msg_id) REFERENCES messages(id)
);
```

## Project Structure

```
user-messaging-system/
├── src/
│   ├── controllers/     # Route handlers
│   ├── db/             # Database setup and queries
│   ├── middleware/     # Authentication middleware
│   ├── models/         # TypeScript interfaces
│   ├── routes/         # Express routes
│   ├── services/       # Business logic
│   ├── types/          # Type definitions
│   └── server.ts       # Main server file
├── public/             # Static frontend files
│   ├── index.html      # Login/Register page
│   ├── users.html      # User list page
│   ├── messages.html   # Messages inbox
│   ├── thread.html     # Message thread view
│   └── app.js          # Frontend JavaScript
├── data/               # SQLite database (created automatically)
├── package.json
└── README.md
```

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 1 hour
- All message endpoints require authentication
- CORS is enabled for cross-origin requests

## Development Notes

- The database is created automatically on first run
- Seed data is inserted only when the database is empty
- TypeScript compilation is required for production
- The frontend uses polling for message updates (no WebSockets)

## License

This project is for educational purposes.
