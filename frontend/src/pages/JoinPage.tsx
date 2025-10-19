import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface JoinPageProps {
  onJoin: () => void;
}

const JoinPage = ({ onJoin }: JoinPageProps) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Sending request to /api/join');
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/join`, { password });
      console.log('Response received:', response.data);
      
      if (response.data.success) {
        console.log('Login successful, navigating to /chat');
        onJoin();
        navigate('/chat');
      } else {
        console.log('Invalid password response');
        setError('Invalid password. Please try again.');
      }
    } catch (err) {
      console.error('Error joining chat:', err);
      setError('Failed to connect to the chat. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Class Chat
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the password to join the anonymous chat room
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Joining...' : 'Join Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinPage;
