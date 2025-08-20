
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DoctorDashboardData, UserRole } from '../../types';
import { UsersIcon as PatientIcon, BellIcon, CalendarDaysIcon, PlusIcon } from '../../assets/icons'; // Using UsersIcon as PatientIcon
import { useToast } from '../../hooks/useToast';
import WidgetCard from '../../components/common/WidgetCard';
import Button from '../../components/common/Button';
import DashboardStatCard from '../../components/common/DashboardStatCard';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input'; // For notification sender

const API_URL = 'http://localhost:3001/api';

const DoctorDashboardPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DoctorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // For notification sender
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dashboard/doctor/${user.id}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch doctor dashboard data');
      const data: DoctorDashboardData = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Fetch doctor dashboard error:", error);
      addToast({ type: 'error', message: 'Could not load your dashboard data.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      addToast({ type: 'warning', message: 'Title and message are required for notification.' });
      return;
    }
    setSendingNotification(true);
    try {
      const payload = {
        title: notificationTitle,
        message: notificationMessage,
        type: 'info', // Default type for health advisories
        targetRole: UserRole.STUDENT, // Example: send to all students
        // targetUserId: null, // Can be specified for individual messages
      };
      const response = await fetch(`${API_URL}/notifications/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to send notification.');
      }
      addToast({ type: 'success', message: 'Health advisory sent successfully!' });
      setNotificationTitle('');
      setNotificationMessage('');
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setSendingNotification(false);
    }
  };


  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  if (!dashboardData) {
    return <div className="text-center py-10">Failed to load dashboard data. Please try again later.</div>;
  }

  const { upcomingAppointmentsCount, recentWellnessAlerts, totalStudentsMonitored } = dashboardData;
  
  const statCards = [
    { id: 'upcoming-appointments', title: "Upcoming Appointments", value: upcomingAppointmentsCount, icon: CalendarDaysIcon, bgColorClass: 'bg-gradient-to-br from-blue-500 to-blue-600', linkTo: '/doctor/appointments' },
    { id: 'wellness-alerts', title: "Recent Wellness Alerts", value: recentWellnessAlerts.length, icon: BellIcon, bgColorClass: 'bg-gradient-to-br from-yellow-500 to-yellow-600', linkTo: '/doctor/wellness-logs?filter=alerts' },
    { id: 'students-monitored', title: "Students Monitored", value: totalStudentsMonitored, icon: PatientIcon, bgColorClass: 'bg-gradient-to-br from-green-500 to-green-600', linkTo: '/doctor/wellness-logs' },
  ];

  return (
    <div className="container mx-auto space-y-6 sm:space-y-8 p-4">
      <div className="flex items-center">
        {/* Doctor specific icon could be added here */}
        <PatientIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mr-3 sm:mr-4" />
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800 dark:text-dark-text">Doctor's Dashboard</h1>
            {user && <p className="text-secondary-600 dark:text-secondary-300 text-sm sm:text-base">Welcome, {user.name}!</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map(stat => <DashboardStatCard key={stat.id} {...stat} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetCard title="Quick Actions" size="medium" className="lg:col-span-1">
            <div className="space-y-3">
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<PatientIcon className="w-5 h-5"/>} onClick={() => navigate('/doctor/wellness-logs')}>View Student Wellness Logs</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<PlusIcon className="w-5 h-5"/>} onClick={() => navigate('/doctor/wellness-logs?action=new')}>Log New Wellness Entry</Button>
                 {/* Add more doctor-specific actions here */}
            </div>
        </WidgetCard>

        <WidgetCard title="Recent Wellness Alerts" size="large" className="lg:col-span-2">
            {recentWellnessAlerts.length > 0 ? (
                 <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {recentWellnessAlerts.map(alert => (
                        <li key={alert.logId} className="p-3 bg-yellow-50 dark:bg-yellow-700 dark:bg-opacity-20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-600 dark:hover:bg-opacity-30 transition-colors shadow-sm">
                            <div className="flex justify-between items-center">
                                <p className="font-medium text-yellow-800 dark:text-yellow-200">{alert.studentName} - Mood: <span className="capitalize font-semibold">{alert.mood}</span></p>
                                <span className="text-xs text-yellow-700 dark:text-yellow-300">{new Date(alert.date).toLocaleDateString()}</span>
                            </div>
                            <Button size="sm" variant="ghost" className="text-xs mt-1" onClick={() => navigate(`/doctor/wellness-logs/${alert.logId}`)}>View Details</Button>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-secondary-500 dark:text-secondary-400">No recent wellness alerts for students.</p>}
        </WidgetCard>
      </div>
      
      <WidgetCard title="Send Health Advisory Notification">
        <div className="space-y-3">
            <Input
                label="Advisory Title"
                id="notificationTitle"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="e.g., Flu Season Reminder, Hydration Tips"
            />
            <Input
                label="Advisory Message"
                id="notificationMessage"
                type="textarea"
                rows={3}
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter the details of the health advisory..."
            />
            <Button onClick={handleSendNotification} variant="primary" disabled={sendingNotification}>
                {sendingNotification ? 'Sending...' : 'Send Advisory to Students'}
            </Button>
        </div>
      </WidgetCard>

      <p className="mt-8 text-center text-sm text-secondary-500 dark:text-secondary-400">Dedicated to student health and well-being.</p>
    </div>
  );
};

export default DoctorDashboardPage;
