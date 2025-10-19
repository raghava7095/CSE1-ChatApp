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
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Class Chat</h1>
            <div className="flex items-center mt-1">
              <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-1.5`}></span>
              <span className="text-xs text-gray-500">
                {isConnected ? `${onlineUsers} ${onlineUsers === 1 ? 'person' : 'people'} online` : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-1.5`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
              onClick={() => handleReplyClick(message)}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${
                  message.isCurrentUser
                    ? 'bg-blue-500 text-white rounded-br-none ml-16'
                    : 'bg-white text-gray-800 rounded-bl-none mr-16 shadow-sm border border-gray-200'
                }`}
              >
                {message.replyTo && (
                  <div className={`text-xs p-2 mb-2 rounded ${
                    message.isCurrentUser ? 'bg-blue-600/90' : 'bg-gray-100 border border-gray-200'
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
                <p className="text-sm break-words">{message.text}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs opacity-75">
                    {!message.isCurrentUser && `User-${message.senderId.slice(-4)} • `}
                    {!message.isCurrentUser && format(new Date(message.timestamp), 'h:mm a')}
                  </span>
                  {message.isCurrentUser && (
                    <span className="text-xs opacity-75">
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        {replyingTo && (
          <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Replying to <span className="font-medium">
                {replyingTo.senderId === currentUserId ? 'yourself' : `User-${replyingTo.senderId.slice(-4)}`}
              </span>: {replyingTo.text.length > 30 ? `${replyingTo.text.substring(0, 30)}...` : replyingTo.text}
            </div>
            <button
              onClick={cancelReply}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Cancel reply"
            >
              ✕
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center p-4 border-t">
          <input
            type="text"
            id="message-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={replyingTo ? 'Type your reply...' : 'Type a message...'}
            className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
