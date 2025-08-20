
import React, { useState, useEffect, useCallback } from 'react';
import { Activity } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import ActivityCard from '../../components/activities/ActivityCard'; 
import { ActivityIcon, PlusIcon, MinusIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const StudentActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [myActivityIds, setMyActivityIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processingActivityId, setProcessingActivityId] = useState<string | null>(null);

  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchActivitiesAndEnrollments = useCallback(async () => {
    if(!user) return;
    setLoading(true);
    try {
      const [activitiesRes, enrollmentsRes] = await Promise.all([
        fetch(`${API_URL}/activities?enrollmentOpen=true`, { headers: getAuthHeaders() }), 
        fetch(`${API_URL}/student/activities/my-enrollments`, { headers: getAuthHeaders() })
      ]);

      if (!activitiesRes.ok) throw new Error('Failed to fetch activities');
      const activitiesData: Activity[] = await activitiesRes.json();
      setActivities(activitiesData);
      
      if (enrollmentsRes.ok) {
        const myEnrollmentsData: { activityId: string }[] = await enrollmentsRes.json();
        setMyActivityIds(new Set(myEnrollmentsData.map(e => e.activityId)));
      }

    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load activities data.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchActivitiesAndEnrollments();
  }, [fetchActivitiesAndEnrollments]);

  const handleEnroll = async (activityId: string) => {
    setProcessingActivityId(activityId);
    try {
      const response = await fetch(`${API_URL}/student/activities/${activityId}/enroll`, { method: 'POST', headers: getAuthHeaders() });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to enroll.');
      }
      addToast({ type: 'success', message: 'Successfully enrolled!' });
      fetchActivitiesAndEnrollments(); 
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setProcessingActivityId(null);
    }
  };

  const handleWithdraw = async (activityId: string) => {
     if (!window.confirm("Are you sure you want to withdraw from this activity?")) return;
    setProcessingActivityId(activityId);
    try {
      const response = await fetch(`${API_URL}/student/activities/${activityId}/withdraw`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!response.ok) {
         const err = await response.json();
        throw new Error(err.message || 'Failed to withdraw.');
      }
      addToast({ type: 'success', message: 'Successfully withdrawn.' });
      fetchActivitiesAndEnrollments(); 
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setProcessingActivityId(null);
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <ActivityIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" />
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text">Extracurricular Activities</h1>
      </div>

      {loading ? (
        <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div><p className="mt-2 dark:text-secondary-400">Loading activities...</p></div>
      ) : activities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} showEnrollmentStatus={true}>
              {myActivityIds.has(activity.id) ? (
                <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleWithdraw(activity.id)} 
                    disabled={processingActivityId === activity.id}
                    leftIcon={<MinusIcon className="w-4 h-4"/>}
                    className="w-full mt-3"
                >
                  {processingActivityId === activity.id ? 'Withdrawing...' : 'Withdraw'}
                </Button>
              ) : (
                <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handleEnroll(activity.id)}
                    disabled={processingActivityId === activity.id || (activity.maxParticipants !== null && (activity.currentParticipantsCount || 0) >= activity.maxParticipants && activity.isEnrollmentOpen !== false)}
                    leftIcon={<PlusIcon className="w-4 h-4"/>}
                    className="w-full mt-3"
                >
                  {processingActivityId === activity.id ? 'Enrolling...' : 
                   (activity.maxParticipants !== null && (activity.currentParticipantsCount || 0) >= activity.maxParticipants) ? 'Full' : 
                   (activity.isEnrollmentOpen === false ? 'Enrollment Closed' : 'Enroll')}
                </Button>
              )}
            </ActivityCard>
          ))}
        </div>
      ) : (
        <p className="text-center py-10 text-secondary-500 dark:text-secondary-400">No activities available for enrollment at this time.</p>
      )}
    </div>
  );
};

export default StudentActivitiesPage;
