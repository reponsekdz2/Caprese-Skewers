import React from 'react';
import { ChatRoom, User, UserChatInfo } from '../../types';
import { UsersIcon } from '../../assets/icons'; // Default group icon

interface ChatListItemProps {
  room: ChatRoom;
  isSelected: boolean;
  onSelectRoom: (room: ChatRoom) => void;
  currentUser: User | null;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ room, isSelected, onSelectRoom, currentUser }) => {
  if (!currentUser) return null;

  const getDisplayInfo = () => {
    if (room.isGroupChat) {
      return {
        name: room.name,
        avatar: room.avatar || null, // Placeholder for group avatar logic
      };
    } else {
      // For 1-on-1 chat, find the other member
      const otherMember = room.members.find(member => member.id !== currentUser.id);
      return {
        name: otherMember ? otherMember.name : 'Unknown User',
        avatar: otherMember ? otherMember.avatar : null,
      };
    }
  };

  const { name, avatar } = getDisplayInfo();
  const lastMessageText = room.lastMessage?.text ? 
    (room.lastMessage.text.length > 30 ? room.lastMessage.text.substring(0, 27) + '...' : room.lastMessage.text) 
    : room.lastMessage?.fileName ? `Attachment: ${room.lastMessage.fileName}` : 'No messages yet';
  
  const unreadCount = room.unreadCounts && room.unreadCounts[currentUser.id] > 0 ? room.unreadCounts[currentUser.id] : 0;

  return (
    <div
      onClick={() => onSelectRoom(room)}
      className={`flex items-center p-3 hover:bg-secondary-200 cursor-pointer border-b border-secondary-100 ${
        isSelected ? 'bg-primary-100' : 'bg-secondary-50'
      }`}
      aria-current={isSelected ? "page" : undefined}
    >
      <div className="flex-shrink-0 mr-3">
        {avatar ? (
          <img className="w-10 h-10 rounded-full object-cover" src={avatar} alt={name} />
        ) : (
          <span className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
            {room.isGroupChat ? <UsersIcon className="w-6 h-6" /> : name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary-700' : 'text-secondary-800'}`}>{name}</p>
          {room.lastMessage && (
            <p className="text-xs text-secondary-400">{new Date(room.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-secondary-500 truncate">{lastMessageText}</p>
          {unreadCount > 0 && (
             <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full">{unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
