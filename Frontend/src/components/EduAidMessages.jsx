import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Info } from 'lucide-react';
import NgoDashSidebar from './NgoDashSidebar';
import DashSidebar from './DashSidebar';
import { useParams } from 'react-router-dom';

export default function EduAidMessages() {
  const { ngoId, schoolId } = useParams();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const API_BASE_URL = 'http://localhost:8081/api';

  //  Fetch user conversations on component mount and handle conversation selection
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const authData = localStorage.getItem('authData');
        if (!authData) {
          console.error('No auth data found');
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(authData);
        const userId = parsed?.user?.userId;
        
        if (!userId) {
          console.error('No userId found in auth data');
          setLoading(false);
          return;
        }

        setCurrentUserId(userId);

        const response = await fetch(`${API_BASE_URL}/conversations/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched conversations:', data);
          setConversations(Array.isArray(data) ? data : []);
          
          //  Auto-select conversation if coming from invitation acceptance
          const selectedNgoProjectId = sessionStorage.getItem('selectedNgoProjectId');
          if (selectedNgoProjectId && Array.isArray(data) && data.length > 0) {
            const projectConversation = data.find(conv => 
              conv?.ngoProjectId && conv.ngoProjectId.toString() === selectedNgoProjectId
            );
            if (projectConversation?.conversationId) {
              console.log('Auto-selecting conversation:', projectConversation.conversationId);
              setSelectedConversation(projectConversation.conversationId);
              sessionStorage.removeItem('selectedNgoProjectId');
            } else {
              console.log('No conversation found for project:', selectedNgoProjectId);
              sessionStorage.removeItem('selectedNgoProjectId');
            }
          }
        } else {
          console.error('Failed to fetch conversations:', response.status, await response.text());
          setConversations([]);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      markAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // AI FIX: Fetch messages with proper error handling and validation
  const fetchMessages = async (conversationId) => {
    if (!conversationId) {
      console.error('No conversationId provided');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/messages/conversation/${conversationId}?page=0&size=50`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched messages:', data);
        const messageArray = Array.isArray(data) ? data : (data?.content || []);
        setMessages(messageArray.reverse());
      } else {
        console.error('Failed to fetch messages:', response.status, await response.text());
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  // AI FIX: Mark as read with validation
  const markAsRead = async (conversationId) => {
    if (!conversationId || !currentUserId) {
      console.error('Missing conversationId or currentUserId for markAsRead');
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/conversations/${conversationId}/read?userId=${currentUserId}`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // AI FIX: Send message with proper validation and error handling
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) {
      console.error('Missing required data for sending message');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/messages/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation,
          senderId: currentUserId,
          messageText: newMessage
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        
        // AI FIX: Refresh conversations to update last message preview
        try {
          const convResponse = await fetch(`${API_BASE_URL}/conversations/user/${currentUserId}`);
          if (convResponse.ok) {
            const data = await convResponse.json();
            setConversations(Array.isArray(data) ? data : []);
          }
        } catch (convError) {
          console.error('Error refreshing conversations:', convError);
        }
      } else {
        console.error('Failed to send message:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(p => p.userId !== currentUserId);
  };

  const currentConversation = conversations.find(c => c.conversationId === selectedConversation);

  // Determine user type from localStorage to render appropriate sidebar
  const [userType, setUserType] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Get user type once on mount to prevent infinite re-renders
  useEffect(() => {
    const getUserType = () => {
      try {
        const authData = localStorage.getItem('authData');
        if (authData) {
          const parsed = JSON.parse(authData);
          return parsed.user?.userType;
        }
        return null;
      } catch (error) {
        console.error('Error parsing auth data:', error);
        return null;
      }
    };

    const type = getUserType();
    setUserType(type);
    setAuthLoading(false);
  }, []);

  // Show loading if auth data is not yet determined
  if (authLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Render appropriate sidebar based on user type (NGO or School) */}
      {userType === 'NGO' ? <NgoDashSidebar /> : userType === 'SCHOOL' ? <DashSidebar /> : (
        <div className="w-64 bg-gray-100 p-6 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Invalid user type</p>
        </div>
      )}

      {/* Messages Section */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Messages</h1>
              <p className="text-gray-500 mt-2 text-sm font-medium">Communicate with schools and NGOs about your projects</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-96 bg-white border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-gray-400 text-4xl mb-3">💬</div>
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Conversations will appear here when you accept campaign invitations</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  return (
                    <div 
                      key={`conv-${conv.conversationId}`}
                      onClick={() => setSelectedConversation(conv.conversationId)}
                      className={`p-4 border-b cursor-pointer transition-colors ${
                        selectedConversation === conv.conversationId ? 'bg-green-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                            <span className="text-green-700 font-bold text-lg">
                              {conv.otherUserName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          {conv.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {conv.unreadCount}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-sm truncate">{conv.otherUserName || 'Unknown'}</h3>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {conv.lastMessageAt ? formatTimestamp(conv.lastMessageAt) : ''}
                            </span>
                          </div>
                          {conv.projectName && (
                            <p className="text-xs text-green-600 mb-1 truncate" title={conv.projectName}>
                              📋 {conv.projectName}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 truncate">
                            {conv.lastMessage?.messageText || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                    <span className="text-green-700 font-bold">
                      {currentConversation.otherUserName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{currentConversation.otherUserName || 'Unknown'}</h3>
                    {currentConversation.projectName && (
                      <p className="text-sm text-green-600">📋 {currentConversation.projectName}</p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">No messages yet. Start the conversation!</div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId === currentUserId;
                      return (
                        <div 
                          key={msg.messageId}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="max-w-md">
                            <div className={`rounded-2xl px-4 py-3 ${
                              isOwn 
                                ? 'bg-green-600 text-white' 
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}>
                              {!isOwn && (
                                <div className="text-xs font-semibold mb-1 text-green-600">
                                  {msg.senderName}
                                </div>
                              )}
                              <p className="text-sm">{msg.messageText}</p>
                            </div>
                            <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                              {formatMessageTime(msg.sentAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Bell size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}