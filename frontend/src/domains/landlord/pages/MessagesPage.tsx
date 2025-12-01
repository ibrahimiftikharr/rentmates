import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Search, Pin, Send, Paperclip, ArrowLeft, Check, CheckCheck, Circle, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { messageService, Conversation, Message } from '@/shared/services/messageService';
import { socketService } from '@/shared/services/socketService';
import { authService } from '@/domains/auth/services/authService';
import { toast } from '@/shared/utils/toast';

export function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchConversations();
    setupSocketListeners();

    return () => {
      socketService.off('new_message');
      socketService.off('messages_read');
      socketService.off('messages_delivered');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const setupSocketListeners = () => {
    socketService.on('new_message', (data: any) => {
      const { conversationId, message } = data;
      
      // Add message to chat if we're viewing this conversation
      // Check against current state using a callback to avoid closure issues
      setActiveConversationId(currentActive => {
        if (currentActive === message.senderId) {
          setMessages(prev => [...prev, message]);
          markMessagesAsRead(conversationId);
        }
        return currentActive; // Don't actually change the state
      });
      
      // Always refresh conversations list to update last message and unread count
      fetchConversations();
    });

    socketService.on('messages_read', (data: any) => {
      const { readBy } = data;
      
      if (activeConversationId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.senderId === currentUser?.id && msg.recipientId === readBy
              ? { ...msg, status: 'read' as const }
              : msg
          )
        );
      }
    });

    socketService.on('messages_delivered', (data: any) => {
      const { deliveredBy } = data;
      
      if (activeConversationId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.senderId === currentUser?.id && msg.recipientId === deliveredBy && msg.status === 'sent'
              ? { ...msg, status: 'delivered' as const }
              : msg
          )
        );
      }
    });
  };

  const fetchConversations = async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (recipientId: string) => {
    try {
      setIsLoadingMessages(true);
      const data = await messageService.getMessages(recipientId);
      setMessages(data);
      
      const conversation = conversations.find(c => c.recipientId === recipientId);
      if (conversation && conversation.unreadCount > 0) {
        await markMessagesAsRead(conversation.conversationId);
      }
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await messageService.markAsRead(conversationId);
      setConversations(prev =>
        prev.map(conv =>
          conv.conversationId === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error: any) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversationId || isSending) return;

    try {
      setIsSending(true);
      const message = await messageService.sendMessage(activeConversationId, messageInput.trim());
      
      setMessages(prev => [...prev, message]);
      setMessageInput('');
      fetchConversations();
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!activeConversationId) return;

    try {
      setUploadingImage(true);
      const { mediaUrl } = await messageService.uploadMedia(file);
      const message = await messageService.sendMessage(activeConversationId, 'Image', 'image', mediaUrl);
      
      setMessages(prev => [...prev, message]);
      fetchConversations();
      toast.success('Image sent');
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to send image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Only images are supported');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      handleImageUpload(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleConversationClick = async (conv: Conversation) => {
    setActiveConversationId(conv.recipientId);
    setSelectedUserInfo({
      recipientId: conv.recipientId,
      recipientName: conv.recipientName,
      recipientRole: conv.recipientRole,
      recipientProfileImage: conv.recipientProfileImage
    });
    setShowMobileChat(true);
    await fetchMessages(conv.recipientId);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setActiveConversationId(null);
    setSelectedUserInfo(null);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await messageService.searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartConversation = async (user: any) => {
    try {
      setActiveConversationId(user.id);
      setSelectedUserInfo({
        recipientId: user.id,
        recipientName: user.name,
        recipientRole: user.role,
        recipientProfileImage: user.profileImage
      });
      setShowMobileChat(true);
      setSearchQuery('');
      setSearchResults([]);
      await fetchMessages(user.id);
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv => 
    conv.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find(c => c.recipientId === activeConversationId) || selectedUserInfo;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8C57FF]" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row bg-[#F4F5FA]">
      <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} md:w-[35%] lg:w-[30%] flex-col bg-white border-r h-full`}>
        <div className="p-4 md:p-6 border-b">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-6 w-6 text-[#8C57FF]" />
            <h2 className="text-[#4A4A68]">Chats</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search for users to chat with..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C57FF] text-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Resolution Team - Hardcoded and pinned */}
          {!searchQuery && (
            <>
              <div className="p-4 border-b cursor-pointer hover:bg-[#F4F5FA]/50 transition-colors">
                <div className="flex gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12 bg-gradient-to-br from-[#8C57FF] to-[#7645E8]">
                      <AvatarFallback className="text-white">
                        <MessageSquare className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-[#4A4A68] truncate">Resolution Team</p>
                      <Badge className="bg-[#8C57FF]/10 text-[#8C57FF] border-[#8C57FF]/20 text-xs px-1.5 py-0">
                        <Pin className="h-3 w-3" />
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 truncate">Platform Support</p>
                    <p className="text-sm text-muted-foreground truncate">We're here to help with any issues</p>
                  </div>
                </div>
              </div>
              <div className="border-b-2 border-[#8C57FF]/20"></div>
            </>
          )}

          {/* Show search results when searching */}
          {searchQuery.trim().length >= 2 ? (
            isSearching ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#8C57FF] mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Searching...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No users found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 bg-[#F4F5FA]/50 border-b">
                  <p className="text-xs font-medium text-muted-foreground">Search Results</p>
                </div>
                {searchResults.map((user) => (
                  <div key={user.id} onClick={() => handleStartConversation(user)} className="p-4 border-b cursor-pointer hover:bg-[#F4F5FA]/50 transition-colors">
                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12 bg-gradient-to-br from-gray-400 to-gray-500">
                          {user.profileImage ? (
                            <AvatarImage src={user.profileImage} />
                          ) : (
                            <AvatarFallback className="text-white">{getInitials(user.name)}</AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#4A4A68] truncate">{user.name}</p>
                        <Badge variant="outline" className="mb-1 text-xs">
                          {user.role === 'student' ? 'Student' : 'Landlord'}
                        </Badge>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )
          ) : (
            /* Show existing conversations when not searching */
            filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Search for users to start chatting</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div key={conv.conversationId} onClick={() => handleConversationClick(conv)} className={`p-4 border-b cursor-pointer hover:bg-[#F4F5FA]/50 transition-colors ${activeConversationId === conv.recipientId ? 'bg-[#8C57FF]/5 border-l-4 border-l-[#8C57FF]' : ''}`}>
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12 bg-gradient-to-br from-gray-400 to-gray-500">
                        {conv.recipientProfileImage ? (
                          <AvatarImage src={conv.recipientProfileImage} />
                        ) : (
                          <AvatarFallback className="text-white">{getInitials(conv.recipientName)}</AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-[#4A4A68] truncate">{conv.recipientName}</p>
                        <span className="text-xs text-muted-foreground">{getTimeAgo(conv.lastMessageTimestamp)}</span>
                      </div>
                      <Badge variant="outline" className="mb-1 text-xs">{conv.recipientRole === 'student' ? 'Student' : 'Landlord'}</Badge>
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
              ))
            )
          )}
        </div>
      </div>

      {activeConversation && (
        <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} md:flex-1 flex-col bg-white h-full`}>
          <div className="p-4 md:p-6 border-b bg-[#F4F5FA]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleBackToList} className="md:hidden -ml-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative">
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-br from-gray-400 to-gray-500">
                    {activeConversation.recipientProfileImage ? (
                      <AvatarImage src={activeConversation.recipientProfileImage} />
                    ) : (
                      <AvatarFallback className="text-white">{getInitials(activeConversation.recipientName)}</AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <div>
                  <h3 className="text-[#4A4A68] text-sm md:text-base">{activeConversation.recipientName}</h3>
                  <Badge variant="outline" className="text-xs">{activeConversation.recipientRole === 'student' ? 'Student' : 'Landlord'}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-[#8C57FF]" />
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isLandlord = message.senderId === currentUser?.id;
                  return (
                    <div key={message.id} className={`flex ${isLandlord ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] ${isLandlord ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`px-4 py-2 rounded-2xl ${isLandlord ? 'bg-[#8C57FF] text-white rounded-br-sm' : 'bg-gray-100 text-[#4A4A68] rounded-bl-sm'}`}>
                          {message.messageType === 'image' && message.mediaUrl ? (
                            <img src={message.mediaUrl} alt="Shared image" className="max-w-full rounded-lg mb-2" />
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 px-2">
                          <span className="text-xs text-muted-foreground">{formatMessageTime(message.timestamp)}</span>
                          {isLandlord && getStatusIcon(message.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="p-4 md:p-6 border-t bg-white">
            <div className="flex gap-2 md:gap-3">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-[#8C57FF] flex-shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
              </Button>
              <input type="text" placeholder="Type a message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyPress={handleKeyPress} disabled={isSending} className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C57FF] text-sm" />
              <Button onClick={handleSendMessage} disabled={!messageInput.trim() || isSending} className="bg-[#8C57FF] hover:bg-[#7645E8] flex-shrink-0">
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 md:mr-2" />}
                <span className="hidden md:inline">Send</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center md:text-left">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to send
            </p>
          </div>
        </div>
      )}

      {!activeConversation && (
        <div className="hidden md:flex flex-1 items-center justify-center bg-white">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-[#4A4A68] mb-2">No Conversation Selected</h3>
            <p className="text-sm text-muted-foreground">Select a conversation from the list to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
