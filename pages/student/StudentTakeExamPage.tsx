
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TeacherResource, OnlineExamAttempt } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import { ExamsIcon, HomeIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const StudentTakeExamPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const [examDetails, setExamDetails] = useState<TeacherResource | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const fetchExamDetails = useCallback(async () => {
    if (!examId || !user) return;
    setLoading(true);
    try {
      // This endpoint might need to be specific for students to fetch a single live exam's details
      const response = await fetch(`${API_URL}/student/live-exams/${examId}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch exam details.');
      const data: TeacherResource = await response.json();
      setExamDetails(data);
      if (data.examDurationMinutes) {
        setTimeLeft(data.examDurationMinutes * 60);
      }
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load exam details.' });
      navigate('/student/exams');
    } finally {
      setLoading(false);
    }
  }, [examId, user, getAuthHeaders, addToast, navigate]);

  useEffect(() => {
    fetchExamDetails();
  }, [fetchExamDetails]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime !== null && prevTime <= 1) {
          clearInterval(timer);
          // Auto-submit or notify user
          addToast({ type: 'warning', message: "Time's up! Submitting your attempt." });
          handleSubmitAttempt(true); // Pass a flag for auto-submission
          return 0;
        }
        return prevTime !== null ? prevTime - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmitAttempt = async (isAutoSubmit: boolean = false) => {
    if (!examId || !user) return;
    if (!submissionText && !isAutoSubmit) {
        addToast({type: 'warning', message: 'Please write your answers before submitting.'});
        return;
    }
    setSubmitting(true);
    try {
      const payload: Partial<OnlineExamAttempt> = {
        studentUserId: user.id,
        examResourceId: examId,
        submissionText: submissionText,
      };
      const response = await fetch(`${API_URL}/student/submit-exam`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to submit exam attempt.');
      }
      addToast({ type: 'success', message: 'Exam submitted successfully!' });
      navigate('/student/dashboard'); 
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not submit exam.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  if (!examDetails) {
    return (
        <div className="container mx-auto p-6 text-center">
            <p className="text-xl text-red-600">Exam not found or not available.</p>
            <Button onClick={() => navigate('/student/exams')} leftIcon={<HomeIcon className="w-4 h-4"/>} className="mt-4">Back to Available Exams</Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 border-b pb-4">
            <div>
                <h1 className="text-3xl font-bold text-primary-700 mb-1">{examDetails.title}</h1>
                <p className="text-sm text-secondary-600">Subject: {examDetails.subject || 'General'} | Class: {examDetails.className || 'All Classes'}</p>
            </div>
            {timeLeft !== null && (
                <div className={`text-xl font-semibold p-3 rounded-md shadow ${timeLeft <= 300 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    Time Left: {formatTime(timeLeft)}
                </div>
            )}
        </div>

        <div className="mb-6 prose max-w-none">
          <h3 className="text-lg font-semibold text-secondary-800 mb-2">Instructions:</h3>
          {examDetails.description && <p className="text-sm text-secondary-600 mb-3">{examDetails.description}</p>}
          <p className="text-sm text-secondary-600">Read all questions carefully. Submit your answers in the space provided below.</p>
          {/* TODO: Display exam content if `examDetails.examContent` is used, or provide download link if `examDetails.fileUrl` is primary */}
          {examDetails.fileUrl && (
            <p className="mt-2">
              <a href={examDetails.fileUrl} download={examDetails.fileName} className="text-blue-600 hover:underline">
                Download Exam Paper ({examDetails.fileName})
              </a>
            </p>
          )}
          {examDetails.examContent && (
            <div className="mt-4 p-4 border rounded-md bg-secondary-50">
                <h4 className="font-semibold mb-2">Exam Questions:</h4>
                <div dangerouslySetInnerHTML={{ __html: examDetails.examContent.replace(/\n/g, '<br />') }} />
            </div>
          )}
           {!examDetails.fileUrl && !examDetails.examContent && (
                <p className="mt-4 text-red-500">Exam content not available. Please contact your teacher.</p>
           )}
        </div>

        <div>
          <label htmlFor="submissionText" className="block text-lg font-semibold text-secondary-800 mb-2">Your Answers:</label>
          <textarea
            id="submissionText"
            rows={15}
            className="w-full p-3 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            placeholder="Type your answers here..."
            disabled={submitting || timeLeft === 0}
          />
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => navigate('/student/exams')} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleSubmitAttempt()} 
            disabled={submitting || timeLeft === 0}
            leftIcon={<ExamsIcon className="w-5 h-5"/>}
          >
            {submitting ? 'Submitting...' : "Submit Exam"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentTakeExamPage;
