import { useState } from 'react';
import { 
  MessageSquare,
  Search,
  Send,
  Paperclip,
  ArrowLeft,
  User,
  Check,
  CheckCheck,
  Pin,
  Circle
} from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  studentName: string;
  propertyTitle: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  messages: Message[];
  isPinned?: boolean;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'resolution-team',
    studentName: 'Resolution Team',
    propertyTitle: 'Platform Support',
    lastMessage: 'We\'re here to help with any disputes or issues.',
    timestamp: '2m ago',
    unreadCount: 0,
    isOnline: true,
    isPinned: true,
    messages: [
      {
        id: '1',
        senderId: 'resolution-team',
        text: 'Hello! Welcome to the Resolution Team chat. We\'re here to assist you with any disputes, concerns, or platform-related questions.',
        timestamp: '10:30 AM',
        status: 'read'
      },
      {
        id: '2',
        senderId: 'resolution-team',
        text: 'Feel free to reach out anytime. We typically respond within 1-2 hours during business hours.',
        timestamp: '10:31 AM',
        status: 'read'
      }
    ]
  },
  {
    id: '2',
    studentName: 'Michael Chen',
    propertyTitle: 'Modern Studio, Oxford',
    lastMessage: 'Thank you! I\'ll send the rent payment today.',
    timestamp: '5m ago',
    unreadCount: 2,
    isOnline: true,
    messages: [
      {
        id: '1',
        senderId: '2',
        text: 'Hi! I wanted to ask about the rent payment for this month.',
        timestamp: '9:45 AM',
        status: 'read'
      },
      {
        id: '2',
        senderId: 'landlord',
        text: 'Hello Michael! The rent is due by the 5th of each month. You can send it through the wallet.',
        timestamp: '9:50 AM',
        status: 'read'
      },
      {
        id: '3',
        senderId: '2',
        text: 'Thank you! I\'ll send the rent payment today.',
        timestamp: '10:55 AM',
        status: 'delivered'
      }
    ]
  },
  {
    id: '3',
    studentName: 'Sarah Johnson',
    propertyTitle: 'Cozy Apartment, Cambridge',
    lastMessage: 'Perfect! See you then.',
    timestamp: '1h ago',
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: '1',
        senderId: '3',
        text: 'Hi! Is the property still available for viewing?',
        timestamp: 'Yesterday, 3:20 PM',
        status: 'read'
      },
      {
        id: '2',
        senderId: 'landlord',
        text: 'Yes, it is! Would you like to schedule a visit?',
        timestamp: 'Yesterday, 3:25 PM',
        status: 'read'
      },
      {
        id: '3',
        senderId: '3',
        text: 'Yes please! How about tomorrow at 2 PM?',
        timestamp: 'Yesterday, 3:30 PM',
        status: 'read'
      },
      {
        id: '4',
        senderId: 'landlord',
        text: 'Perfect! See you tomorrow at 2 PM. I\'ll send you the exact address.',
        timestamp: 'Yesterday, 3:35 PM',
        status: 'read'
      },
      {
        id: '5',
        senderId: '3',
        text: 'Perfect! See you then.',
        timestamp: '9:30 AM',
        status: 'read'
      }
    ]
  },
  {
    id: '4',
    studentName: 'Emma Williams',
    propertyTitle: 'Student Room, Manchester',
    lastMessage: 'Could we discuss the maintenance issue?',
    timestamp: '3h ago',
    unreadCount: 1,
    isOnline: true,
    messages: [
      {
        id: '1',
        senderId: '4',
        text: 'Hi! There seems to be an issue with the heating system.',
        timestamp: 'Today, 7:00 AM',
        status: 'read'
      },
      {
        id: '2',
        senderId: 'landlord',
        text: 'I\'m sorry to hear that. I\'ll arrange for a technician to check it out.',
        timestamp: 'Today, 7:15 AM',
        status: 'read'
      },
      {
        id: '3',
        senderId: '4',
        text: 'Could we discuss the maintenance issue?',
        timestamp: 'Today, 8:00 AM',
        status: 'delivered'
      }
    ]
  },
  {
    id: '5',
    studentName: 'David Martinez',
    propertyTitle: 'Shared Flat, London',
    lastMessage: 'Thanks for the quick response!',
    timestamp: '1d ago',
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: '1',
        senderId: '5',
        text: 'Is internet included in the rent?',
        timestamp: 'Nov 7, 2:00 PM',
        status: 'read'
      },
      {
        id: '2',
        senderId: 'landlord',
        text: 'Yes! High-speed internet is included in the monthly rent.',
        timestamp: 'Nov 7, 2:10 PM',
        status: 'read'
      },
      {
        id: '3',
        senderId: '5',
        text: 'Thanks for the quick response!',
        timestamp: 'Nov 7, 2:15 PM',
        status: 'read'
      }
    ]
  }
];

