
import React from 'react';
import { ChatRoom, User, UserChatInfo } from '../../types';
import { UsersIcon, PhoneIcon as CallIcon } from '../../assets/icons'; // Default for group chat
import Button from '../common/Button';

interface ChatHeaderProps {
  room: ChatRoom;
  currentUser: User;
  onInitiateCall?: () => void; // Optional callback to initiate call
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ room, currentUser, onInitiateCall }) => {
  const getDisplayInfo = () => {
    if (room.isGroupChat) {
      return {
        name: room.name,
        avatar: room.avatar || null,
      };
    } else {
      const otherMember = room.members.find(member => member.id !== currentUser.id);
      return {
        name: otherMember ? otherMember.name : 'Unknown User',
        avatar: otherMember ? otherMember.avatar : null,
      };
    }
  };

  const { name, avatar } = getDisplayInfo();

  return (
    <div className="flex items-center justify-between p-3 border-b border-secondary-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm">
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-3">
          {avatar ? (
            <img className="w-10 h-10 rounded-full object-cover" src={avatar} alt={name} />
          ) : (
            <span className="w-10 h-10 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center text-white font-semibold">
              {room.isGroupChat ? <UsersIcon className="w-6 h-6" /> : name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="text-md font-semibold text-secondary-800 dark:text-dark-text">{name}</p>
          {/* Status can be added here if presence is implemented */}
        </div>
      </div>
      {!room.isGroupChat && onInitiateCall && (
        <Button variant="ghost" size="sm" onClick={onInitiateCall} aria-label={`Call ${name}`} title={`Call ${name}`}>
          <CallIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </Button>
      )}
    </div>
  );
};

export default ChatHeader;
