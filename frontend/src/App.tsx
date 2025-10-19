import * as React from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import JoinPage from './pages/JoinPage';
import ChatPage from './pages/ChatPage';

export type Message = {
  id: string;
  text: string;
  timestamp: string;
};

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectToChat = () => {
    // Close existing socket if any
    if (socket) {
      socket.disconnect();
    }
    
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      withCredentials: true,
      extraHeaders: {
        'my-custom-header': 'abcd',
      },
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('error');
      newSocket.disconnect();
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              !isConnected ? (
                <JoinPage onJoin={() => connectToChat()} />
              ) : (
                <Navigate to="/chat" />
              )
            }
          />
          <Route
            path="/chat"
            element={
              isConnected && socket ? (
                <ChatPage socket={socket} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
