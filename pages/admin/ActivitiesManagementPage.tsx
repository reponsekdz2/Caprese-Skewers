
import React, { useState, useEffect, useCallback } from 'react';
import { Activity, User, UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ActivityForm from '../../components/activities/ActivityForm'; 
import { ActivityIcon, PlusIcon, EditIcon, DeleteIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const ActivitiesManagementPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setIsSaving] = useState(false);

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchActivitiesAndTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const [activitiesRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/activities`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/users`, { headers: getAuthHeaders() }) 
      ]);

      if (!activitiesRes.ok) throw new Error('Failed to fetch activities');
      setActivities(await activitiesRes.json());
      
      if (usersRes.ok) {
        const allUsers: User[] = await usersRes.json();
        setTeachers(allUsers.filter(u => u.role === UserRole.TEACHER || u.role === UserRole.STAFF || u.role === UserRole.HEAD_TEACHER));
      } else {
        setTeachers([]);
        addToast({type: 'warning', message: 'Could not load teachers list for assignment.'});
      }

    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load activities data.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchActivitiesAndTeachers();
  }, [fetchActivitiesAndTeachers]);

  const handleSaveActivity = async (activityData: Partial<Activity>) => {
    setIsSaving(true);
    const method = editingActivity ? 'PUT' : 'POST';
    const url = editingActivity ? `${API_URL}/activities/${editingActivity.id}` : `${API_URL}/activities`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(), 
        body: JSON.stringify(activityData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingActivity ? 'update' : 'create'} activity`);
      }
      addToast({ type: 'success', message: `Activity ${editingActivity ? 'updated' : 'created'} successfully!` });
      fetchActivitiesAndTeachers();
      setIsModalOpen(false);
      setEditingActivity(null);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  };
  
  const openCreateModal = () => {
    setEditingActivity(null);
    setIsModalOpen(true);
  };

  const openEditModal = (activity: Activity) => {
    setEditingActivity(activity);
    setIsModalOpen(true);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (window.confirm('Are you sure you want to delete this activity? All enrollments will also be removed.')) {
      setIsSaving(true);
      try {
        await fetch(`${API_URL}/activities/${activityId}`, { method: 'DELETE', headers: getAuthHeaders() });
        addToast({ type: 'success', message: 'Activity deleted successfully.' });
        fetchActivitiesAndTeachers();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message || 'Failed to delete activity.' });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center">
          <ActivityIcon className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
          Manage Extracurricular Activities
        </h1>
        <Button onClick={openCreateModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="mt-4 sm:mt-0">
          Create New Activity
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div><p className="mt-2 dark:text-secondary-400">Loading activities...</p></div>
      ) : activities.length > 0 ? (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-dark-border">
              <thead className="bg-secondary-50 dark:bg-secondary-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Teacher</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Schedule</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Participants</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Enrollment Open</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 dark:divide-dark-border">
                {activities.map(activity => (
                  <tr key={activity.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                    <td className="px-4 py-2 text-sm font-medium dark:text-dark-text">{activity.name}</td>
                    <td className="px-4 py-2 text-sm dark:text-secondary-300">{activity.category}</td>
                    <td className="px-4 py-2 text-sm dark:text-secondary-300">{activity.teacherInChargeName || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm dark:text-secondary-300">{activity.schedule}</td>
                    <td className="px-4 py-2 text-sm dark:text-secondary-300">{activity.currentParticipantsCount || 0} / {activity.maxParticipants || 'Unlimited'}</td>
                    <td className="px-4 py-2 text-sm dark:text-secondary-300">{activity.isEnrollmentOpen ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-sm space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(activity)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label={`Edit ${activity.name}`} />
                      <Button variant="danger" size="sm" onClick={() => handleDeleteActivity(activity.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label={`Delete ${activity.name}`} disabled={saving}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-center py-10 text-secondary-500 dark:text-secondary-400">No activities found. Create one to get started!</p>
      )}
      
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingActivity(null); }} title={editingActivity ? "Edit Activity" : "Create New Activity"} size="lg">
            <ActivityForm 
                activity={editingActivity} 
                teachers={teachers} 
                onSave={handleSaveActivity} 
                onCancel={() => { setIsModalOpen(false); setEditingActivity(null); }}
                isSaving={saving}
            />
        </Modal>
      )}
    </div>
  );
};

export default ActivitiesManagementPage;
