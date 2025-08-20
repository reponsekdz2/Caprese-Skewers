import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { HeadTeacherIcon, UsersIcon, ReportIcon, AcademicsIcon, NoticeIcon, ArrowRightIcon, UsersIcon as StaffIcon, BellIcon as CommunicationIcon } from '../../assets/icons';
import { Link, useNavigate } from 'react-router-dom'; // Changed import
import { useToast } from '../../hooks/useToast';
import WidgetCard from '../../components/common/WidgetCard';
import DashboardStatCard from '../../components/common/DashboardStatCard';
import Button from '../../components/common/Button';

interface HeadTeacherDashboardData {
    overallStudentAttendance: number;
    staffOnLeaveToday: number;
    academicPerformanceTrend: { month: string, averageGrade: number }[];
    keyMetrics: { teacherStudentRatio: string; graduationRate: string };
    recentAnnouncements: { id: string, title: string, date: string }[];
}


const API_URL = 'http://localhost:3001/api';

const HeadTeacherDashboardPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate(); // Changed usage
  const [dashboardData, setDashboardData] = useState<HeadTeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);


  const fetchDashboardData = useCallback(async () => {
    if(!user) return;
    setLoading(true);
    try {
        const response = await fetch (`${API_URL}/dashboard/headteacher/${user.id}`, { headers: getAuthHeaders() });
        if(!response.ok) throw new Error('Failed to fetch Head Teacher dashboard data');
        const data: HeadTeacherDashboardData = await response.json();
        setDashboardData(data);
    } catch (error) {
        console.error("Fetch Head Teacher dashboard error:", error);
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
  
  const { overallStudentAttendance, staffOnLeaveToday, academicPerformanceTrend, keyMetrics, recentAnnouncements } = dashboardData;

   const statCards = [
    {id: 'student-attendance', title: "Overall Student Attendance", value: `${overallStudentAttendance}%`, icon: AcademicsIcon, bgColorClass: 'bg-gradient-to-br from-teal-500 to-teal-600', linkTo: '/admin/academics/attendance'},
    {id: 'staff-on-leave', title: "Staff on Leave Today", value: staffOnLeaveToday, icon: UsersIcon, bgColorClass: 'bg-gradient-to-br from-orange-500 to-orange-600', linkTo: '/admin/hr/leave'},
    {id: 'teacher-student-ratio', title: "Teacher-Student Ratio", value: keyMetrics.teacherStudentRatio, icon: UsersIcon, bgColorClass: 'bg-gradient-to-br from-cyan-500 to-cyan-600'},
    {id: 'graduation-rate', title: "Graduation Rate", value: keyMetrics.graduationRate, icon: ReportIcon, bgColorClass: 'bg-gradient-to-br from-lime-500 to-lime-600'}
  ];


  return (
    <div className="container mx-auto space-y-6 sm:space-y-8 p-4">
      <div className="flex items-center">
        <HeadTeacherIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mr-3 sm:mr-4" />
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800">Head Teacher's Office</h1>
            {user && <p className="text-secondary-600 text-sm sm:text-base">Welcome, {user.name}!</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map(stat => <DashboardStatCard key={stat.id} {...stat} />)}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetCard title="Academic Performance Trend" size="large" className="lg:col-span-2">
            <div className="flex justify-around items-end h-48 bg-secondary-50 p-4 rounded-md shadow">
                {academicPerformanceTrend.map(item => (
                    <div key={item.month} className="text-center group flex flex-col justify-end items-center h-full">
                        <div
                            className="bg-primary-500 rounded-t-md mx-auto transition-all duration-300 ease-in-out group-hover:bg-primary-600"
                            style={{ height: `${item.averageGrade}%`, width: '35px' }}
                            title={`Avg. Grade: ${item.averageGrade}%`}
                        ></div>
                        <p className="text-xs mt-1 font-medium text-secondary-600">{item.month}</p>
                    </div>
                ))}
            </div>
            <p className="text-sm text-secondary-500 mt-2">Showing average grade trends over recent months.</p>
            <Link to="/headteacher/reports" className="block mt-3 text-right"> {/* Changed usage */}
                 <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>View Detailed Academic Reports</Button>
            </Link> {/* Changed usage */}
        </WidgetCard>

        <WidgetCard title="Quick Actions" size="medium" className="lg:col-span-1">
            <div className="space-y-3">
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<NoticeIcon className="w-5 h-5"/>} onClick={() => navigate('/admin/communication/notices')}>Manage Announcements</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<CommunicationIcon className="w-5 h-5"/>} onClick={() => navigate('/headteacher/communication')}>Send Messages</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<StaffIcon className="w-5 h-5"/>} onClick={() => navigate('/headteacher/staff')}>Staff Overview</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<UsersIcon className="w-5 h-5"/>} onClick={() => navigate('/headteacher/users')}>Manage User Accounts</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<ReportIcon className="w-5 h-5"/>} onClick={() => navigate('/admin/settings')}>School Settings & Policies</Button>
            </div>
        </WidgetCard>
      </div>

      <WidgetCard title="Recent School Announcements">
         {recentAnnouncements.length > 0 ? (
            <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {recentAnnouncements.map(notice => (
                    <li key={notice.id} className="p-3 border-b border-secondary-100 last:border-b-0 hover:bg-secondary-50 rounded-md">
                        <p className="font-medium text-secondary-700">{notice.title}</p>
                        <p className="text-xs text-secondary-500">Date: {new Date(notice.date).toLocaleDateString()}</p>
                    </li>
                ))}
            </ul>
         ) : <p className="text-secondary-500">No recent announcements.</p>}
         <Link to="/admin/communication/notices" className="block mt-3 text-right"> {/* Changed usage */}
             <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>Manage All Announcements</Button>
         </Link> {/* Changed usage */}
      </WidgetCard>

      <p className="mt-8 text-center text-sm text-secondary-500">Leading the way for academic excellence.</p>
    </div>
  );
};

export default HeadTeacherDashboardPage;