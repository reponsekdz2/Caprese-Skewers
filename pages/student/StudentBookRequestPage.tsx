
import React, { useState, useEffect, useCallback } from 'react';
import { BookRequest } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { PlusIcon, LibraryIcon as PageIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const StudentBookRequestPage: React.FC = () => {
  const [myRequests, setMyRequests] = useState<BookRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequestData, setNewRequestData] = useState<{ bookTitle: string; bookAuthor?: string }>({
    bookTitle: '',
    bookAuthor: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchMyRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/student/book-requests`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch your book requests');
      const data: BookRequest[] = await response.json();
      setMyRequests(data.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load your book requests.' });
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const handleInputChange = (key: keyof typeof newRequestData, value: string) => {
    setNewRequestData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitRequest = async () => {
    if (!newRequestData.bookTitle) {
      addToast({ type: 'warning', message: 'Book title is required.' });
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/student/book-requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newRequestData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to submit book request.');
      }
      addToast({ type: 'success', message: 'Book request submitted successfully!' });
      fetchMyRequests();
      setIsModalOpen(false);
      setNewRequestData({ bookTitle: '', bookAuthor: '' });
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
          My Book Requests
        </h1>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="mt-4 sm:mt-0">
          Request New Book
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Loading your requests...</p>
        </div>
      ) : myRequests.length > 0 ? (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-dark-border">
              <thead className="bg-secondary-50 dark:bg-secondary-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Book Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Request Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-secondary-200 dark:divide-dark-border">
                {myRequests.map(request => (
                  <tr key={request.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-dark-text">{request.bookTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{request.bookAuthor || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{new Date(request.requestDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
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
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">No Book Requests Yet</h2>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2">Can't find a book you need? Request it here!</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request a New Book">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmitRequest(); }} className="space-y-4">
          <Input
            label="Book Title"
            id="bookTitle"
            value={newRequestData.bookTitle}
            onChange={(e) => handleInputChange('bookTitle', e.target.value)}
            required
            placeholder="Enter the full title of the book"
          />
          <Input
            label="Author (Optional)"
            id="bookAuthor"
            value={newRequestData.bookAuthor || ''}
            onChange={(e) => handleInputChange('bookAuthor', e.target.value)}
            placeholder="Enter the author's name"
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

export default StudentBookRequestPage;
