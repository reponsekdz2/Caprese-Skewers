
import React, { useState, useEffect, useCallback } from 'react';
import { TeacherResource } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { ExamsIcon, ArrowRightIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const StudentAvailableExamsPage: React.FC = () => {
  const [availableExams, setAvailableExams] = useState<TeacherResource[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchAvailableExams = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/student/live-exams`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch available exams.');
      const data: TeacherResource[] = await response.json();
      setAvailableExams(data);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load exams.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchAvailableExams();
  }, [fetchAvailableExams]);

  const handleTakeExam = (examId: string) => {
    navigate(`/student/exams/${examId}/take`);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <ExamsIcon className="w-8 h-8 text-primary-600 mr-3" />
        <h1 className="text-3xl font-bold text-secondary-800">Available Online Exams</h1>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading available exams...</p>
        </div>
      ) : availableExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary-700 mb-2">{exam.title}</h2>
                <p className="text-sm text-secondary-600 mb-1">Subject: {exam.subject || 'General'}</p>
                <p className="text-sm text-secondary-600 mb-1">Class: {exam.className || 'All Classes'}</p>
                <p className="text-sm text-secondary-600 mb-3">Duration: {exam.examDurationMinutes || 'N/A'} minutes</p>
                {exam.description && <p className="text-xs text-secondary-500 mb-4 italic">"{exam.description}"</p>}
              </div>
              <Button 
                variant="primary" 
                onClick={() => handleTakeExam(exam.id)}
                rightIcon={<ArrowRightIcon className="w-4 h-4"/>}
                className="w-full mt-auto"
              >
                Start Exam
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <ExamsIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Exams Available Right Now</h2>
          <p className="text-secondary-500 mt-2">Check back later or contact your teacher for more information.</p>
        </div>
      )}
    </div>
  );
};

export default StudentAvailableExamsPage;
