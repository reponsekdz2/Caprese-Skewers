
import React, { useState, useEffect, useCallback } from 'react';
import { TrainingSession, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select'; 
import { TrainingIcon as PageIcon, PlusIcon, EditIcon, DeleteIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const TrainingPage: React.FC = () => {
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSessionData, setCurrentSessionData] = useState<Partial<TrainingSession>>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    trainer: '',
    participants: [],
  });
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(false);

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchTrainingSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/hr/training`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch training sessions');
      const data: TrainingSession[] = await response.json();
      setTrainingSessions(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load training sessions.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);
  
  const fetchUsers = useCallback(async () => {
    try {
        const response = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
        if(response.ok) setUsers(await response.json());
    } catch (error) {
        addToast({type: 'error', message: 'Failed to load users for participant list.'});
    }
  }, [getAuthHeaders, addToast]);


  useEffect(() => {
    fetchTrainingSessions();
    fetchUsers();
  }, [fetchTrainingSessions, fetchUsers]);

  const handleInputChange = (key: keyof Partial<TrainingSession>, value: string | string[]) => {
    setCurrentSessionData(prev => ({ ...prev, [key]: value }));
  };
  
  const handleParticipantChange = (selectedUserIds: string[]) => {
    setCurrentSessionData(prev => ({...prev, participants: selectedUserIds}));
  };

  const handleFormSubmit = async () => {
    if (!currentSessionData.title || !currentSessionData.date) {
      addToast({ type: 'error', message: 'Title and Date are required for a training session.' });
      return;
    }
    
    setLoading(true);
    const method = editingSession ? 'PUT' : 'POST';
    const url = editingSession ? `${API_URL}/hr/training/${editingSession.id}` : `${API_URL}/hr/training`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(currentSessionData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingSession ? 'update' : 'add'} training session`);
      }
      addToast({ type: 'success', message: `Training session ${editingSession ? 'updated' : 'added'} successfully!` });
      fetchTrainingSessions();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSession(null);
    setCurrentSessionData({ title: '', description: '', date: new Date().toISOString().split('T')[0], trainer: '', participants: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (session: TrainingSession) => {
    setEditingSession(session);
    setCurrentSessionData(session);
    setIsModalOpen(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this training session record?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/hr/training/${sessionId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete training session');
        addToast({ type: 'success', message: 'Training session deleted successfully.' });
        fetchTrainingSessions();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message || 'Could not delete session.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSession(null);
  };
  
  const userOptionsForSelect = users.map(u => ({ value: u.id, label: `${u.name} (${u.role})`}));

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Staff Training & Development
        </h1>
        <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="mt-4 sm:mt-0">
          Add Training Session
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading training sessions...</div>
      ) : trainingSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainingSessions.map(session => (
            <div key={session.id} className="bg-white rounded-xl shadow-lg p-5 flex flex-col justify-between hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105">
              <div>
                <h3 className="font-semibold text-xl text-primary-700 mb-1">{session.title}</h3>
                <p className="text-sm text-secondary-500 mb-2">
                  Date: {new Date(session.date).toLocaleDateString()}
                  {session.trainer && ` | Trainer: ${session.trainer}`}
                </p>
                <p className="text-secondary-600 text-sm mb-3 line-clamp-3" title={session.description}>{session.description}</p>
                {session.participants && session.participants.length > 0 && (
                    <p className="text-xs text-secondary-500 mb-1">
                        Participants: {session.participants.map(pId => users.find(u=>u.id === pId)?.name || 'Unknown').join(', ') || 'None'}
                    </p>
                )}
              </div>
              <div className="mt-auto flex space-x-2 pt-3 border-t border-secondary-100">
                <Button variant="ghost" size="sm" onClick={() => openEditModal(session)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label={`Edit ${session.title}`}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteSession(session.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label={`Delete ${session.title}`}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Training Sessions Scheduled</h2>
          <p className="text-secondary-500 mt-2">Add training sessions to manage staff development.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSession ? "Edit Training Session" : "Add New Training Session"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
          <Input label="Session Title" id="sessionTitle" value={currentSessionData.title || ''} onChange={e => handleInputChange('title', e.target.value)} required />
          <Input label="Date" id="sessionDate" type="date" value={currentSessionData.date || ''} onChange={e => handleInputChange('date', e.target.value)} required />
          <Input label="Trainer/Facilitator (Optional)" id="trainer" value={currentSessionData.trainer || ''} onChange={e => handleInputChange('trainer', e.target.value)} />
          <Input label="Description" id="description" type="textarea" rows={3} value={currentSessionData.description || ''} onChange={e => handleInputChange('description', e.target.value)} />
          <div>
            <label htmlFor="participants" className="block text-sm font-medium text-secondary-700">Participants (Hold Ctrl/Cmd to select multiple)</label>
            <select 
                id="participants" 
                multiple 
                value={currentSessionData.participants || []} 
                onChange={(e) => handleParticipantChange(Array.from(e.target.selectedOptions, option => option.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm bg-white h-40"
                aria-label="Select participants for training"
            >
                {userOptionsForSelect.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (editingSession ? 'Saving...' : 'Adding...') : (editingSession ? "Save Changes" : "Add Session")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TrainingPage;
