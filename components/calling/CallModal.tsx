
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { CallLog, CallType, CallStatus, UserRole, CallParticipant } from '../../types';
import { PhoneIcon, VideoCameraIcon, MicrophoneIcon, MicrophoneSlashIcon, VideoCameraSlashIcon, PhoneMissedCallIcon, CloseIcon, UsersIcon } from '../../assets/icons';
import { useCallManager } from '../../hooks/useCallManager';
import { useAuth } from '../../hooks/useAuth';

export const CallModal: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { 
    activeCall, 
    isCallModalOpen, 
    callModalState, 
    answerCall, 
    declineCall, 
    endCall, 
    closeCallModal,
    pendingIncomingCall,
    localStream, 
    remoteStreams, 
    toggleMute, 
    toggleVideo, 
    isMuted: contextIsMuted, 
    isVideoOff: contextIsVideoOff, 
  } = useCallManager();


  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({}); 

  const callToDisplay = callModalState === 'incoming' ? pendingIncomingCall : activeCall;

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    return () => { 
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
    }
  }, [localStream]);


  useEffect(() => {
    if (!callToDisplay || !currentUser) return;

    Object.keys(remoteVideoRefs.current).forEach(userId => {
        const videoEl = remoteVideoRefs.current[userId];
        if (videoEl && remoteStreams[userId]) {
            videoEl.srcObject = remoteStreams[userId];
        } else if (videoEl) {
            videoEl.srcObject = null; 
        }
    });
    // Ensure refs are cleaned up for users no longer in remoteStreams or participants
    const currentParticipantUserIds = new Set(callToDisplay.participants.map(p => p.userId));
    Object.keys(remoteVideoRefs.current).forEach(userId => {
        if (!currentParticipantUserIds.has(userId) || !remoteStreams[userId]) {
            const videoEl = remoteVideoRefs.current[userId];
            if (videoEl) videoEl.srcObject = null;
            delete remoteVideoRefs.current[userId];
        }
    });


  }, [remoteStreams, callToDisplay, currentUser]);


  useEffect(() => {
    if (callModalState === 'active' && callToDisplay?.answeredTime) {
      const startTime = new Date(callToDisplay.answeredTime).getTime();
      setTimer(Math.floor((Date.now() - startTime) / 1000));
      timerIntervalRef.current = window.setInterval(() => {
        setTimer(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setTimer(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callModalState, callToDisplay?.answeredTime]);


  if (!isCallModalOpen || !callToDisplay || !currentUser) return null;

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  const getOtherParticipants = () => {
    return callToDisplay.participants.filter(p => p.userId !== currentUser.id);
  };

  const otherParticipants = getOtherParticipants();
  const primaryOtherParty = otherParticipants.find(p => p.status === 'connected' || p.status === 'ringing' || p.status === 'invited') || otherParticipants[0];
  
  let otherPartyName = "Participant(s)";
  let otherPartyAvatar = null;
  let isGroupDisplay = callToDisplay.isGroupCall || otherParticipants.length > 1;

  if (isGroupDisplay) {
    otherPartyName = callToDisplay.name || `Group Call (${otherParticipants.length + 1})`;
  } else if (primaryOtherParty) {
    otherPartyName = primaryOtherParty.name;
    otherPartyAvatar = primaryOtherParty.avatar;
  } else if (callToDisplay.initiatorId !== currentUser.id) { 
    otherPartyName = callToDisplay.initiatorName;
    otherPartyAvatar = callToDisplay.initiatorAvatar;
  }


  const renderContent = () => {
    switch (callModalState) {
      case 'outgoing':
        return (
          <div className="text-center p-4">
            <p className="text-xl font-semibold mb-2 text-secondary-800 dark:text-dark-text">Calling {otherPartyName}...</p>
            {otherPartyAvatar && !isGroupDisplay ? (
                <img src={otherPartyAvatar} alt={otherPartyName} className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-primary-200 dark:border-primary-500 shadow-lg"/>
            ) : isGroupDisplay ? (
                <div className="w-28 h-28 rounded-full bg-secondary-300 dark:bg-secondary-600 flex items-center justify-center text-4xl text-secondary-700 dark:text-secondary-200 mx-auto mb-4 border-4 border-primary-200 dark:border-primary-500 shadow-lg">
                    <UsersIcon className="w-16 h-16" />
                </div>
            ) : (
                <div className="w-28 h-28 rounded-full bg-secondary-300 dark:bg-secondary-600 flex items-center justify-center text-4xl text-secondary-700 dark:text-secondary-200 mx-auto mb-4 border-4 border-primary-200 dark:border-primary-500 shadow-lg">
                    {otherPartyName.charAt(0).toUpperCase()}
                </div>
            )}
            <p className="text-sm text-secondary-500 dark:text-secondary-400">Type: <span className="capitalize">{callToDisplay.type}</span></p>
            {callToDisplay.type === CallType.VIDEO && localStream && (
              <div className="relative w-full aspect-video bg-black dark:bg-secondary-800 rounded-lg my-4 overflow-hidden shadow-inner">
                {!contextIsVideoOff ? (
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]"></video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary-400 dark:text-secondary-500">Video is off</div>
                )}
              </div>
            )}
          </div>
        );
      case 'incoming':
        return (
          <div className="text-center p-4">
            <p className="text-xl font-semibold mb-2 text-secondary-800 dark:text-dark-text">Incoming Call from {callToDisplay.initiatorName}</p>
             {callToDisplay.initiatorAvatar ? (
                <img src={callToDisplay.initiatorAvatar} alt={callToDisplay.initiatorName} className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-green-400 shadow-lg"/>
            ) : (
                <div className="w-28 h-28 rounded-full bg-green-300 flex items-center justify-center text-4xl text-green-700 mx-auto mb-4 border-4 border-green-400 shadow-lg">
                    {callToDisplay.initiatorName.charAt(0).toUpperCase()}
                </div>
            )}
            <p className="text-sm text-secondary-500 dark:text-secondary-400">Type: <span className="capitalize">{callToDisplay.type}</span></p>
          </div>
        );
      case 'active':
        const mainRemoteStreamUser = otherParticipants.find(p => p.status === 'connected');
        // const mainRemoteStream = mainRemoteStreamUser ? remoteStreams[mainRemoteStreamUser.userId] : null; // No longer needed directly for srcObject

        return (
          <div className="text-center p-4">
            <p className="text-xl font-semibold mb-2 text-secondary-800 dark:text-dark-text">Call with {otherPartyName}</p>
            <p className="text-lg text-primary-600 dark:text-primary-400 mb-4">{formatDuration(timer)}</p>
             {callToDisplay.type === CallType.VIDEO ? (
              <div className="relative w-full aspect-video bg-black dark:bg-secondary-800 rounded-lg mb-4 overflow-hidden shadow-md">
                {/* Main Remote Video */}
                <video 
                    ref={el => { if(mainRemoteStreamUser && el) remoteVideoRefs.current[mainRemoteStreamUser.userId] = el; }} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                ></video>
                {!remoteStreams[mainRemoteStreamUser?.userId || ''] && (
                    <div className="absolute inset-0 flex items-center justify-center text-secondary-400 dark:text-secondary-500">
                        {otherParticipants.some(p => p.status === 'ringing') ? 'Waiting for participant...' : 'Remote video not available'}
                    </div>
                )}
                
                {/* Local Video Preview (Picture-in-Picture style) */}
                {localStream && !contextIsVideoOff && (
                    <video ref={localVideoRef} autoPlay muted playsInline className="absolute bottom-3 right-3 w-1/4 max-w-[120px] aspect-video object-cover rounded-md border-2 border-white dark:border-dark-border shadow-lg transform scale-x-[-1]"></video>
                )}
                 {/* Additional remote streams in a group call */}
                {isGroupDisplay && otherParticipants.length > 1 && (
                    <div className="absolute top-3 left-3 flex flex-col space-y-1">
                        {otherParticipants
                            .filter(p => p.userId !== mainRemoteStreamUser?.userId && p.status === 'connected' && remoteStreams[p.userId])
                            .slice(0, 2) // Limit displayed PiP videos for simplicity
                            .map(p => (
                                <video 
                                    key={p.userId} 
                                    ref={el => { if(el) remoteVideoRefs.current[p.userId] = el; }} 
                                    autoPlay 
                                    playsInline 
                                    className="w-1/5 max-w-[80px] aspect-video object-cover rounded border border-white dark:border-dark-border shadow-sm" 
                                />
                        ))}
                    </div>
                )}
              </div>
            ) : (
                // Audio call UI
                <div className="my-6">
                     {otherPartyAvatar && !isGroupDisplay ? (
                        <img src={otherPartyAvatar} alt={otherPartyName} className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-4 border-primary-300 shadow-lg"/>
                    ) : isGroupDisplay ? (
                         <div className="w-24 h-24 rounded-full bg-secondary-300 dark:bg-secondary-600 flex items-center justify-center text-3xl text-secondary-700 dark:text-secondary-200 mx-auto mb-3 border-4 border-primary-300 shadow-lg">
                             <UsersIcon className="w-12 h-12" />
                         </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-secondary-300 dark:bg-secondary-600 flex items-center justify-center text-3xl text-secondary-700 dark:text-secondary-200 mx-auto mb-3 border-4 border-primary-300 shadow-lg">
                           {otherPartyName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <p className="text-sm text-secondary-600 dark:text-secondary-300">Audio Call</p>
                </div>
            )}
          </div>
        );
      default: 
        return <p className="text-center text-secondary-500 dark:text-secondary-400 p-4">Preparing call...</p>;
    }
  };

  const renderActions = () => {
    switch (callModalState) {
      case 'outgoing':
        return (
          <Button onClick={() => closeCallModal()} variant="danger" className="w-full" leftIcon={<PhoneMissedCallIcon className="w-5 h-5"/>}>
            Cancel Call
          </Button>
        );
      case 'incoming':
        return (
          <div className="flex justify-around">
            <Button onClick={() => declineCall(callToDisplay)} variant="danger" className="flex-1 mr-2" leftIcon={<PhoneMissedCallIcon className="w-5 h-5"/>}>
              Decline
            </Button>
            <Button onClick={() => answerCall(callToDisplay)} variant="primary" className="flex-1 ml-2" leftIcon={callToDisplay.type === CallType.VIDEO ? <VideoCameraIcon className="w-5 h-5"/> : <PhoneIcon className="w-5 h-5"/>}>
              Answer
            </Button>
          </div>
        );
      case 'active':
        return (
          <div className="flex justify-center items-center space-x-3">
            <Button onClick={toggleMute} variant="secondary" size="sm" className="p-2.5 rounded-full" aria-label={contextIsMuted ? "Unmute" : "Mute"}>
              {contextIsMuted ? <MicrophoneSlashIcon className="w-5 h-5"/> : <MicrophoneIcon className="w-5 h-5"/>}
            </Button>
            {callToDisplay.type === CallType.VIDEO && (
              <Button onClick={toggleVideo} variant="secondary" size="sm" className="p-2.5 rounded-full" aria-label={contextIsVideoOff ? "Turn Video On" : "Turn Video Off"}>
                {contextIsVideoOff ? <VideoCameraSlashIcon className="w-5 h-5"/> : <VideoCameraIcon className="w-5 h-5"/>}
              </Button>
            )}
            <Button onClick={() => endCall(callToDisplay)} variant="danger" className="px-6 py-2.5 rounded-full" leftIcon={<PhoneMissedCallIcon className="w-5 h-5"/>}>
              End Call
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isCallModalOpen} onClose={closeCallModal} title="" size={callToDisplay.type === CallType.VIDEO && callModalState === 'active' ? 'xl' : 'sm'}>
      <div className="flex flex-col">
        {renderContent()}
        <div className={`mt-4 p-4 border-t border-secondary-100 dark:border-dark-border ${callModalState === 'active' ? 'bg-secondary-50 dark:bg-secondary-800' : ''}`}>
          {renderActions()}
        </div>
      </div>
    </Modal>
  );
};
