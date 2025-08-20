
// This service can be simplified or removed if all logging is handled server-side
// based on authenticated user actions.
// If client needs to initiate some logs (e.g., non-auth related frontend events), it can use these.

import { LogEntry } from '../types'; // Removed LocalStorageKeys if not used here
import { useAuth } from '../hooks/useAuth'; // To get user for logging

const API_URL = 'http://localhost:3001/api';

// This function might not be directly called by most components if server handles logging.
// It's here if some specific client-side event needs to be logged.
const addLogToServer = async (userEmail: string, action: string, details: string, getAuthHeaders: () => Record<string, string>): Promise<void> => {
  try {
    await fetch(`${API_URL}/history`, {
      method: 'POST',
      headers: getAuthHeaders(), // Includes Content-Type: application/json
      body: JSON.stringify({ userEmail, action, details }),
    });
    // No need to update local state, HistoryPage will fetch all logs
  } catch (error) {
    console.error("Error adding log via API:", error);
  }
};


// getLogs and clearLogs are now handled by HistoryPage.tsx directly via API calls.
// This file could export addLogToServer if needed, or be removed.

// Example of how it might be used (though direct API calls in components are now more common):
// const { user, getAuthHeaders } = useAuth(); // In a component
// historyService.addLogToServer(user?.email || 'SystemClient', 'Client Action', 'Details...', getAuthHeaders);

export const historyService = {
  addLogToServer, // Export if specific client-side logging is needed
  // getLogs and clearLogs are effectively deprecated here, handled by HistoryPage
};
    