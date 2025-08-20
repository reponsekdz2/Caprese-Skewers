import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UsersIcon, HistoryIcon, StudentIcon, ClassIcon, SettingsIcon, NoticeIcon, ChartBarIcon, LeaveIcon, BellIcon as EventLogIcon } from '../../assets/icons';
import { Link } from 'react-router-dom'; // Changed import
import Button from '../../components/common/Button';
import { AdminDashboardStats, LogEntry, UserRole } from '../../types';
import { useToast } from '../../hooks/useToast';
import DashboardStatCard from '../../components/common/DashboardStatCard';
import WidgetCard from '../../components/common/WidgetCard';
import ActivityFeedItem from '../../components/common/ActivityFeedItem';

const API_URL = 'http://localhost:3001/api';

interface SystemEvent {
  id: string;
  timestamp: string;
  type: 'login' | 'registration' | 'error' | 'update' | 'security';
  message: string;
  user?: string;
}

const RoleDistributionChart: React.FC<{ data: Record<UserRole, number> | undefined }> = ({ data }) => {
    if (!data) return <p className="text-secondary-500 dark:text-secondary-400">Role data unavailable.</p>;

    const roles = Object.entries(data).sort(([,a], [,b]) => b - a);
    const maxCount = Math.max(...roles.map(([,count]) => count), 1);

    const roleColors: Record<UserRole, string> = {
        [UserRole.ADMIN]: 'bg-red-500',
        [UserRole.TEACHER]: 'bg-green-500',
        [UserRole.STUDENT]: 'bg-blue-500',
        [UserRole.PARENT]: 'bg-yellow-600',
        [UserRole.LIBRARIAN]: 'bg-indigo-500',
        [UserRole.BURSAR]: 'bg-purple-500',
        [UserRole.ACCOUNTANT]: 'bg-pink-500',
        [UserRole.HEAD_TEACHER]: 'bg-teal-500',
        [UserRole.DISCIPLINARIAN]: 'bg-orange-500',
        [UserRole.STAFF]: 'bg-gray-500',
        [UserRole.DOCTOR]: 'bg-cyan-500', // Added Doctor role color
    };
    
    return (
        <div className="space-y-3 p-2">
            {roles.map(([role, count]) => (
                <div key={role} className="flex items-center group">
                    <span className="text-xs font-medium text-secondary-600 dark:text-secondary-300 w-28 truncate group-hover:font-semibold" title={role as string}>{role}</span>
                    <div className="flex-1 bg-secondary-200 dark:bg-secondary-700 rounded-full h-5 relative">
                        <div
                            className={`${roleColors[role as UserRole] || 'bg-secondary-400 dark:bg-secondary-500'} h-5 rounded-full text-white text-xs flex items-center justify-end pr-2 transition-all duration-300 ease-out group-hover:shadow-md`}
                            style={{ width: `${(count / maxCount) * 100}%` }}
                            title={`${count} users`}
                        >
                           {count > 0 ? count : ''}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const SystemEventLog: React.FC = () => {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const { getAuthHeaders } = useAuth(); // Use if fetching real events

  const fetchEvents = useCallback(async () => {
    // Replace with actual API call when ready
    // For now, simulate fetching new events
    const newEventTypes: SystemEvent['type'][] = ['login', 'registration', 'update', 'error', 'security'];
    const randomUser = `user${Math.floor(Math.random()*1000)}@example.com`;
    const newEvent: SystemEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: newEventTypes[Math.floor(Math.random() * newEventTypes.length)],
        message: `Simulated event: Action by ${randomUser.substring(0,8)}. Details: ${Math.random().toString(36).substring(2, 15)}.`,
        user: Math.random() > 0.3 ? randomUser : undefined
    };
    setEvents(prev => [newEvent, ...prev.slice(0,19)]); // Keep last 20 events
  }, []);

  useEffect(() => {
    fetchEvents(); // Initial fetch
    const intervalId = setInterval(fetchEvents, 5000); // Fetch new events every 5 seconds
    return () => clearInterval(intervalId);
  }, [fetchEvents]);

  const getEventTypeIcon = (type: SystemEvent['type']) => {
    // Basic icon mapping, can be expanded
    switch(type) {
        case 'login': return <UsersIcon className="w-4 h-4 text-green-500"/>;
        case 'registration': return <UsersIcon className="w-4 h-4 text-blue-500"/>;
        case 'error': return <EventLogIcon className="w-4 h-4 text-red-500"/>; // Placeholder, use specific ErrorIcon if available
        case 'security': return <SettingsIcon className="w-4 h-4 text-yellow-500"/>;
        default: return <EventLogIcon className="w-4 h-4 text-secondary-500"/>;
    }
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {events.length === 0 && <p className="text-sm text-secondary-500 dark:text-secondary-400">No system events logged yet.</p>}
        {events.map(event => (
            <div key={event.id} className="p-2.5 border-b border-secondary-100 dark:border-dark-border last:border-b-0 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-md transition-colors">
                <div className="flex items-start text-xs">
                    <span className="mr-2 pt-0.5">{getEventTypeIcon(event.type)}</span>
                    <div className="flex-grow">
                        <p className="text-secondary-700 dark:text-secondary-200 break-words">{event.message}</p>
                        <p className="text-secondary-400 dark:text-secondary-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                            {event.user && <span className="italic"> - by {event.user}</span>}
                        </p>
                    </div>
                </div>
            </div>
        ))}
    </div>
  );
};


const DashboardPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState<AdminDashboardStats & { pendingApprovals?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dashboard/admin`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch dashboard statistics');
      const data: AdminDashboardStats & { pendingApprovals?: number } = await response.json();
      setStats(data);
    } catch (error) {
        console.error("Error loading admin dashboard stats:", error);
        addToast({ type: 'error', message: 'Could not load dashboard statistics.' });
    } finally {
        setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  if (!stats) {
    return <div className="text-center py-10">Failed to load dashboard data. Please try again later.</div>;
  }

  const statCardsData = [
    { id: 'total-users', title: 'Total Users', value: stats.totalUsers, icon: UsersIcon, bgColorClass: 'bg-gradient-to-r from-blue-500 to-blue-600', linkTo: '/admin/users' },
    { id: 'total-students', title: 'Total Students', value: stats.totalStudents, icon: StudentIcon, bgColorClass: 'bg-gradient-to-r from-green-500 to-green-600', linkTo: '/admin/students' },
    { id: 'total-teachers', title: 'Total Teachers', value: stats.totalTeachers, icon: UsersIcon, bgColorClass: 'bg-gradient-to-r from-purple-500 to-purple-600', linkTo: '/admin/users?role=Teacher' },
    { id: 'total-classes', title: 'Total Classes', value: stats.totalClasses, icon: ClassIcon, bgColorClass: 'bg-gradient-to-r from-yellow-500 to-yellow-600', linkTo: '/admin/classes' },
    { id: 'active-today', title: 'Active Users Today', value: stats.activeUsersToday ?? 0, icon: ChartBarIcon, bgColorClass: 'bg-gradient-to-r from-pink-500 to-pink-600' },
    { id: 'pending-approvals', title: 'Pending Approvals', value: stats.pendingApprovals ?? 0, icon: LeaveIcon, bgColorClass: 'bg-gradient-to-r from-orange-500 to-orange-600', linkTo: '/admin/hr/leave' },
  ];


  return (
    <div className="container mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text mb-1">Admin Dashboard</h1>
        <p className="text-secondary-600 dark:text-secondary-300">Welcome, {user?.name}! Overview of the school system.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCardsData.map((stat) => (
          <DashboardStatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetCard title="Recent Activity Log" size="large" className="lg:col-span-2">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <ul className="divide-y divide-secondary-100 dark:divide-dark-border max-h-96 overflow-y-auto pr-2">
                    {stats.recentActivity.map(log => <ActivityFeedItem key={log.id} item={log} />)}
                </ul>
            ) : (
                <p className="text-secondary-500 dark:text-secondary-400">No recent activity.</p>
            )}
             <Link to="/admin/history" className="block mt-4 text-right"> {/* Changed usage */}
                <Button variant="ghost" size="sm" rightIcon={<HistoryIcon className="w-4 h-4"/>}>View Full Activity Log</Button>
            </Link> {/* Changed usage */}
        </WidgetCard>
        
        <WidgetCard title="Quick Actions" size="medium" className="lg:col-span-1">
            <div className="space-y-3">
                <Link to="/admin/users/add" className="block w-full text-left"> {/* Changed usage */}
                  <Button variant="secondary" className="w-full justify-start" leftIcon={<UsersIcon className="w-5 h-5"/>}>Add New User</Button>
                </Link> {/* Changed usage */}
                <Link to="/admin/communication/notices/new" className="block w-full text-left"> {/* Changed usage */}
                  <Button variant="secondary" className="w-full justify-start" leftIcon={<NoticeIcon className="w-5 h-5"/>}>Create Announcement</Button>
                </Link> {/* Changed usage */}
                <Link to="/admin/settings" className="block w-full text-left"> {/* Changed usage */}
                  <Button variant="secondary" className="w-full justify-start" leftIcon={<SettingsIcon className="w-5 h-5"/>}>System Settings</Button>
                </Link> {/* Changed usage */}
            </div>
        </WidgetCard>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <WidgetCard title="User Role Distribution" size="medium" className="lg:col-span-1">
            <RoleDistributionChart data={stats.userRoleDistribution} />
        </WidgetCard>
         <WidgetCard title="System Event Log (Simulated)" size="large" className="lg:col-span-2">
            <SystemEventLog />
        </WidgetCard>
       </div>
    </div>
  );
};

export default DashboardPage;