export function MessagesPage() {
  const [conversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string>('resolution-team');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const filteredConversations = conversations.filter(conv => 
    conv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.isPinned);
  const regularConversations = filteredConversations.filter(c => !c.isPinned);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-[#8C57FF]" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // In a real app, this would send the message to the backend
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConversationClick = (id: string) => {
    setActiveConversationId(id);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row bg-[#F4F5FA]">
      {/* Left Column - Conversation List */}
      <div className={`${
        showMobileChat ? 'hidden md:flex' : 'flex'
      } md:w-[35%] lg:w-[30%] flex-col bg-white border-r h-full`}>
        {/* Header */}
        <div className="p-4 md:p-6 border-b">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-6 w-6 text-[#8C57FF]" />
            <h2 className="text-[#4A4A68]">Chats</h2>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by student name or property"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C57FF] text-sm"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {/* Pinned Section */}
          {pinnedConversations.length > 0 && (
            <div>
              {pinnedConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleConversationClick(conv.id)}
                  className={`p-4 border-b cursor-pointer hover:bg-[#F4F5FA]/50 transition-colors ${
                    activeConversationId === conv.id ? 'bg-[#8C57FF]/5 border-l-4 border-l-[#8C57FF]' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12 bg-gradient-to-br from-[#8C57FF] to-[#7645E8]">
                        <AvatarFallback className="text-white">
                          {getInitials(conv.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      {conv.isOnline && (
                        <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-[#4A4A68] truncate">{conv.studentName}</p>
                          {conv.isPinned && (
                            <Badge className="bg-[#8C57FF]/10 text-[#8C57FF] border-[#8C57FF]/20 text-xs px-1.5 py-0">
                              <Pin className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 truncate">{conv.propertyTitle}</p>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>

                    {conv.unreadCount > 0 && (
                      <div className="flex-shrink-0">
                        <Badge className="bg-[#8C57FF] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs p-0">
                          {conv.unreadCount}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="border-b-2 border-[#8C57FF]/20"></div>
            </div>
          )}

          {/* Regular Conversations */}
          {regularConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleConversationClick(conv.id)}
              className={`p-4 border-b cursor-pointer hover:bg-[#F4F5FA]/50 transition-colors ${
                activeConversationId === conv.id ? 'bg-[#8C57FF]/5 border-l-4 border-l-[#8C57FF]' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12 bg-gradient-to-br from-gray-400 to-gray-500">
                    <AvatarFallback className="text-white">
                      {getInitials(conv.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  {conv.isOnline && (
                    <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-[#4A4A68] truncate">{conv.studentName}</p>
                    <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1 truncate">{conv.propertyTitle}</p>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>

                {conv.unreadCount > 0 && (
                  <div className="flex-shrink-0">
                    <Badge className="bg-[#8C57FF] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs p-0">
                      {conv.unreadCount}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Active Chat Window */}
      {activeConversation && (
        <div className={`${
          showMobileChat ? 'flex' : 'hidden md:flex'
        } md:flex-1 flex-col bg-white h-full`}>
          {/* Chat Header */}
          <div className="p-4 md:p-6 border-b bg-[#F4F5FA]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="md:hidden -ml-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <div className="relative">
                  <Avatar className={`h-10 w-10 md:h-12 md:w-12 ${
                    activeConversation.isPinned 
                      ? 'bg-gradient-to-br from-[#8C57FF] to-[#7645E8]'
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    <AvatarFallback className="text-white">
                      {getInitials(activeConversation.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  {activeConversation.isOnline && (
                    <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[#4A4A68] text-sm md:text-base">{activeConversation.studentName}</h3>
                    {activeConversation.isPinned && (
                      <Badge className="bg-[#8C57FF]/10 text-[#8C57FF] border-[#8C57FF]/20 text-xs">
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeConversation.isOnline ? (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                        Active now
                      </span>
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>

              {activeConversation.id !== 'resolution-team' && (
                <Button variant="ghost" size="sm" className="text-[#8C57FF] hover:text-[#7645E8]">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">View Profile</span>
                </Button>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {activeConversation.messages.map((message) => {
              const isLandlord = message.senderId === 'landlord';
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isLandlord ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] md:max-w-[70%] ${isLandlord ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isLandlord
                          ? 'bg-[#8C57FF] text-white rounded-br-sm'
                          : 'bg-gray-100 text-[#4A4A68] rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      {isLandlord && getStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input */}
          <div className="p-4 md:p-6 border-t bg-white">
            <div className="flex gap-2 md:gap-3">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-[#8C57FF] flex-shrink-0">
                <Paperclip className="h-5 w-5" />
              </Button>
              
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C57FF] text-sm"
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-[#8C57FF] hover:bg-[#7645E8] flex-shrink-0"
              >
                <Send className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Send</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center md:text-left">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to send
            </p>
          </div>
        </div>
      )}

      {/* Empty State for Desktop when no conversation selected */}
      {!activeConversation && (
        <div className="hidden md:flex flex-1 items-center justify-center bg-white">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-[#4A4A68] mb-2">No Conversation Selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a conversation from the list to start chatting
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
