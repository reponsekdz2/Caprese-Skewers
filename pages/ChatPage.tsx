
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ChatRoom, ChatMessage, User, UserChatInfo, CallType } from '../../types';
import Button from '../../components/common/Button';
import { PlusIcon, UsersIcon, PhoneIcon as CallIcon } from '../../assets/icons';
import ChatListItem from '../../components/chat/ChatListItem';
import ChatMessageBubble from '../../components/chat/ChatMessageBubble';
import ChatHeader from '../../components/chat/ChatHeader';
import MessageInput from '../../components/chat/MessageInput';
import NewChatModal from '../../components/chat/NewChatModal';
// CallModal is now globally available via AdminLayout, no need to import here directly unless specific controls are needed.
// import { CallModal } from '../components/calling/CallModal'; 
import { useCallManager } from '../hooks/useCallManager';

const API_URL = 'http://localhost:3001/api';

const ChatPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const { initiateCall } = useCallManager();
  
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [usersForNewChat, setUsersForNewChat] = useState<User[]>([]);

  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false); // New state for message sending

  const [isConnected, setIsConnected] = useState(false);
  const webSocketRef = useRef<WebSocket | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const connectWebSocket = useCallback(() => {
    if (!user || webSocketRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `ws://${window.location.hostname}:3001?userId=${user.id}`;
    const ws = new WebSocket(wsUrl);
    webSocketRef.current = ws;

    ws.onopen = () => {
      console.log('ChatPage: WebSocket Connected');
      setIsConnected(true);
      if (selectedRoom) {
          ws.send(JSON.stringify({ type: 'subscribe-room', roomId: selectedRoom.id }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data as string);
        console.log('ChatPage: WebSocket message received:', messageData);
        if (messageData.type === 'new-chat-message' && messageData.payload?.roomId === selectedRoom?.id) {
          setMessages(prev => [...prev, messageData.payload]);
          setChatRooms(prevRooms => prevRooms.map(room => 
            room.id === messageData.payload.roomId ? {...room, lastMessage: messageData.payload, updatedAt: messageData.payload.timestamp} : room
          ).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        }
        // Potentially handle other WebSocket message types for chat (typing indicators, read receipts, etc.)
      } catch (error) {
        console.error('ChatPage: Error processing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('ChatPage: WebSocket Disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('ChatPage: WebSocket Error:', error);
      setIsConnected(false);
    };
  }, [user, selectedRoom?.id]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, [connectWebSocket]);


  const fetchChatRooms = useCallback(async () => {
    if (!user) return;
    setLoadingRooms(true);
    try {
      const response = await fetch(`${API_URL}/chat/rooms`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch chat rooms');
      const data: ChatRoom[] = await response.json();
      setChatRooms(data.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load chat rooms.' });
    } finally {
      setLoadingRooms(false);
    }
  }, [user, getAuthHeaders, addToast]);

  const fetchMessages = useCallback(async (roomId: string) => {
    if (!user) return;
    setLoadingMessages(true);
    try {
      const response = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data: ChatMessage[] = await response.json();
      setMessages(data.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load messages for this room.' });
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [user, getAuthHeaders, addToast]);
  
  const fetchUsersForNewChatModal = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch users list');
      const allUsers: User[] = await response.json();
      setUsersForNewChat(allUsers.filter(u => u.id !== user.id));
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load users for new chat.' });
    }
  }, [getAuthHeaders, addToast, user]);

  useEffect(() => {
    fetchChatRooms();
    fetchUsersForNewChatModal();
  }, [fetchChatRooms, fetchUsersForNewChatModal]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({ type: 'subscribe-room', roomId: selectedRoom.id }));
      }
    } else {
      setMessages([]);
    }
    return () => {
      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN && selectedRoom) {
        webSocketRef.current.send(JSON.stringify({ type: 'unsubscribe-room', roomId: selectedRoom.id }));
      }
    };
  }, [selectedRoom, fetchMessages]);

  const handleSelectRoom = (room: ChatRoom) => {
    if (selectedRoom && webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({ type: 'unsubscribe-room', roomId: selectedRoom.id }));
    }
    setSelectedRoom(room);
  };
  
  const handleInitiateCallFromChat = () => {
    if (!selectedRoom || !user) return;
    if (!selectedRoom.isGroupChat) {
      const otherMember = selectedRoom.members.find(member => member.id !== user.id);
      if (otherMember) {
        const targetUser = usersForNewChat.find(u => u.id === otherMember.id); 
        if(targetUser) {
          initiateCall([targetUser], CallType.AUDIO);
        } else {
          addToast({type: 'error', message: 'Could not find user details to start call.'});
        }
      }
    } else {
      // Group call initiation logic would be more complex:
      // 1. Get full User objects for all other members.
      // 2. Call initiateCall with the array of User objects.
      addToast({type: 'info', message: 'Group calls from chat header are not yet fully supported.'});
    }
  };

  const handleSendMessage = async (text: string, file?: File) => {
    if (!user || !selectedRoom || (!text.trim() && !file)) return;
    setSendingMessage(true);
    
    let fileDetails: Partial<ChatMessage> = {};

    if (file) {
        const formData = new FormData();
        formData.append('chatFile', file); // Name must match server's multer field name
        try {
            const uploadResponse = await fetch(`${API_URL}/chat/upload-file`, {
                method: 'POST',
                headers: { ...getAuthHeaders(), /* No Content-Type for FormData */ },
                body: formData,
            });
            if (!uploadResponse.ok) {
                const errData = await uploadResponse.json();
                throw new Error(errData.message || 'File upload failed.');
            }
            const uploadedFileData = await uploadResponse.json();
            fileDetails = {
                fileUrl: uploadedFileData.fileUrl,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
            };
        } catch (uploadError: any) {
            addToast({type: 'error', message: uploadError.message || 'Could not upload file.'});
            setSendingMessage(false);
            return;
        }
    }
    
    try {
      const messagePayload: Partial<ChatMessage> = {
        roomId: selectedRoom.id,
        text: text.trim(),
        ...fileDetails,
      };

      const response = await fetch(`${API_URL}/chat/messages`, {
        method: 'POST',
        headers: getAuthHeaders(), // This should set Content-Type: application/json
        body: JSON.stringify(messagePayload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to send message');
      }
      // Message will be received via WebSocket, no need to manually add to `messages` state here
      // if the WebSocket broadcast is working correctly.
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not send message.' });
    } finally {
        setSendingMessage(false);
    }
  };
  
  const handleStartNewChat = async (selectedUserIds: string[]) => {
    if (!user || selectedUserIds.length === 0) return;
    setIsNewChatModalOpen(false);
    setSendingMessage(true); // Use sendingMessage for this operation as well
    
    if (selectedUserIds.length === 1) {
        const targetUserId = selectedUserIds[0];
        const existingRoom = chatRooms.find(room => 
            !room.isGroupChat && room.members.some(m => m.id === targetUserId)
        );

        if (existingRoom) {
            setSelectedRoom(existingRoom);
            setSendingMessage(false);
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/chat/rooms`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ memberIds: [user.id, targetUserId], isGroupChat: false }),
            });
            if (!response.ok) throw new Error('Failed to create chat room.');
            const newRoom: ChatRoom = await response.json();
            setChatRooms(prev => [newRoom, ...prev].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())); 
            setSelectedRoom(newRoom);
        } catch (error: any) {
            addToast({type: 'error', message: error.message || 'Could not start new chat.'});
        }
    } else {
      // Create Group Chat
       try {
            const groupName = prompt("Enter a name for the new group chat:", "New Group") || "New Group Chat";
            const response = await fetch(`${API_URL}/chat/rooms`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ memberIds: [user.id, ...selectedUserIds], isGroupChat: true, name: groupName }),
            });
            if (!response.ok) throw new Error('Failed to create group chat room.');
            const newRoom: ChatRoom = await response.json();
            setChatRooms(prev => [newRoom, ...prev].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())); 
            setSelectedRoom(newRoom);
        } catch (error: any) {
            addToast({type: 'error', message: error.message || 'Could not start new group chat.'});
        }
    }
    setSendingMessage(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]"> {/* Adjust height based on Navbar */}
      <div className="w-full sm:w-1/3 md:w-1/4 border-r border-secondary-200 dark:border-dark-border bg-secondary-50 dark:bg-dark-card flex flex-col">
        <div className="p-4 border-b border-secondary-200 dark:border-dark-border">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-semibold text-secondary-800 dark:text-dark-text">Chats</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsNewChatModalOpen(true)} title="Start new chat">
              <PlusIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </Button>
          </div>
          <div className="flex items-center text-xs text-secondary-500 dark:text-secondary-400">
            <span className={`w-2.5 h-2.5 rounded-full mr-1.5 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {loadingRooms ? (
            <p className="p-4 text-center text-secondary-500 dark:text-secondary-400">Loading chats...</p>
          ) : chatRooms.length > 0 ? (
            chatRooms.map(room => (
              <ChatListItem 
                key={room.id} 
                room={room} 
                isSelected={selectedRoom?.id === room.id}
                onSelectRoom={handleSelectRoom}
                currentUser={user}
              />
            ))
          ) : (
            <p className="p-4 text-center text-secondary-500 dark:text-secondary-400">No chats yet. Start a new conversation!</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-secondary-800">
        {selectedRoom && user ? (
          <>
            <ChatHeader room={selectedRoom} currentUser={user} onInitiateCall={handleInitiateCallFromChat} />
            <div className="flex-grow p-4 overflow-y-auto space-y-2 bg-secondary-100 dark:bg-secondary-900">
              {loadingMessages ? (
                <p className="text-center text-secondary-500 dark:text-secondary-400">Loading messages...</p>
              ) : messages.length > 0 ? (
                messages.map(msg => (
                  <ChatMessageBubble key={msg.id} message={msg} currentUser={user} />
                ))
              ) : (
                <p className="text-center text-secondary-500 dark:text-secondary-400">No messages in this chat yet. Send the first one!</p>
              )}
              <div ref={messagesEndRef} />
            </div>
            <MessageInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-secondary-100 dark:bg-secondary-900">
            <UsersIcon className="w-24 h-24 text-secondary-300 dark:text-secondary-600 mb-4" />
            <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">Welcome to School Chat</h2>
            <p className="text-secondary-500 dark:text-secondary-400">Select a chat to start messaging or create a new one.</p>
          </div>
        )}
      </div>
      
      {isNewChatModalOpen && usersForNewChat && user && ( 
        <NewChatModal
          isOpen={isNewChatModalOpen}
          onClose={() => setIsNewChatModalOpen(false)}
          users={usersForNewChat}
          onStartChat={handleStartNewChat}
          currentUser={user}
        />
      )}
      {/* CallModal is now rendered globally in AdminLayout */}
    </div>
  );
};

export default ChatPage;
