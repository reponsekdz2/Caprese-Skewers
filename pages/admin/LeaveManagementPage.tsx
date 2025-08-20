
import React, { useState, useEffect, useCallback } from 'react';
import { LeaveRequest } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { LeaveIcon as PageIcon, CheckCircleIcon, CloseIcon as RejectIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const LeaveManagementPage: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  const { user, getAuthHeaders } = useAuth(); 
  const { addToast } = useToast();

  const fetchLeaveRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/hr/leave`, { headers: getAuthHeaders() }); 
      if (!response.ok) throw new Error('Failed to fetch leave requests');
      const data: LeaveRequest[] = await response.json();
      setLeaveRequests(data.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load leave requests.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleUpdateRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    setUpdatingRequestId(requestId);
    try {
      const payload = { status, approvedBy: user.id }; 
      const response = await fetch(`${API_URL}/hr/leave/${requestId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${status} leave request.`);
      }
      addToast({ type: 'success', message: `Leave request ${status} successfully.` });
      fetchLeaveRequests();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setUpdatingRequestId(null);
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

  const filteredRequests = leaveRequests.filter(req => 
    (!filterStatus || req.status === filterStatus)
  );
  
  const statusOptionsForFilter = [
    {value: '', label: 'All Statuses'},
    {value: 'pending', label: 'Pending'},
    {value: 'approved', label: 'Approved'},
    {value: 'rejected', label: 'Rejected'},
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Staff Leave Management
        </h1>
        <Select
            label="Filter by Status"
            options={statusOptionsForFilter}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            containerClassName="mb-0 mt-4 sm:mt-0 min-w-[200px]"
            className="mt-0"
        />
      </div>

      {loading ? (
        <div className="text-center py-10">Loading leave requests...</div>
      ) : filteredRequests.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Staff Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredRequests.map(request => (
                  <tr key={request.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{request.userName || request.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(request.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(request.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-600 max-w-md break-words" title={request.reason}>{request.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleUpdateRequestStatus(request.id, 'approved')}
                            disabled={updatingRequestId === request.id}
                            leftIcon={<CheckCircleIcon className="w-4 h-4 text-green-600"/>}
                            aria-label={`Approve leave for ${request.userName || request.userId}`}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleUpdateRequestStatus(request.id, 'rejected')}
                            disabled={updatingRequestId === request.id}
                            leftIcon={<RejectIcon className="w-4 h-4 text-red-600"/>}
                            aria-label={`Reject leave for ${request.userName || request.userId}`}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status !== 'pending' && <span className="text-xs text-secondary-400">Processed</span>}
                    </td>
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
          <p className="text-secondary-500 mt-2">
            {filterStatus ? "No requests match the selected status." : "There are no pending or processed leave requests."}
          </p>
        </div>
      )}
    </div>
  );
};

export default LeaveManagementPage;
