
import React, { useState, useEffect, useCallback } from 'react';
import { Meeting } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { UsersIcon as PageIcon, CheckCircleIcon, CloseIcon as CancelIcon, EditIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const TeacherMeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  // States for the action modal
  const [meetingLink, setMeetingLink] = useState('');
  const [generalNotes, setGeneralNotes] = useState(''); // Existing notes field
  const [attendedByParent, setAttendedByParent] = useState(false);
  const [notesByTeacher, setNotesByTeacher] = useState(''); // Post-meeting notes
  const [childVisitDetails, setChildVisitDetails] = useState('');


  const [loading, setLoading] = useState(false);
  
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchMeetings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/meetings`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch meeting requests');
      const data: Meeting[] = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error("Fetch meetings error:", error);
      addToast({ type: 'error', message: 'Failed to load meeting requests.' });
    } finally {
      setLoading(false);
    }
  }, [user, addToast, getAuthHeaders]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const openActionModal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setMeetingLink(meeting.meetingLink || '');
    setGeneralNotes(meeting.notes || ''); // General notes
    setAttendedByParent(meeting.attendedByParent || false);
    setNotesByTeacher(meeting.notesByTeacher || '');
    setChildVisitDetails(meeting.childVisitDetails || '');
    setIsActionModalOpen(true);
  };

  const handleUpdateMeeting = async (statusUpdate?: Meeting['status']) => {
    if (!selectedMeeting) return;
    setLoading(true);
    try {
      const payload: Partial<Meeting> = { 
        status: statusUpdate || selectedMeeting.status, // Use new status if provided, else existing
        meetingLink: meetingLink,
        notes: generalNotes, // General notes field
        attendedByParent: attendedByParent,
        notesByTeacher: notesByTeacher,
        childVisitDetails: childVisitDetails,
      };

      const response = await fetch(`${API_URL}/meetings/${selectedMeeting.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update meeting.');
      }
      addToast({ type: 'success', message: `Meeting ${statusUpdate ? statusUpdate : 'details updated'} successfully.` });
      fetchMeetings();
      closeActionModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setSelectedMeeting(null);
    setMeetingLink('');
    setGeneralNotes('');
    setAttendedByParent(false);
    setNotesByTeacher('');
    setChildVisitDetails('');
  };

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
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center"><PageIcon className="w-8 h-8 mr-2 text-primary-600" />Parent Meeting Requests & Logs</h1>
      </div>

      {loading && meetings.length === 0 ? <p className="text-center py-8">Loading meeting requests...</p> : (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Parent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {meetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{meeting.parentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{meeting.studentName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(meeting.proposedDate).toLocaleDateString()} at {meeting.proposedTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {meeting.status === 'completed' || meeting.status === 'confirmed' ? (meeting.attendedByParent ? 
                            <span className="text-green-600 font-semibold">Attended</span> : 
                            <span className="text-red-600">Not Attended</span>
                        ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button onClick={() => openActionModal(meeting)} variant="ghost" size="sm" leftIcon={<EditIcon className="w-4 h-4"/>}>Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meetings.length === 0 && !loading && <p className="text-center text-secondary-500 py-8">No meeting requests found.</p>}
        </div>
      )}

      {selectedMeeting && (
        <Modal isOpen={isActionModalOpen} onClose={closeActionModal} title={`Manage Meeting: ${selectedMeeting.parentName} - ${new Date(selectedMeeting.proposedDate).toLocaleDateString()}`} size="lg">
          <div className="space-y-4">
            <p><strong>Reason for Request:</strong> {selectedMeeting.reasonForRequest}</p>
            
            <Input 
                label="Meeting Link (e.g., Zoom, Google Meet)" 
                id="meetingLink" 
                value={meetingLink} 
                onChange={(e) => setMeetingLink(e.target.value)} 
                placeholder="https://meet.example.com/your-meeting-id"
            />
            <Input 
                label="General Notes (for parent or records)" 
                id="generalNotes" 
                type="textarea"
                rows={3}
                value={generalNotes} 
                onChange={(e) => setGeneralNotes(e.target.value)} 
            />

            <fieldset className="mt-4 pt-4 border-t">
                <legend className="text-md font-semibold mb-2">Post-Meeting Details (if applicable)</legend>
                <div className="flex items-center mb-2">
                    <input type="checkbox" id="attendedByParent" checked={attendedByParent} onChange={e => setAttendedByParent(e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/>
                    <label htmlFor="attendedByParent" className="ml-2 text-sm text-secondary-700">Parent Attended Meeting</label>
                </div>
                <Input 
                    label="Teacher's Notes (Post-Meeting)" 
                    id="notesByTeacher" 
                    type="textarea" rows={3}
                    value={notesByTeacher} 
                    onChange={(e) => setNotesByTeacher(e.target.value)} 
                    placeholder="Summary of discussion, outcomes, etc."
                />
                 <Input 
                    label="Child Visit Details (if applicable)" 
                    id="childVisitDetails" 
                    type="textarea" rows={2}
                    value={childVisitDetails} 
                    onChange={(e) => setChildVisitDetails(e.target.value)} 
                    placeholder="e.g., Child was present, observations..."
                />
            </fieldset>
            

            <div className="flex flex-wrap justify-end gap-3 mt-6">
              <Button type="button" variant="secondary" onClick={closeActionModal}>Cancel</Button>
              {selectedMeeting.status === 'requested' && (
                <>
                <Button type="button" variant="danger" onClick={() => handleUpdateMeeting('rejected')} disabled={loading} leftIcon={<CancelIcon className="w-4 h-4"/>}>
                    {loading ? 'Processing...' : 'Reject Request'}
                </Button>
                <Button type="button" variant="primary" onClick={() => handleUpdateMeeting('confirmed')} disabled={loading || !meetingLink} leftIcon={<CheckCircleIcon className="w-4 h-4"/>}>
                    {loading ? 'Processing...' : 'Confirm Meeting'}
                </Button>
                </>
              )}
               {(selectedMeeting.status === 'confirmed' || selectedMeeting.status === 'completed') && (
                 <>
                    <Button type="button" variant="primary" onClick={() => handleUpdateMeeting(selectedMeeting.status)} disabled={loading}> {/* Update existing status to save notes/attendance */}
                        {loading ? 'Saving...' : 'Save Details'}
                    </Button>
                    {selectedMeeting.status === 'confirmed' && (
                        <Button type="button" variant="primary" onClick={() => handleUpdateMeeting('completed')} disabled={loading} leftIcon={<CheckCircleIcon className="w-4 h-4"/>}>
                            {loading ? 'Processing...' : 'Mark as Completed'}
                        </Button>
                    )}
                 </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeacherMeetingsPage;
