import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Search, Pin, ArrowLeft, Paperclip, Send, CheckCheck, Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { messageService, Conversation, Message } from '@/shared/services/messageService';
import { socketService } from '@/shared/services/socketService';
import { authService } from '@/domains/auth/services/authService';
import { toast } from '@/shared/utils/toast';

export function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
      setSelectedConversation(currentSelected => {
        if (currentSelected === message.senderId) {
          setMessages(prev => [...prev, message]);
          markMessagesAsRead(conversationId);
        }
        return currentSelected; // Don't actually change the state
      });
      
      // Always refresh conversations list to update last message and unread count
      fetchConversations();
    });

    socketService.on('messages_read', (data: any) => {
      const { readBy } = data;
      
      if (selectedConversation) {
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
      
      if (selectedConversation) {
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
    if (!messageInput.trim() || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
      const message = await messageService.sendMessage(selectedConversation, messageInput.trim());
      
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
    if (!selectedConversation) return;

    try {
      setUploadingImage(true);
      const { mediaUrl } = await messageService.uploadMedia(file);
      const message = await messageService.sendMessage(selectedConversation, 'Image', 'image', mediaUrl);
      
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

  const getStatusIcon = (status?: 'sent' | 'delivered' | 'read') => {
    if (status === 'read') return <CheckCheck className="w-3 h-3 text-[#8C57FF]" />;
    if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-gray-400" />;
    if (status === 'sent') return <Check className="w-3 h-3 text-gray-400" />;
    return null;
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
    setSelectedConversation(conv.recipientId);
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
    setSelectedConversation(null);
    setSelectedUserInfo(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      setSelectedConversation(user.id);
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

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return conv.recipientName.toLowerCase().includes(query) || conv.lastMessage.toLowerCase().includes(query);
  });

  const activeConversation = conversations.find((conv) => conv.recipientId === selectedConversation) || selectedUserInfo;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <Input placeholder="Search for users to chat with..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Resolution Team - Hardcoded and pinned */}
          {!searchQuery && (
            <>
              <button className="w-full p-3 rounded-lg text-left transition-all hover:bg-muted/50 border-b">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-primary/30">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        <MessageSquare className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">Resolution Team</p>
                      <Pin className="w-3 h-3 text-primary flex-shrink-0" />
                    </div>
                    <Badge variant="outline" className="mb-1 text-xs bg-primary/5 text-primary border-primary/30">Pinned</Badge>
                    <p className="text-xs text-green-600 mb-1">🟢 Active now</p>
                    <p className="text-sm text-muted-foreground truncate">We're here to help with any issues</p>
                  </div>
                </div>
              </button>
              <div className="border-b my-2"></div>
            </>
          )}

          {/* Show search results when searching */}
          {searchQuery.trim().length >= 2 ? (
            isSearching ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
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
                  <button key={user.id} onClick={() => handleStartConversation(user)} className="w-full p-3 rounded-lg text-left transition-all hover:bg-muted/50">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        {user.profileImage && <AvatarImage src={user.profileImage} />}
                        <AvatarFallback className="bg-gray-100">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user.name}</p>
                        <Badge variant="outline" className="mb-1 text-xs">
                          {user.role === 'student' ? 'Student' : 'Landlord'}
                        </Badge>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </button>
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
                <button key={conv.conversationId} onClick={() => handleConversationClick(conv)} className={`w-full p-3 rounded-lg text-left transition-all ${selectedConversation === conv.recipientId ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}>
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      {conv.recipientProfileImage && <AvatarImage src={conv.recipientProfileImage} />}
                      <AvatarFallback className="bg-gray-100">{getInitials(conv.recipientName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold truncate">{conv.recipientName}</p>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="mb-1 text-xs">{conv.recipientRole === 'student' ? 'Student' : 'Landlord'}</Badge>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(conv.lastMessageTimestamp)}</p>
                    </div>
                  </div>
                </button>
              ))
            )
          )}
        </div>
      </div>

      {activeConversation && (
        <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} md:flex-1 flex-col bg-white h-full`}>
          <Card className="shadow-lg h-full flex flex-col border-0 rounded-none">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="lg:hidden -ml-2" onClick={handleBackToList}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-12 h-12">
                  {activeConversation.recipientProfileImage && <AvatarImage src={activeConversation.recipientProfileImage} />}
                  <AvatarFallback className="bg-gray-100">{getInitials(activeConversation.recipientName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{activeConversation.recipientName}</h3>
                  <p className="text-sm text-muted-foreground">{activeConversation.recipientRole === 'student' ? 'Student' : 'Landlord'}</p>
                </div>
              </div>
            </div>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isSent = message.senderId === currentUser?.id;
                    return (
                      <div key={message.id} className={`flex gap-3 ${isSent ? 'justify-end' : 'justify-start'}`}>
                        {!isSent && (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            {activeConversation.recipientProfileImage && <AvatarImage src={activeConversation.recipientProfileImage} />}
                            <AvatarFallback className="bg-gray-100 text-xs">{getInitials(activeConversation.recipientName)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isSent ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                          {message.messageType === 'image' && message.mediaUrl ? (
                            <img src={message.mediaUrl} alt="Shared image" className="max-w-full rounded-lg mb-2" />
                          ) : (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <p className={`text-xs ${isSent ? 'text-white/70' : 'text-gray-500'}`}>{formatMessageTime(message.timestamp)}</p>
                            {isSent && getStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>

            <div className="p-4 border-t border-border bg-white">
              <div className="flex gap-2 items-end">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <Button variant="outline" size="icon" className="flex-shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : <Paperclip className="w-5 h-5 text-gray-500" />}
                </Button>
                <div className="flex-1 relative">
                  <Input placeholder="Type a message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyPress={handleKeyPress} disabled={isSending} className="pr-24" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hidden sm:inline">Press Enter ↵</span>
                </div>
                <Button onClick={handleSendMessage} disabled={isSending || !messageInput.trim()} className="bg-primary hover:bg-primary/90 flex-shrink-0 gap-2">
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!activeConversation && !showMobileChat && (
        <div className="hidden md:flex flex-1 items-center justify-center bg-white">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Conversation Selected</h3>
            <p className="text-sm text-muted-foreground">Select a conversation from the list to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
