
import React, { useState, useEffect, useCallback } from 'react';
import { LeaveRequest } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { PlusIcon, LeaveIcon as PageIcon, CalendarIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const TeacherLeavePage: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLeaveData, setNewLeaveData] = useState<{ startDate: string; endDate: string; reason: string }>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchMyLeaveRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/hr/leave/my`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch your leave requests');
      const data: LeaveRequest[] = await response.json();
      setLeaveRequests(data.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load your leave requests.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchMyLeaveRequests();
  }, [fetchMyLeaveRequests]);

  const handleInputChange = (key: keyof typeof newLeaveData, value: string) => {
    setNewLeaveData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitRequest = async () => {
    if (!newLeaveData.startDate || !newLeaveData.endDate || !newLeaveData.reason) {
      addToast({ type: 'warning', message: 'Start date, end date, and reason are required.' });
      return;
    }
    if (new Date(newLeaveData.startDate) > new Date(newLeaveData.endDate)) {
        addToast({ type: 'error', message: 'Start date cannot be after end date.'});
        return;
    }
    setSubmitting(true);
    try {
      const payload = { ...newLeaveData, userId: user?.id }; // Server uses authenticated user ID primarily
      const response = await fetch(`${API_URL}/hr/leave`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to submit leave request.');
      }
      addToast({ type: 'success', message: 'Leave request submitted successfully!' });
      fetchMyLeaveRequests();
      setIsModalOpen(false);
      setNewLeaveData({ startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], reason: '' });
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
    }
  };
  
  const getStatusColor = (status: LeaveRequest['status']) => {
    switch(status) {
        case 'pending': return 'text-yellow-600 bg-yellow-100';
        case 'approved': return 'text-green-600 bg-green-100';
        case 'rejected': return 'text-red-600 bg-red-100';
        default: return 'text-secondary-600 bg-secondary-100';
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          My Leave Requests
        </h1>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="mt-4 sm:mt-0">
          Apply for Leave
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading leave requests...</div>
      ) : leaveRequests.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Approved By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {leaveRequests.map(request => (
                  <tr key={request.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(request.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(request.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-600 max-w-md break-words" title={request.reason}>{request.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{request.approvedBy ? (user?.id === request.approvedBy ? 'Self (Admin Action)' : request.approvedBy) : (request.status !== 'pending' ? 'N/A' : '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
         <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Leave Requests Found</h2>
          <p className="text-secondary-500 mt-2">You have not submitted any leave requests yet.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Leave">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmitRequest(); }} className="space-y-4">
          <Input
            label="Start Date"
            id="startDate"
            type="date"
            value={newLeaveData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            required
          />
          <Input
            label="End Date"
            id="endDate"
            type="date"
            value={newLeaveData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            required
          />
          <Input
            label="Reason for Leave"
            id="reason"
            type="textarea"
            rows={3}
            value={newLeaveData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            required
            placeholder="Briefly explain the reason for your leave"
          />
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherLeavePage;
