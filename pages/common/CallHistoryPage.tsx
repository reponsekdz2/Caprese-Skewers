
import React, { useState, useEffect, useCallback } from 'react';
import { CallLog, CallStatus, CallType, UserRole, User } from '../../types'; // Added User
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PhoneIcon, PhoneIncomingIcon, PhoneOutgoingIcon, PhoneMissedCallIcon, VideoCameraIcon } from '../../assets/icons';
import Button from '../../components/common/Button';
import { useCallManager } from '../../hooks/useCallManager';


const API_URL = 'http://localhost:3001/api';

const CallHistoryPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const { initiateCall } = useCallManager();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCallHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/calls/my-history`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch call history');
      const data: CallLog[] = await response.json();
      setCallLogs(data); 
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load call history.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);
  
  const handleCallAgain = (log: CallLog) => {
    if (!user) return;
    // Find the other participant(s) to call back
    const otherParticipants = log.participants.filter(p => p.userId !== user.id);
    if (otherParticipants.length === 0) {
        addToast({type: 'error', message: 'Could not find recipient to call back.'});
        return;
    }
    
    // For simplicity, if it was a group call, we might call back the initiator if they are not self,
    // or the first other participant. A more complex UI would be needed to select who to call back from a group.
    // For 1-on-1, it's straightforward.
    const primaryReceiver = otherParticipants[0]; 
    const receiverToCall: User = { // Construct a User-like object
        id: primaryReceiver.userId,
        name: primaryReceiver.name,
        role: primaryReceiver.role,
        email: '', // Email might not be in CallParticipant, provide a default or fetch if needed
        avatar: primaryReceiver.avatar
    };
    initiateCall([receiverToCall], log.type);
  };


  const getCallIconAndStyle = (log: CallLog) => {
    const isOutgoing = log.initiatorId === user?.id;
    let Icon = PhoneIcon;
    let style = "text-secondary-500 dark:text-secondary-400";

    if (isOutgoing) {
      Icon = PhoneOutgoingIcon;
      if (log.status === CallStatus.ANSWERED || log.status === CallStatus.ENDED) style = "text-green-500 dark:text-green-400";
      else if (log.status === CallStatus.MISSED || log.status === CallStatus.DECLINED) style = "text-red-500 dark:text-red-400";
    } else { // Incoming
      Icon = PhoneIncomingIcon;
      if (log.status === CallStatus.ANSWERED || log.status === CallStatus.ENDED) style = "text-blue-500 dark:text-blue-400";
      else if (log.status === CallStatus.MISSED) style = "text-yellow-600 dark:text-yellow-500"; // Missed by current user
      else if (log.status === CallStatus.DECLINED) style = "text-orange-500 dark:text-orange-400"; // Declined by current user
    }
    if (log.status === CallStatus.FAILED) {
        Icon = PhoneMissedCallIcon; 
        style = "text-gray-400 dark:text-gray-500";
    }
    
    return { Icon, style };
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null || seconds < 0) return 'N/A';
    if (seconds === 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getOtherPartyDetails = (log: CallLog) => {
    if (!user) return { name: "Unknown", role: UserRole.STUDENT }; // Should not happen
    if (log.isGroupCall) {
      return { name: `Group Call (${log.participants.length})`, role: "Group" as any }; // Special handling for group
    }
    const otherParticipant = log.participants.find(p => p.userId !== user.id);
    if (otherParticipant) {
      return { name: otherParticipant.name, role: otherParticipant.role };
    }
    // Fallback if something is unusual (e.g. call with self, or only one participant recorded)
    return { name: log.initiatorName, role: log.initiatorRole };
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <PhoneIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" />
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text">Call History</h1>
      </div>

      {loading ? (
        <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div><p className="mt-2 dark:text-secondary-400">Loading call logs...</p></div>
      ) : callLogs.length > 0 ? (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden">
          <ul className="divide-y divide-secondary-200 dark:divide-dark-border">
            {callLogs.map(log => {
              const { Icon, style } = getCallIconAndStyle(log);
              const { name: contactName, role: contactRole } = getOtherPartyDetails(log);
              return (
                <li key={log.id} className="p-4 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-6 h-6 ${style}`} />
                      <div>
                        <p className="text-sm font-medium text-secondary-800 dark:text-dark-text">
                          {contactName} 
                          <span className="text-xs text-secondary-500 dark:text-secondary-400 ml-1">({contactRole})</span>
                          {log.type === CallType.VIDEO && <VideoCameraIcon className="w-4 h-4 inline-block ml-1.5 text-blue-500"/>}
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">
                          {new Date(log.callTime).toLocaleString()} - Status: <span className={`capitalize font-medium ${style}`}>{log.status}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {log.status === CallStatus.ANSWERED || log.status === CallStatus.ENDED ? (
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">Duration: {formatDuration(log.durationSeconds)}</p>
                      ) : (
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 italic">{log.status === CallStatus.MISSED ? "Missed" : log.status === CallStatus.DECLINED ? "Declined" : "Not Answered"}</p>
                      )}
                       <Button size="sm" variant="ghost" onClick={() => handleCallAgain(log)} className="mt-1 text-xs">Call Again</Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-center py-10 text-secondary-500 dark:text-secondary-400">No call history found.</p>
      )}
    </div>
  );
};

export default CallHistoryPage;
