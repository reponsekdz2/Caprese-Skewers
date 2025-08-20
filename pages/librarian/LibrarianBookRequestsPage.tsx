
import React, { useState, useEffect, useCallback } from 'react';
import { BookRequest } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import { PlusIcon as PageIcon, CheckCircleIcon, CloseIcon as RejectIcon } from '../../assets/icons'; 

const API_URL = 'http://localhost:3001/api';

const LibrarianBookRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchBookRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/librarian/book-requests`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch book requests');
      const data: BookRequest[] = await response.json();
      setRequests(data.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load book requests.' });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchBookRequests();
  }, [fetchBookRequests]);

  const handleUpdateRequestStatus = async (requestId: string, status: BookRequest['status']) => {
    setUpdatingRequestId(requestId);
    try {
      const response = await fetch(`${API_URL}/librarian/book-requests/${requestId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to update request status to ${status}.`);
      }
      addToast({ type: 'success', message: `Book request status updated to ${status}.` });
      fetchBookRequests(); 
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setUpdatingRequestId(null);
    }
  };
  
  const getStatusColor = (status: BookRequest['status']) => {
    switch(status) {
        case 'pending': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-700 dark:bg-opacity-30';
        case 'approved': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-700 dark:bg-opacity-30';
        case 'rejected': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-700 dark:bg-opacity-30';
        case 'acquired': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-700 dark:bg-opacity-30';
        default: return 'text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 dark:bg-opacity-30';
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
          Student Book Requests
        </h1>
      </div>

      {loading ? (
        <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
            <p className="mt-4 text-secondary-600 dark:text-secondary-400">Loading book requests...</p>
        </div>
      ) : requests.length > 0 ? (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-dark-border">
              <thead className="bg-secondary-50 dark:bg-secondary-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Book Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Request Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-secondary-200 dark:divide-dark-border">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{req.userName || 'Unknown User'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-dark-text">{req.bookTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{req.bookAuthor || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{new Date(req.requestDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                      {req.status === 'pending' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleUpdateRequestStatus(req.id, 'approved')}
                            disabled={updatingRequestId === req.id}
                            leftIcon={<CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400"/>}
                            aria-label="Approve request"
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                            disabled={updatingRequestId === req.id}
                            leftIcon={<RejectIcon className="w-4 h-4 text-red-600 dark:text-red-400"/>}
                             aria-label="Reject request"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleUpdateRequestStatus(req.id, 'acquired')}
                          disabled={updatingRequestId === req.id}
                          leftIcon={<CheckCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400"/>}
                          aria-label="Mark as acquired"
                        >
                          Mark Acquired
                        </Button>
                      )}
                      { (req.status === 'rejected' || req.status === 'acquired') && <span className="text-xs text-secondary-400 dark:text-secondary-500">Processed</span> }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">No Pending Book Requests</h2>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2">All student book requests have been processed or there are no new requests.</p>
        </div>
      )}
    </div>
  );
};

export default LibrarianBookRequestsPage;
