# Anonymous Class Chat

A real-time, anonymous chat application for classrooms with password protection.

## Features

- Single shared chat room
- Password protection
- Real-time messaging
- No usernames or accounts needed
- Clean, responsive UI

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, bcrypt
- **Development**: Vite

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher) or yarn

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the `PASSWORD_HASH` with a new bcrypt hash if needed

4. Start the development server:
   ```bash
   npm run dev
   ```
   The backend will be available at `http://localhost:3001`

### Frontend Setup

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

## Usage

1. Open the application in your browser (default: http://localhost:5173)
2. Enter the password to join the chat
3. Start sending and receiving messages in real-time

## Default Password

The default password is `classroom123`. To generate a new password hash:

```bash
# Using Node.js
node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
```

Then update the `PASSWORD_HASH` in the backend's `.env` file.

## Project Structure

```
class-chat/
├── backend/               # Backend server code
│   ├── node_modules/
│   ├── server.js         # Main server file
│   ├── package.json
│   └── .env              # Environment variables
└── frontend/             # Frontend React app
    ├── public/
    ├── src/
    │   ├── components/   # Reusable components
    │   ├── pages/        # Page components
    │   ├── App.tsx       # Main App component
    │   └── main.tsx      # Entry point
    ├── package.json
    └── vite.config.ts
```

## Available Scripts

### Backend

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload

### Frontend

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build

## License

MIT
