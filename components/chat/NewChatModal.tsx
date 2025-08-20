import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { User } from '../../types';
import { UsersIcon } from '../../assets/icons';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onStartChat: (selectedUserIds: string[]) => void;
  currentUser: User | null;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, users, onStartChat, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users.filter(u => u.id !== currentUser?.id); // Exclude self
    return users.filter(
      (user) =>
        user.id !== currentUser?.id && // Exclude self
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [users, searchTerm, currentUser]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleConfirmStartChat = () => {
    if (selectedUserId) {
      onStartChat([selectedUserId]);
      setSelectedUserId(null);
      setSearchTerm('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start New Chat" size="md">
      <Input
        id="searchUser"
        type="text"
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        containerClassName="mb-4"
      />
      <div className="max-h-72 overflow-y-auto border rounded-md divide-y divide-secondary-200">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user.id)}
              className={`p-3 flex items-center cursor-pointer hover:bg-secondary-100 ${
                selectedUserId === user.id ? 'bg-primary-100' : ''
              }`}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover mr-3" />
              ) : (
                <span className="w-8 h-8 rounded-full bg-secondary-300 flex items-center justify-center text-secondary-600 font-semibold mr-3">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-sm font-medium text-secondary-800">{user.name}</p>
                <p className="text-xs text-secondary-500">{user.email || user.phone} - {user.role}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-secondary-500">No users found matching your search.</p>
        )}
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button 
            variant="primary" 
            onClick={handleConfirmStartChat} 
            disabled={!selectedUserId}
        >
          Start Chat
        </Button>
      </div>
    </Modal>
  );
};

export default NewChatModal;
