
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCallManager } from '../../hooks/useCallManager';
import Button from '../../components/common/Button';
import { PhoneIcon } from '../../assets/icons';

// This page can be a dedicated UI for an active call or redirect to show the CallModal
// For now, it's a simple placeholder that could show some call info or trigger the modal.

const ActiveCallPage: React.FC = () => {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const { activeCall, isCallModalOpen } = useCallManager();

  useEffect(() => {
    // If there's an activeCall in context and its ID matches, the CallModal should ideally handle display.
    // This page might be redundant if CallModal is globally managed and shown.
    // If no active call matches, or modal isn't open, perhaps redirect.
    if (!activeCall || activeCall.id !== callId || !isCallModalOpen) {
      // console.warn(`ActiveCallPage: No matching active call (${callId}) in context or modal closed. Redirecting.`);
      // navigate('/call-history'); // Or to dashboard
    }
  }, [activeCall, callId, isCallModalOpen, navigate]);

  if (!activeCall || activeCall.id !== callId) {
    return (
        <div className="container mx-auto p-6 text-center">
            <p className="text-xl text-secondary-700">Call session not found or has ended.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">Go to Dashboard</Button>
        </div>
    );
  }
  
  // The CallModal should be handling the display. This page might just ensure the context is right.
  // Or, this page could BE the detailed active call UI if CallModal is only for incoming/outgoing ringing states.
  // For simplicity, we'll assume CallModal handles the main UI.

  return (
    <div className="container mx-auto p-6 text-center flex flex-col items-center justify-center h-full">
      <PhoneIcon className="w-16 h-16 text-primary-500 mb-4 animate-pulse" />
      <h1 className="text-2xl font-semibold text-secondary-800">Call In Progress</h1>
      <p className="text-secondary-600">Call ID: {callId}</p>
      <p className="mt-4 text-sm text-secondary-500">The call window should be active.</p>
      {/* If CallModal is not globally visible, this page would need to render the full call UI itself */}
    </div>
  );
};

export default ActiveCallPage;
