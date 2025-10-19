import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export type Message = {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
  isCurrentUser?: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderId: string;
  };
  senderName?: string;
};

interface ChatPageProps {
  socket: Socket;
}

const ChatPage = ({ socket }: ChatPageProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(1); // Start with 1 (current user)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    console.log('Messages updated:', messages);
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set up socket event listeners
    const onConnect = () => {
      console.log('Connected to chat');
      setIsConnected(true);
      // Send the current user ID to the server when connected
      socket.emit('set-user-id', currentUserId);
    };

    const onUserCountUpdate = (data: { count: number }) => {
      setOnlineUsers(data.count);
    };

    const onDisconnect = () => {
      console.log('Disconnected from chat');
      setIsConnected(false);
    };

    const onPreviousMessages = (previousMessages: Message[]) => {
      console.log('Received previous messages:', previousMessages);
      setMessages(previousMessages.map(msg => ({
        ...msg,
        isCurrentUser: msg.senderId === currentUserId
      })));
    };

    // Request previous messages when component mounts
    socket.emit('request-previous-messages');

    const onNewMessage = (message: Message & { senderId?: string }) => {
      setMessages((prev) => [...prev, {
        ...message,
        isCurrentUser: message.senderId === currentUserId
      }]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('previous-messages', onPreviousMessages);
    socket.on('new-message', onNewMessage);
    socket.on('user-count-update', onUserCountUpdate);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('previous-messages', onPreviousMessages);
      socket.off('new-message', onNewMessage);
    };
  }, [socket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      timestamp: new Date().toISOString(),
      senderId: currentUserId,
      isCurrentUser: true,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        senderId: replyingTo.senderId,
      } : undefined,
      senderName: `User-${currentUserId.slice(-4)}`
    };

    socket.emit('send-message', message);
    setNewMessage('');
    setReplyingTo(null);
  };

  const handleReplyClick = (message: Message) => {
    setReplyingTo(message);
    // Optionally scroll to input
    document.getElementById('message-input')?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Class Chat</h1>
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-1.5`}></span>
                <span className="text-xs text-gray-500">
                  {isConnected ? `${onlineUsers} ${onlineUsers === 1 ? 'person' : 'people'} online` : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-1.5`}></span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No messages yet</h3>
            <p className="text-sm max-w-xs">Be the first to say hello! Your messages will appear here.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
              onClick={() => handleReplyClick(message)}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] px-4 py-2.5 rounded-2xl cursor-pointer transition-all duration-200 ${
                  message.isCurrentUser
                    ? 'bg-blue-500 text-white rounded-br-sm hover:bg-blue-600'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {message.replyTo && (
                  <div className={`text-xs p-2 mb-2 rounded-lg ${
                    message.isCurrentUser 
                      ? 'bg-blue-600/80 text-blue-50' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    <div className="font-medium truncate">
                      {message.replyTo.senderId === currentUserId ? 'You' : `User-${message.replyTo.senderId.slice(-4)}`}
                    </div>
                    <div className={`truncate ${message.isCurrentUser ? 'opacity-90' : 'text-gray-600'}`}>
                      {message.replyTo.text.length > 50
                        ? `${message.replyTo.text.substring(0, 50)}...`
                        : message.replyTo.text}
                    </div>
                  </div>
                )}
                <p className="text-sm sm:text-base break-words">{message.text}</p>
                <div className={`flex items-center mt-1.5 text-xs ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  {!message.isCurrentUser && (
                    <span className="font-medium mr-1.5">
                      User-{message.senderId.slice(-4)}
                    </span>
                  )}
                  <span className={`opacity-70 ${message.isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    {format(new Date(message.timestamp), 'h:mm a')}
                  </span>
                  {message.isCurrentUser && (
                    <span className="ml-1.5">
                      {message.isCurrentUser && (
                        <svg className="h-3.5 w-3.5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-4 sm:h-6" />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200">
        {replyingTo && (
          <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
            <div className="text-sm text-blue-800 flex-1 truncate pr-4">
              <span className="font-medium">Replying to {replyingTo.senderId === currentUserId ? 'yourself' : `User-${replyingTo.senderId.slice(-4)}`}:</span>{' '}
              <span className="text-blue-700">{replyingTo.text.length > 30 ? `${replyingTo.text.substring(0, 30)}...` : replyingTo.text}</span>
            </div>
            <button
              onClick={cancelReply}
              className="text-blue-500 hover:text-blue-700 p-1 -mr-1 rounded-full hover:bg-blue-100"
              aria-label="Cancel reply"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4">
          <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 transition-all duration-200">
            <input
              type="text"
              id="message-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyingTo ? 'Type your reply...' : 'Type a message...'}
              className="flex-1 bg-transparent border-0 focus:ring-0 text-sm sm:text-base placeholder-gray-400 text-gray-900 outline-none"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={`ml-2 p-2 rounded-full ${newMessage.trim() ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-400'} transition-colors duration-200`}
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5 transform rotate-45" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
