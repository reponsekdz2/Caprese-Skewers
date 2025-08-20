
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { SchoolMessage, UserRole, User } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { BellIcon as PageIcon, PlusIcon, UsersIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const HeadTeacherCommunicationPage: React.FC = () => {
  const [sentMessages, setSentMessages] = useState<SchoolMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]); // For selecting specific users
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMessageData, setNewMessageData] = useState<{ title: string; content: string; targetAudience: 'all' | UserRole[] | 'specific_users'; targetUserIds?: string[]; targetClassIds?: string[] }>({
    title: '',
    content: '',
    targetAudience: 'all',
    targetUserIds: [],
  });
  const [loading, setLoading] = useState(false);
  
  const { user: currentUser, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchSentMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/communication/messages`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch sent messages');
      const data: SchoolMessage[] = await response.json();
      setSentMessages(data.sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
    } catch (error) {
      console.error("Fetch messages error:", error);
      addToast({ type: 'error', message: 'Failed to load sent messages.' });
    } finally {
      setLoading(false);
    }
  }, [addToast, getAuthHeaders]);

  const fetchUsersForSelection = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch users list');
      const data: User[] = await response.json();
      setUsers(data);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load users for targeting.' });
    }
  }, [addToast, getAuthHeaders]);


  useEffect(() => {
    fetchSentMessages();
    fetchUsersForSelection();
  }, [fetchSentMessages, fetchUsersForSelection]);

  const handleInputChange = (key: keyof typeof newMessageData, value: string | string[] | UserRole[] | 'all' | 'specific_users') => {
    setNewMessageData((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleTargetAudienceChange = (value: string) => {
    const currentAudience = newMessageData.targetAudience;

    if (value === 'all' || value === 'specific_users') {
        handleInputChange('targetAudience', value as 'all' | 'specific_users');
    } else { 
        const roleValue = value as UserRole;
        let newAudienceArray: UserRole[];

        if (Array.isArray(currentAudience)) {
            if (currentAudience.includes(roleValue)) {
                newAudienceArray = currentAudience.filter(r => r !== roleValue);
            } else {
                newAudienceArray = [...currentAudience, roleValue];
            }
        } else { 
            newAudienceArray = [roleValue];
        }
        
        if (newAudienceArray.length === 0 && currentAudience !== 'all' && currentAudience !== 'specific_users') {
             handleInputChange('targetAudience', 'all'); // Default to 'all' if all roles are deselected
        } else {
            handleInputChange('targetAudience', newAudienceArray);
        }
    }

    if (value !== 'specific_users' && newMessageData.targetAudience !== 'specific_users') {
        handleInputChange('targetUserIds', []);
    }
};


  const handleSendMessage = async () => {
    if (!newMessageData.title || !newMessageData.content) {
      addToast({ type: 'error', message: 'Title and Content are required for a message.' });
      return;
    }
    if (newMessageData.targetAudience === 'specific_users' && (!newMessageData.targetUserIds || newMessageData.targetUserIds.length === 0)) {
        addToast({ type: 'error', message: 'Please select specific users if "Specific Users" audience is chosen.' });
        return;
    }
    
    setLoading(true);
    try {
      const payload = { ...newMessageData, senderId: currentUser?.id };
      const response = await fetch(`${API_URL}/communication/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to send message');
      }
      addToast({ type: 'success', message: 'Message sent successfully!' });
      fetchSentMessages();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setNewMessageData({ title: '', content: '', targetAudience: 'all', targetUserIds: [] });
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const audienceOptions = [
    { value: 'all', label: 'All Users' },
    ...Object.values(UserRole).map(role => ({ value: role, label: role })),
    { value: 'specific_users', label: 'Specific Users' },
  ];

  const userOptionsForSelect = users.map(u => ({ value: u.id, label: `${u.name} (${u.email || u.phone} - ${u.role})`}));


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center"><PageIcon className="w-8 h-8 mr-2 text-primary-600" />School Communication Center</h1>
        <Button onClick={openModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto">
          Compose New Message
        </Button>
      </div>

      {loading && sentMessages.length === 0 ? <p className="text-center py-8">Loading sent messages...</p> : (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Date Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Target Audience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Content Snippet</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {sentMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(msg.sentAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{msg.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 capitalize">
                        {Array.isArray(msg.targetAudience) ? msg.targetAudience.join(', ') : msg.targetAudience === 'specific_users' ? `Specific Users (${msg.targetUserIds?.length || 0})` : msg.targetAudience}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-500 max-w-md break-words truncate" title={msg.content}>{msg.content.substring(0,100)}{msg.content.length > 100 ? '...' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sentMessages.length === 0 && !loading && <p className="text-center text-secondary-500 py-8">No messages sent yet.</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Compose New Message" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
          <Input label="Message Title" id="msgTitle" value={newMessageData.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
          
          <div className="my-4">
            <label className="block text-sm font-medium text-secondary-700 mb-1">Target Audience</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {audienceOptions.map(opt => (
                    <Button 
                        key={opt.value}
                        type="button"
                        variant={
                            (Array.isArray(newMessageData.targetAudience) && newMessageData.targetAudience.includes(opt.value as UserRole)) || 
                            newMessageData.targetAudience === opt.value ? 'primary' : 'secondary'
                        }
                        onClick={() => handleTargetAudienceChange(opt.value as string)}
                        className="w-full text-xs sm:text-sm"
                    >
                        {opt.label}
                    </Button>
                ))}
            </div>
          </div>

          {newMessageData.targetAudience === 'specific_users' && (
            <div className="my-4">
                <label htmlFor="targetUserIds" className="block text-sm font-medium text-secondary-700">Select Specific Users</label>
                <select 
                    id="targetUserIds"
                    multiple 
                    value={newMessageData.targetUserIds}
                    onChange={(e) => handleInputChange('targetUserIds', Array.from(e.target.selectedOptions, option => option.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm bg-white h-32"
                >
                    {userOptionsForSelect.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                 <p className="text-xs text-secondary-500 mt-1">Hold Ctrl/Cmd to select multiple users.</p>
            </div>
          )}

          <Input label="Message Content" id="msgContent" type="textarea" rows={6} value={newMessageData.content} onChange={(e) => handleInputChange('content', e.target.value)} required />
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HeadTeacherCommunicationPage;
