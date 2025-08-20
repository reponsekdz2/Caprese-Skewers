import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UsersIcon, ReportIcon, EventsIcon, LeaveIcon, ArrowRightIcon } from '../../assets/icons';
import { useNavigate, Link } from 'react-router-dom'; // Changed import
import { useToast } from '../../hooks/useToast';
import WidgetCard from '../../components/common/WidgetCard';
import DashboardStatCard from '../../components/common/DashboardStatCard';
import Button from '../../components/common/Button';

interface StaffDashboardData {
    pendingTasks: number;
    upcomingEvents: { id: string, title: string, date: string}[];
    leaveBalance: { type: string, balance: number }[];
    internalAnnouncements: { id: string, title: string, date: string}[];
}


const API_URL = 'http://localhost:3001/api';

const StaffDashboardPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate(); // Changed usage
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if(!user) return;
    setLoading(true);
    try {
        const response = await fetch (`${API_URL}/dashboard/staff/${user.id}`, { headers: getAuthHeaders() });
        if(!response.ok) throw new Error('Failed to fetch Staff dashboard data');
        const data: StaffDashboardData = await response.json();
        setDashboardData(data);
    } catch (error) {
        console.error("Fetch Staff dashboard error:", error);
        addToast({ type: 'error', message: 'Could not load dashboard data.'});
    } finally {
        setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  if (!dashboardData) {
    return <div className="text-center py-10">Failed to load dashboard data. Please try again later.</div>;
  }
  
  const { pendingTasks, upcomingEvents, leaveBalance, internalAnnouncements } = dashboardData;

  const statCards = [
    {id: 'pending-tasks', title: "My Pending Tasks", value: pendingTasks, icon: ReportIcon, bgColorClass: 'bg-gradient-to-br from-orange-500 to-orange-600', linkTo: '/staff/tasks'},
    {id: 'upcoming-events-count', title: "Upcoming Events", value: upcomingEvents.length, icon: EventsIcon, bgColorClass: 'bg-gradient-to-br from-sky-500 to-sky-600', linkTo: '/staff/calendar'}, // Assuming a calendar page
  ];

  return (
    <div className="container mx-auto space-y-6 sm:space-y-8 p-4">
      <div className="flex items-center">
        <UsersIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mr-3 sm:mr-4" />
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800">Staff Portal</h1>
            {user && <p className="text-secondary-600 text-sm sm:text-base">Welcome, {user.name}!</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map(stat => <DashboardStatCard key={stat.id} {...stat} />)}
        {/* Additional stat card for leave balance could be added here */}
        <DashboardStatCard
            id="leave-balance-summary"
            title="Annual Leave"
            value={`${leaveBalance.find(lb => lb.type === "Annual Leave")?.balance || 0} Days`}
            icon={LeaveIcon}
            bgColorClass="bg-gradient-to-br from-indigo-500 to-indigo-600"
            linkTo="/admin/hr/leave"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetCard title="My Calendar / Upcoming Events" size="large" className="lg:col-span-2">
            {upcomingEvents.length > 0 ? (
                <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {upcomingEvents.map(event => (
                        <li key={event.id} className="p-3 bg-secondary-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <p className="font-semibold text-secondary-700">{event.title}</p>
                            <p className="text-sm text-secondary-500">Date: {new Date(event.date).toLocaleDateString()}</p>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-secondary-500">No upcoming events or tasks in your calendar.</p>}
            <Link to="/staff/calendar" className="block mt-3 text-right"> {/* Changed usage */}
                 <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>View Full Calendar</Button>
            </Link> {/* Changed usage */}
        </WidgetCard>

        <WidgetCard title="Quick Actions" size="medium" className="lg:col-span-1">
            <div className="space-y-3">
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<LeaveIcon className="w-5 h-5"/>} onClick={() => navigate('/admin/hr/leave')}>Request Leave</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<ReportIcon className="w-5 h-5"/>} onClick={() => addToast({type: 'info', message: 'Accessing HR Policies (WIP)'})}>View HR Policies</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<UsersIcon className="w-5 h-5"/>} onClick={() => addToast({type: 'info', message: 'Opening Staff Directory (WIP)'})}>Access Staff Directory</Button>
            </div>
        </WidgetCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WidgetCard title="Leave Balances">
            {leaveBalance.length > 0 ? (
                <ul className="space-y-2">
                    {leaveBalance.map(leave => (
                        <li key={leave.type} className="flex justify-between items-center p-3 border-b border-secondary-100 last:border-b-0 hover:bg-secondary-50 rounded-md">
                            <span className="text-sm text-secondary-700">{leave.type}</span>
                            <span className="font-semibold text-sm text-primary-600">{leave.balance} days</span>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-secondary-500">Leave balance information not available.</p>}
        </WidgetCard>
        
        <WidgetCard title="Internal Announcements">
            {internalAnnouncements.length > 0 ? (
                <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {internalAnnouncements.map(notice => (
                        <li key={notice.id} className="p-3 border border-secondary-200 rounded-md hover:bg-secondary-100 transition-colors shadow-sm">
                            <p className="font-medium text-sm text-secondary-800">{notice.title}</p>
                            <p className="text-xs text-secondary-500">Published: {new Date(notice.date).toLocaleDateString()}</p>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-secondary-500">No internal announcements at this time.</p>}
            {/* Could link to a full notices page if one exists for staff */}
        </WidgetCard>
      </div>


      <p className="mt-8 text-center text-sm text-secondary-500">Your hub for staff-related information and tasks.</p>
    </div>
  );
};

export default StaffDashboardPage;