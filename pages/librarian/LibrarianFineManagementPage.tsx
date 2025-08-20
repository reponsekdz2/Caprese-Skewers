
import React, { useState, useEffect, useCallback } from 'react';
import { BookTransaction, User, LibraryBook } from '../../types'; 
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import { FinanceIcon as PageIcon, CheckCircleIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const LibrarianFineManagementPage: React.FC = () => {
  const [overdueTransactions, setOverdueTransactions] = useState<BookTransaction[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [books, setBooks] = useState<LibraryBook[]>([]); 
  const [loading, setLoading] = useState(true);
  const [updatingFineId, setUpdatingFineId] = useState<string | null>(null);

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchFineData = useCallback(async () => {
    setLoading(true);
    try {
      const [transactionsRes, usersRes, booksRes] = await Promise.all([
        fetch(`${API_URL}/library/transactions?status=overdue`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/users`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/library/books`, { headers: getAuthHeaders() }),
      ]);

      if (!transactionsRes.ok) throw new Error('Failed to fetch overdue transactions');
      const transactionsData: BookTransaction[] = await transactionsRes.json();
      // Filter for transactions that have a fine and are not yet paid
      setOverdueTransactions(transactionsData.filter(t => t.fineAmount && t.fineAmount > 0 && !t.finePaid));

      if (usersRes.ok) setUsers(await usersRes.json()); else console.warn("Failed to fetch users for names.");
      if (booksRes.ok) setBooks(await booksRes.json()); else console.warn("Failed to fetch books for titles.");

    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load fine data.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchFineData();
  }, [fetchFineData]);

  const handleMarkFinePaid = async (transactionId: string) => {
    setUpdatingFineId(transactionId);
    try {
      const response = await fetch(`${API_URL}/library/transactions/${transactionId}/pay-fine`, {
        method: 'PUT', 
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to mark fine as paid.');
      }
      addToast({ type: 'success', message: 'Fine marked as paid successfully!' });
      fetchFineData(); 
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setUpdatingFineId(null);
    }
  };
  
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown User';
  const getBookTitle = (bookId: string) => books.find(b => b.id === bookId)?.title || 'Unknown Book';

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Library Fine Management
        </h1>
        {/* Add filters if needed: by student, date range */}
      </div>

      {loading ? (
        <div className="text-center py-10">Loading fine records...</div>
      ) : overdueTransactions.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Book Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Fine Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {overdueTransactions.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{getUserName(transaction.userId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{getBookTitle(transaction.bookId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">{new Date(transaction.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">${transaction.fineAmount?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!transaction.finePaid && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleMarkFinePaid(transaction.id)}
                          disabled={updatingFineId === transaction.id}
                          leftIcon={<CheckCircleIcon className="w-4 h-4 text-green-600"/>}
                          aria-label={`Mark fine for ${getBookTitle(transaction.bookId)} as paid`}
                        >
                          Mark as Paid
                        </Button>
                      )}
                      {transaction.finePaid && <span className="text-green-600 text-xs font-semibold">PAID</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Outstanding Fines</h2>
          <p className="text-secondary-500 mt-2">All library fines are currently settled.</p>
        </div>
      )}
    </div>
  );
};

export default LibrarianFineManagementPage;
