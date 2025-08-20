import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import { BookOpenIcon, CheckCircleIcon, PlusIcon, MinusIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  credits: number;
  department: string;
}

interface Enrollment {
  id: string; // Added ID for enrollment record itself
  courseId: string;
  studentId: string;
  enrollmentDate: string;
  status: 'enrolled' | 'waitlisted' | 'completed';
}

const StudentCourseEnrollmentPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [processingEnrollmentId, setProcessingEnrollmentId] = useState<string | null>(null); // For enroll/unenroll

  const fetchAvailableCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const response = await fetch(`${API_URL}/courses`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to load available courses.');
      const data: Course[] = await response.json();
      setAvailableCourses(data);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load courses.' });
    } finally {
      setLoadingCourses(false);
    }
  }, [getAuthHeaders, addToast]);

  const fetchMyEnrollments = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/student/enrollments`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to load your enrollments.');
      const data: Enrollment[] = await response.json();
      setMyEnrollments(data);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load your enrollments.' });
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchAvailableCourses();
    fetchMyEnrollments();
  }, [fetchAvailableCourses, fetchMyEnrollments]);

  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    setProcessingEnrollmentId(courseId);
    try {
      const response = await fetch(`${API_URL}/student/enrollments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ courseId }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to enroll in course.');
      }
      addToast({ type: 'success', message: `Successfully enrolled in ${availableCourses.find(c => c.id === courseId)?.title}!` });
      fetchMyEnrollments(); // Refresh enrollments
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setProcessingEnrollmentId(null);
    }
  };
  
  const handleUnenroll = async (courseId: string) => {
    if (!user) return;
    const enrollment = myEnrollments.find(e => e.courseId === courseId && e.studentId === user.id);
    if (!enrollment) {
        addToast({type: 'error', message: "Enrollment record not found."});
        return;
    }

    if (!window.confirm(`Are you sure you want to unenroll from ${availableCourses.find(c => c.id === courseId)?.title}?`)) return;

    setProcessingEnrollmentId(courseId);
    try {
      // Assuming an endpoint /api/student/enrollments/:enrollmentId or /api/student/enrollments (with courseId in body for DELETE)
      // For simplicity, let's assume server can identify enrollment by studentId (from auth) and courseId from body/param.
      // We'll use a made-up endpoint for now. A more RESTful way might be DELETE /api/student/enrollments/:enrollmentId
      const response = await fetch(`${API_URL}/student/enrollments/${enrollment.id}`, { // Using enrollment ID
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to unenroll from course.');
      }
      addToast({ type: 'success', message: `Successfully unenrolled from ${availableCourses.find(c => c.id === courseId)?.title}.` });
      fetchMyEnrollments(); // Refresh enrollments
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setProcessingEnrollmentId(null);
    }
  };


  const isEnrolled = (courseId: string) => {
    return myEnrollments.some(enrollment => enrollment.courseId === courseId && enrollment.status === 'enrolled');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <BookOpenIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" />
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text">Course Enrollment</h1>
      </div>

      {loadingCourses ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Loading available courses...</p>
        </div>
      ) : availableCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableCourses.map((course) => (
            <div key={course.id} className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6 hover:shadow-xl dark:hover:shadow-primary-500/30 transition-all duration-300 transform hover:scale-105 flex flex-col justify-between animate-slideInUp">
              <div>
                <h2 className="text-xl font-semibold text-primary-700 dark:text-primary-300 mb-2">{course.title}</h2>
                <p className="text-sm text-secondary-600 dark:text-secondary-300 mb-1">Instructor: {course.instructor}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-300 mb-1">Department: {course.department}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-300 mb-3">Credits: {course.credits}</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4 line-clamp-3">{course.description}</p>
              </div>
              {isEnrolled(course.id) ? (
                <div className="flex items-center space-x-2 mt-auto">
                    <Button variant="secondary" disabled className="flex-1 opacity-70" leftIcon={<CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400"/>}>
                        Enrolled
                    </Button>
                     <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleUnenroll(course.id)}
                        disabled={processingEnrollmentId === course.id}
                        leftIcon={<MinusIcon className="w-4 h-4"/>}
                        title="Unenroll from course"
                    >
                        {processingEnrollmentId === course.id ? 'Processing...' : 'Unenroll'}
                    </Button>
                </div>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={() => handleEnroll(course.id)}
                  disabled={processingEnrollmentId === course.id}
                  className="w-full mt-auto"
                  leftIcon={<PlusIcon className="w-5 h-5"/>}
                >
                  {processingEnrollmentId === course.id ? 'Enrolling...' : 'Enroll in Course'}
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl shadow-md">
          <BookOpenIcon className="w-16 h-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">No Courses Available</h2>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2">Check back later for course offerings.</p>
        </div>
      )}
    </div>
  );
};

export default StudentCourseEnrollmentPage;