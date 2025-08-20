
import React, { createContext, useState, useCallback, ReactNode, useEffect, useMemo, useRef } from 'react';
import { CallLog, User, CallType, CallStatus, CallContextType, CallParticipant, WebRTCSignalPayload } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const CallContext = createContext<CallContextType | undefined>(undefined);
const API_URL = 'http://localhost:3001/api';

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const [activeCall, setActiveCall] = useState<CallLog | null>(null);
  const [pendingIncomingCall, setPendingIncomingCall] = useState<CallLog | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callModalState, setCallModalState] = useState<'idle' | 'outgoing' | 'incoming' | 'active' | 'requestingPermissions'>('idle');
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({}); // Keyed by participant userId
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({}); // Keyed by participant userId

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const ringingAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio !== 'undefined') {
        ringingAudioRef.current = new Audio('/assets/sounds/ringing.mp3');
        ringingAudioRef.current.loop = true;
    }
    return () => {
        if (ringingAudioRef.current) {
            ringingAudioRef.current.pause();
            ringingAudioRef.current.src = ''; // Release audio resource
        }
    };
  }, []);

  const playRingingSound = useCallback(() => {
    ringingAudioRef.current?.play().catch(e => console.warn("Ringing sound play error:", e));
  }, []);
  const stopRingingSound = useCallback(() => {
    ringingAudioRef.current?.pause();
    if(ringingAudioRef.current) ringingAudioRef.current.currentTime = 0;
  }, []);

  const getWebSocket = (): WebSocket | null => (window as any).socket || null;

  const stopLocalStreamTracks = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      console.log("CallContext: Local stream tracks stopped.");
    }
  }, [localStream]);

  const cleanupPeerConnections = useCallback(() => {
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    setRemoteStreams({});
    console.log("CallContext: Peer connections cleaned up.");
  }, []);

  const resetCallState = useCallback(() => {
    stopLocalStreamTracks();
    cleanupPeerConnections();
    setActiveCall(null);
    setPendingIncomingCall(null);
    setIsCallModalOpen(false);
    setCallModalState('idle');
    setIsMuted(false);
    setIsVideoOff(false);
    stopRingingSound();
    console.log("CallContext: Full call state reset.");
  }, [stopLocalStreamTracks, cleanupPeerConnections, stopRingingSound]);

  const sendSignalingMessage = useCallback((targetUserId: string | null, payload: WebRTCSignalPayload) => {
    const ws = getWebSocket();
    if (ws && ws.readyState === WebSocket.OPEN && activeCall) {
      ws.send(JSON.stringify({ type: 'webrtc-signal', callId: activeCall.id, targetUserId, payload }));
      console.log(`CallContext: Sent WebRTC signal (${payload.type}) for call ${activeCall.id} ${targetUserId ? `to ${targetUserId}` : 'to call participants'}.`);
    } else {
      console.error('CallContext: WebSocket not connected or no active call. Cannot send signaling message.');
    }
  }, [activeCall]);
  
  // Effect for handling WebSocket messages related to calls
  useEffect(() => {
    const ws = getWebSocket();
    if (!ws || !user) return;

    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string);
        console.log("CallContext WebSocket message received: ", message);
        
        if (message.type === 'webrtc-signal' && activeCall?.id === message.callId && message.senderUserId !== user.id) {
          console.log('CallContext: Received WebRTC signal:', message.payload);
          // TODO: Handle specific WebRTC signals (offer, answer, ICE)
        } else if (message.type === 'participant-joined-signal' && activeCall && message.payload?.callId === activeCall.id) {
            const { joinedParticipant } = message.payload;
            if (joinedParticipant.userId === user.id) return; // Ignore self-join confirmation
            setActiveCall(prev => {
                if (!prev || prev.id !== activeCall.id) return prev;
                const updatedParticipants = prev.participants.map(p => 
                    p.userId === joinedParticipant.userId ? { ...p, status: 'connected' as CallParticipant['status'] } : p
                );
                // Ensure participant is in the list if somehow missed initially
                if (!updatedParticipants.find(p => p.userId === joinedParticipant.userId)) {
                    updatedParticipants.push({ ...joinedParticipant, status: 'connected' as CallParticipant['status'] });
                }
                return { ...prev, participants: updatedParticipants, status: CallStatus.ANSWERED };
            });
            if (callModalState === 'outgoing') { // If I was the one calling and someone answered
                stopRingingSound();
                setCallModalState('active');
            }
            addToast({type: 'info', message: `${joinedParticipant.name} joined the call.`});
        } else if (message.type === 'participant-left-signal' && activeCall && message.payload?.callId === activeCall.id) {
            const { leftParticipant, reason } = message.payload;
            if (leftParticipant.userId === user.id) return; // Already handled locally by endCall
            addToast({type: 'info', message: `${leftParticipant.name} ${reason === 'declined' ? 'declined' : 'left'} the call.`});
            setActiveCall(prev => {
                if (!prev || prev.id !== activeCall.id) return prev;
                const updatedParticipants = prev.participants.map(p => 
                    p.userId === leftParticipant.userId ? { ...p, status: (reason === 'declined' ? 'declined' : 'left') as CallParticipant['status'] } : p
                );
                // Check if there are enough connected participants to continue the call
                const stillConnected = updatedParticipants.filter(p => p.status === 'connected');
                if (stillConnected.length < 2) { // If less than 2 (e.g., only self left), end the call
                    resetCallState(); // Use the simpler resetCallState
                    return null; 
                }
                return { ...prev, participants: updatedParticipants };
            });
        } else if ((message.type === 'call-declined-signal' || message.type === 'user-busy-signal') && activeCall && message.payload?.callId === activeCall.id) {
            // This is for the initiator when a receiver declines or is busy
            const relevantParticipant = activeCall.participants.find(p => p.userId === message.payload?.receiverId || p.userId === (message.payload?.rejectedBy || message.payload?.busyUserId) );
            addToast({type: 'info', message: `Call with ${relevantParticipant?.name || 'participant'} ${message.type === 'user-busy-signal' ? 'could not be established (user busy)' : 'was declined'}.`});
            // If it's a 1-on-1 call, reset. For group calls, this logic might differ (e.g., continue if other participants are ringing).
            if (!activeCall.isGroupCall || activeCall.participants.filter(p => p.userId !== user.id && p.status === 'ringing').length === 0) {
                 resetCallState();
            } else {
                 // Update participant status in group call
                setActiveCall(prev => {
                    if (!prev || prev.id !== activeCall.id) return prev;
                    const statusToSet = message.type === 'user-busy-signal' ? 'busy' : 'declined';
                    const updatedParticipants = prev.participants.map(p =>
                        p.userId === (message.payload?.rejectedBy || message.payload?.busyUserId) ? { ...p, status: statusToSet as CallParticipant['status'] } : p
                    );
                    return { ...prev, participants: updatedParticipants };
                });
            }
        } else if (message.type === 'call-ended-signal' && activeCall && message.payload?.callId === activeCall.id) {
          // This message indicates the call was definitively ended by someone (e.g. last person left)
          console.log(`CallContext: Call ${activeCall.id} ended by ${message.payload?.endedBy}`);
          addToast({ type: 'info', message: `Call ended.` });
          resetCallState();
        }
      } catch (error) {
        console.error('CallContext: Error processing WebSocket message:', error);
      }
    };

    ws.addEventListener('message', handleWebSocketMessage);
    return () => {
      ws.removeEventListener('message', handleWebSocketMessage);
    };
  }, [user, activeCall, addToast, resetCallState, stopRingingSound, callModalState]);


  const initiateCall = useCallback(async (receivers: User[], type: CallType) => {
    if (!user) {
      addToast({ type: 'error', message: "You must be logged in." });
      return;
    }
    // If already in a call or attempting one, reset first.
    if (activeCall || pendingIncomingCall || isCallModalOpen) {
      resetCallState(); // Clear previous state
      await new Promise(r => setTimeout(r, 100)); // Small delay for state to clear if needed
    }

    const receiverIds = receivers.map(r => r.id).filter(id => id !== user.id); // Exclude self
    if (receiverIds.length === 0) {
      addToast({type: 'error', message: "No valid receivers."});
      return;
    }
    
    setCallModalState('outgoing');
    setIsCallModalOpen(true);
    playRingingSound();

    try {
      const response = await fetch(`${API_URL}/calls/initiate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ receiverIds, callType: type }),
      });
      const newCall: CallLog = await response.json(); // Server should return the created CallLog object
      if (!response.ok) {
          // Handle specific error cases, e.g., user busy (409)
          if (response.status !== 409) { // 409 means user busy, server might still return call details
             throw new Error(newCall.message || "Failed to initiate call.");
          }
          // If it's 409, the `newCall` object might have participant statuses updated
      }
      setActiveCall(newCall); // Server now returns the full call log
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
      resetCallState();
    }
  }, [user, getAuthHeaders, addToast, activeCall, pendingIncomingCall, isCallModalOpen, resetCallState, playRingingSound]);

  const answerCall = useCallback(async (callToAnswer: CallLog) => {
    if (!user) return;
    stopRingingSound();
    
    // Optimistically update UI
    const newActiveCallState: CallLog = {
        ...callToAnswer, 
        status: CallStatus.ANSWERED, 
        answeredTime: new Date().toISOString(),
        participants: callToAnswer.participants.map(p => p.userId === user.id ? {...p, status: 'connected'} : p)
    };
    setActiveCall(newActiveCallState);
    setPendingIncomingCall(null); // Clear pending call
    setCallModalState('active');
    setIsCallModalOpen(true); // Ensure modal stays open or opens if not already

    try {
      const response = await fetch(`${API_URL}/calls/${callToAnswer.id}/answer`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to answer call on server.');
      const updatedCallFromServer: CallLog = await response.json();
      // Sync with server state if needed, especially participant statuses
      setActiveCall(prev => prev ? { ...prev, ...updatedCallFromServer } : updatedCallFromServer);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || "Failed to update call status." });
      resetCallState(); // Rollback on error
    }
  }, [user, getAuthHeaders, addToast, resetCallState, stopRingingSound]);

  const declineCall = useCallback(async (callToDecline: CallLog) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/calls/${callToDecline.id}/decline`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      addToast({ type: 'info', message: 'Call declined.' });
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || "Failed to decline call." });
    }
    resetCallState();
  }, [user, getAuthHeaders, addToast, resetCallState]);

  const endCall = useCallback(async (callToEnd?: CallLog | null) => {
    const call = callToEnd || activeCall; 
    if (!call || !user) {
      resetCallState();
      return;
    }
    try {
      await fetch(`${API_URL}/calls/${call.id}/end`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      addToast({ type: 'info', message: 'You left the call.' });
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || "Failed to end/leave call." });
    }
    resetCallState();
  }, [user, getAuthHeaders, addToast, resetCallState, activeCall]); 

  const closeCallModal = useCallback(() => {
    const callToHandle = pendingIncomingCall || activeCall;
    if (callToHandle) {
        if (callModalState === 'incoming' || callToHandle.status === CallStatus.RINGING || callToHandle.status === CallStatus.INITIATED) {
            declineCall(callToHandle);
        } else if (callModalState === 'active' || callModalState === 'outgoing') {
            endCall(callToHandle);
        } else {
            resetCallState();
        }
    } else {
        resetCallState(); // General cleanup if no specific call to handle
    }
  }, [pendingIncomingCall, activeCall, callModalState, declineCall, endCall, resetCallState]);

  const setIncomingCall = useCallback((call: CallLog) => {
    if (activeCall || isCallModalOpen) { // If already in a call or modal open (e.g., outgoing)
        addToast({type: 'info', message: `Missed call from ${call.initiatorName} (you're busy).`});
        // Optionally, inform the server this user is busy for this specific call attempt
        fetch(`${API_URL}/calls/${call.id}/busy`, { method: 'PUT', headers: getAuthHeaders() }).catch(console.error);
        return;
    }
    setPendingIncomingCall(call);
    setActiveCall(call); // Set activeCall as well, as this is now the "active" context
    setCallModalState('incoming');
    setIsCallModalOpen(true);
    playRingingSound();
  }, [activeCall, isCallModalOpen, addToast, playRingingSound, getAuthHeaders]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
        const newMutedState = !prev;
        if(localStream) localStream.getAudioTracks().forEach(track => track.enabled = !newMutedState);
        return newMutedState;
    });
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    setIsVideoOff(prev => {
        const newVideoOffState = !prev;
        if(localStream) localStream.getVideoTracks().forEach(track => track.enabled = !newVideoOffState);
        return newVideoOffState;
    });
  }, [localStream]);


  const contextValue: CallContextType = useMemo(() => ({ 
    activeCall, pendingIncomingCall, isCallModalOpen, callModalState, 
    localStream, remoteStreams,
    initiateCall, answerCall, declineCall, endCall, closeCallModal, setIncomingCall,
    toggleMute, toggleVideo, isMuted, isVideoOff, sendSignalingMessage,
  }), [
    activeCall, pendingIncomingCall, isCallModalOpen, callModalState, 
    localStream, remoteStreams,
    initiateCall, answerCall, declineCall, endCall, closeCallModal, setIncomingCall,
    toggleMute, toggleVideo, isMuted, isVideoOff, sendSignalingMessage
  ]);

  return (
    <CallContext.Provider value={contextValue}>
      {children}
    </CallContext.Provider>
  );
};

export default CallContext;
    