
import React, { useState, useEffect, useCallback } from 'react';
import { Meeting, User, UserRole } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { UsersIcon as PageIcon, PlusIcon, CheckCircleIcon, CloseIcon as CancelIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const ParentMeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMeetingData, setNewMeetingData] = useState<{ teacherId: string; proposedDate: string; proposedTime: string; reasonForRequest: string; studentId?: string }>({
    teacherId: '',
    proposedDate: new Date().toISOString().split('T')[0],
    proposedTime: '10:00',
    reasonForRequest: '',
    studentId: '',
  });
  const [loading, setLoading] = useState(false);
  
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchMeetings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Parents fetch all meetings where they are the parentId
      const response = await fetch(`${API_URL}/meetings`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch your meetings');
      const data: Meeting[] = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error("Fetch meetings error:", error);
      addToast({ type: 'error', message: 'Failed to load your meetings.' });
    } finally {
      setLoading(false);
    }
  }, [user, addToast, getAuthHeaders]);

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch teachers list');
      const allUsers: User[] = await response.json();
      setTeachers(allUsers.filter(u => u.role === UserRole.TEACHER || u.role === UserRole.HEAD_TEACHER));
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load teachers list.' });
    }
  }, [addToast, getAuthHeaders]);

  useEffect(() => {
    fetchMeetings();
    fetchTeachers();
  }, [fetchMeetings, fetchTeachers]);

  const handleInputChange = (key: keyof typeof newMeetingData, value: string) => {
    setNewMeetingData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRequestMeeting = async () => {
    if (!newMeetingData.teacherId || !newMeetingData.proposedDate || !newMeetingData.proposedTime || !newMeetingData.reasonForRequest) {
      addToast({ type: 'error', message: 'Please select a teacher, date, time, and provide a reason.' });
      return;
    }
    setLoading(true);
    try {
      const payload = { ...newMeetingData };
      // If parent has a child linked, associate the meeting with that child by default if no specific student is chosen.
      // For simplicity, we'll let the server handle finding the student if `studentId` isn't provided but `user.childUserId` exists.
      // If a school supports multiple children per parent, a student selection dropdown would be needed here.
      // For now, if the parent's `childUserId` is set, the server might use that to find the `studentId` (Student Record ID).

      const response = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to request meeting.');
      }
      addToast({ type: 'success', message: 'Meeting requested successfully!' });
      fetchMeetings();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelMeeting = async (meetingId: string) => {
    if(!window.confirm("Are you sure you want to cancel this meeting request?")) return;
    setLoading(true);
    try {
        const response = await fetch(`${API_URL}/meetings/${meetingId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'cancelled' }),
        });
        if (!response.ok) throw new Error('Failed to cancel meeting.');
        addToast({type: 'success', message: 'Meeting request cancelled.'});
        fetchMeetings();
    } catch (error: any) {
        addToast({type: 'error', message: error.message});
    } finally {
        setLoading(false);
    }
  }

  const openModal = () => {
    setNewMeetingData({ teacherId: teachers.length > 0 ? teachers[0].id : '', proposedDate: new Date().toISOString().split('T')[0], proposedTime: '10:00', reasonForRequest: '', studentId: user?.studentDetailsId || '' });
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const teacherOptions = teachers.map(t => ({ value: t.id, label: t.name }));
  
  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
        case 'requested': return 'bg-yellow-100 text-yellow-800';
        case 'confirmed': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'completed': return 'bg-blue-100 text-blue-800';
        case 'cancelled': return 'bg-gray-100 text-gray-800';
        default: return 'bg-secondary-100 text-secondary-800';
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center"><PageIcon className="w-8 h-8 mr-2 text-primary-600" />My Teacher Meetings</h1>
        <Button onClick={openModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto">
          Request New Meeting
        </Button>
      </div>

      {loading && meetings.length === 0 ? <p className="text-center py-8">Loading your meetings...</p> : (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Teacher Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Proposed Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Meeting Link</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {meetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{meeting.teacherName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{meeting.studentName || 'General'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(meeting.proposedDate).toLocaleDateString()} at {meeting.proposedTime}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-500 max-w-xs break-words" title={meeting.reasonForRequest}>{meeting.reasonForRequest}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {meeting.status === 'confirmed' && meeting.meetingLink ? (
                            <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline">Join Meeting</a>
                        ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {meeting.status === 'requested' && (
                            <Button variant="danger" size="sm" onClick={() => handleCancelMeeting(meeting.id)} leftIcon={<CancelIcon className="w-4 h-4"/>}>
                                Cancel
                            </Button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meetings.length === 0 && !loading && <p className="text-center text-secondary-500 py-8">No meetings requested or scheduled yet.</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Request New Meeting">
        <form onSubmit={(e) => { e.preventDefault(); handleRequestMeeting(); }}>
          <Select label="Select Teacher" id="teacherId" options={teacherOptions} value={newMeetingData.teacherId} onChange={(e) => handleInputChange('teacherId', e.target.value)} required />
          <Input label="Proposed Date" id="proposedDate" type="date" value={newMeetingData.proposedDate} onChange={(e) => handleInputChange('proposedDate', e.target.value)} required />
          <Input label="Proposed Time" id="proposedTime" type="time" value={newMeetingData.proposedTime} onChange={(e) => handleInputChange('proposedTime', e.target.value)} required />
          <Input label="Reason for Meeting" id="reasonForRequest" type="textarea" value={newMeetingData.reasonForRequest} onChange={(e) => handleInputChange('reasonForRequest', e.target.value)} required placeholder="Briefly explain the purpose of the meeting."/>
          {/* Optional: Student selection if parent has multiple children */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading || !newMeetingData.teacherId}>
                {loading ? 'Requesting...' : 'Request Meeting'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ParentMeetingsPage;
