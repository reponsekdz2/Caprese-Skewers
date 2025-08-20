
import React, { useState, useEffect, useCallback } from 'react';
import { Activity, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import ActivityCard from '../../components/activities/ActivityCard'; 
import { ActivityIcon } from '../../assets/icons';
import Select from '../../components/common/Select'; // For selecting child if parent has multiple

const API_URL = 'http://localhost:3001/api';

const ParentActivitiesPage: React.FC = () => {
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [childEnrollments, setChildEnrollments] = useState<Activity[]>([]); 
  const [childList, setChildList] = useState<User[]>([]); 
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    let childUserIdToFetch = user.childUserId; 
    if (selectedChildId) {
        childUserIdToFetch = selectedChildId;
    }

    try {
      const activitiesRes = await fetch(`${API_URL}/activities`, { headers: getAuthHeaders() });
      if (!activitiesRes.ok) throw new Error('Failed to fetch school activities');
      const activitiesData = await activitiesRes.json();
      setAllActivities(activitiesData);

      if (childUserIdToFetch) {
        const enrollmentsRes = await fetch(`${API_URL}/parent/child/${childUserIdToFetch}/activities`, { headers: getAuthHeaders() });
        if (enrollmentsRes.ok) {
          const enrolledActivitiesData : {activity: Activity}[] = await enrollmentsRes.json();
          setChildEnrollments(enrolledActivitiesData.map(e => e.activity));
        } else {
          console.warn("Could not fetch child's enrolled activities.");
          setChildEnrollments([]);
        }
      } else {
        setChildEnrollments([]); // No child selected or linked
      }

    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load activities data.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast, selectedChildId]);

  useEffect(() => {
    // TODO: If parent can have multiple children, fetch list of children here and allow selection
    if (user && user.childUserId && !selectedChildId) {
        setSelectedChildId(user.childUserId); // Set initial child if available
    }
    fetchData();
  }, [fetchData, user, selectedChildId]);


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <ActivityIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" />
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text">School Activities</h1>
      </div>
      
      {/* TODO: Child selector if parent has multiple children - for now, uses linked childUserId */}

      {loading ? (
        <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div><p className="mt-2 dark:text-secondary-400">Loading activities...</p></div>
      ) : (
        <>
          {selectedChildId && childEnrollments.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-secondary-700 dark:text-dark-text mb-4">My Child's Enrolled Activities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {childEnrollments.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} showEnrollmentStatus={false} />
                ))}
              </div>
            </section>
          )}
           {selectedChildId && childEnrollments.length === 0 && !loading && (
               <p className="text-center py-6 text-secondary-500 dark:text-secondary-400">Your child is not currently enrolled in any activities.</p>
           )}
            {!selectedChildId && !loading && (
                 <p className="text-center py-6 text-secondary-500 dark:text-secondary-400">Please ensure your child is linked to your account to see their enrollments.</p>
            )}


          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-secondary-700 dark:text-dark-text mb-4">All School Activities</h2>
            {allActivities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allActivities.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} showEnrollmentStatus={true} />
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-secondary-500 dark:text-secondary-400">No school activities listed at this time.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default ParentActivitiesPage;
