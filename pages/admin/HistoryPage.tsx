
import React, { useState, useEffect, useCallback } from 'react';
import { HistoryIcon, DeleteIcon } from '../../assets/icons';
import { LogEntry } from '../../types';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

const API_URL = 'http://localhost:3001/api';

const HistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { addToast } = useToast();
  const { user, getAuthHeaders } = useAuth(); // User might be used for 'cleared by' if needed

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/history`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch history logs');
      const currentLogs: LogEntry[] = await response.json();
      setLogs(currentLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error("Failed to load history logs from server:", error);
      addToast({ type: 'error', message: 'Failed to load activity history.' });
    }
  }, [addToast, getAuthHeaders]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all activity logs? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_URL}/history`, {
          method: 'DELETE',
          headers: getAuthHeaders(), 
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to clear history');
        }
        addToast({ type: 'success', message: 'Activity history cleared.' });
        fetchLogs(); 
      } catch (error: any) {
        console.error("Failed to clear history logs:", error);
        addToast({ type: 'error', message: error.message || 'Failed to clear activity history.' });
      }
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <HistoryIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-secondary-800">Activity History</h1>
        </div>
        <Button onClick={handleClearHistory} variant="danger" size="sm" leftIcon={<DeleteIcon className="w-4 h-4"/>}>
            Clear History
        </Button>
      </div>
      <p className="text-secondary-600 mb-8">
        This section displays a log of important activities and changes within the system.
      </p>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
         <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-secondary-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{log.userEmail}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{log.action}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-secondary-500 max-w-md break-words" title={log.details}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
         {logs.length === 0 && <p className="text-center text-secondary-500 py-8">No activity logs found.</p>}
      </div>
    </div>
  );
};

export default HistoryPage;