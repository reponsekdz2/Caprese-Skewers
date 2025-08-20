
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Mark, Student, User } from '../../types'; // Added User import
import { ReportIcon, HomeIcon } from '../../assets/icons';
import { useToast } from '../../hooks/useToast';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

const API_URL = 'http://localhost:3001/api';

const StudentGradesPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchStudentAndMarks = useCallback(async () => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);

    let studentIdToFetch: string | undefined;

    if (user.role === 'Student' && user.studentDetailsId) {
        studentIdToFetch = user.studentDetailsId;
         // Fetch student info for display (current student)
        try {
            const studentResponse = await fetch(`${API_URL}/students`, { headers: getAuthHeaders()}); 
            const allStudents: Student[] = await studentResponse.json();
            const SInfo = allStudents.find(s => s.id === studentIdToFetch);
            setStudentInfo(SInfo || null);
        } catch(e) {
            console.error("Error fetching current student details", e);
            // Non-critical error, continue to fetch marks
        }

    } else if (user.role === 'Parent' && user.childUserId) {
        try {
            const usersResponse = await fetch(`${API_URL}/users`, { headers: getAuthHeaders()});
            const allUsers: User[] = await usersResponse.json(); // User type is now imported
            const childUser = allUsers.find(u => u.id === user.childUserId);

            if (childUser && childUser.studentDetailsId) {
                studentIdToFetch = childUser.studentDetailsId;
                const studentResponse = await fetch(`${API_URL}/students`, { headers: getAuthHeaders()});
                const allStudents: Student[] = await studentResponse.json();
                const SInfo = allStudents.find(s => s.id === studentIdToFetch);
                setStudentInfo(SInfo || null);
            } else {
                 addToast({ type: 'error', message: 'Could not find child details.' });
                 setLoading(false);
                 return;
            }

        } catch(e) {
            addToast({ type: 'error', message: 'Error fetching child details.' });
            setLoading(false);
            return;
        }

    } else {
        addToast({ type: 'error', message: 'User role not supported for viewing grades directly.' });
        setLoading(false);
        return;
    }
    
    if (!studentIdToFetch) {
        addToast({ type: 'error', message: 'Student ID not found.' });
        setLoading(false);
        return;
    }


    try {
      const response = await fetch(`${API_URL}/student/${studentIdToFetch}/marks`, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error('Failed to fetch grades.');
      }
      const data: Mark[] = await response.json();
      // Sort by examName alphabetically as examDate is not directly available on Mark object
      setMarks(data.sort((a, b) => (a.examName || '').localeCompare(b.examName || '')));
    } catch (error: any) {
      console.error('Failed to fetch grades:', error);
      addToast({ type: 'error', message: error.message || 'Could not load grades.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchStudentAndMarks();
  }, [fetchStudentAndMarks]);

  const getMarkColor = (mark: number | null): string => {
    if (mark === null || mark === undefined) return 'text-secondary-500';
    if (mark >= 85) return 'text-green-600';
    if (mark >= 70) return 'text-yellow-600';
    if (mark >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const dashboardPath = user?.role === 'Student' ? '/student/dashboard' : user?.role === 'Parent' ? '/parent/dashboard' : '/';

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <div className="flex items-center mb-4 sm:mb-0">
            <ReportIcon className="w-10 h-10 text-primary-600 mr-3" />
            <div>
                 <h1 className="text-3xl font-bold text-secondary-800">My Grades</h1>
                 {user?.role === 'Parent' && studentInfo && <p className="text-secondary-600">Showing grades for {studentInfo.name}</p>}
                 {user?.role === 'Student' && studentInfo && <p className="text-secondary-600">Grades for {studentInfo.name}</p>}
            </div>
        </div>
        <Link to={dashboardPath}>
            <Button variant="secondary" size="sm" leftIcon={<HomeIcon className="w-4 h-4"/>}>
                Back to Dashboard
            </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div>
          <p className="ml-4 text-secondary-600">Loading grades...</p>
        </div>
      ) : marks.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Exam Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Marks Obtained</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Comments</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {marks.map((mark) => (
                  <tr key={mark.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{mark.examName || 'N/A'}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getMarkColor(mark.marksObtained)}`}>
                        {mark.marksObtained !== null && mark.marksObtained !== undefined ? `${mark.marksObtained}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-500 max-w-md break-words">{mark.comments || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <ReportIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Grades Available Yet.</h2>
          <p className="text-secondary-500 mt-2">Grades will appear here once they are published.</p>
        </div>
      )}
    </div>
  );
};

export default StudentGradesPage;