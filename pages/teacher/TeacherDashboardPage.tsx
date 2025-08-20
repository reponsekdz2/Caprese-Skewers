import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { TeacherIcon, ClassIcon, TimetableIcon, ExamsIcon, UsersIcon, ArrowRightIcon, BellIcon, SyllabusIcon, UsersIcon as MeetingIcon, PhoneIcon } from '../../assets/icons';
import { Link, useNavigate } from 'react-router-dom'; // Changed import
import { TeacherDashboardData, UpcomingEventOrAssignment, UserRole, CallType, User } from '../../types'; // Added CallType & User
import { useToast } from '../../hooks/useToast';
import WidgetCard from '../../components/common/WidgetCard';
import Button from '../../components/common/Button';
import DashboardStatCard from '../../components/common/DashboardStatCard';
import { useCallManager } from '../../hooks/useCallManager'; // Import useCallManager

const API_URL = 'http://localhost:3001/api';

const TeacherDashboardPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate(); // Changed usage
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { initiateCall } = useCallManager(); // Get initiateCall function

  // Mock parent contacts for call buttons - replace with actual data fetching logic
  const mockParentContacts: User[] = [ // Explicitly typed as User[]
    { id: 'parent-carol-id', name: 'Carol Parent (Bob\'s Parent)', role: UserRole.PARENT, email: 'parent@example.com' },
    // Add more if needed for demo
  ];

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dashboard/teacher/${user.id}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch teacher dashboard data');
      const data: TeacherDashboardData = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Fetch teacher dashboard error:", error);
      addToast({ type: 'error', message: 'Could not load your dashboard.' });
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
  
  const { myClassesSummary, upcomingLessons, pendingSubmissionsCount, totalStudentsTaught, meetingRequestsCount } = dashboardData;

  const statCards = [
    { id: 'classes-taught', title: "Classes Taught", value: myClassesSummary.length, icon: ClassIcon, bgColorClass: 'bg-gradient-to-br from-blue-500 to-blue-600', linkTo: '/teacher/classes' }, // Assuming a /teacher/classes route
    { id: 'total-students', title: "Total Students", value: totalStudentsTaught, icon: UsersIcon, bgColorClass: 'bg-gradient-to-br from-green-500 to-green-600' },
    { id: 'pending-submissions', title: "Pending Submissions", value: pendingSubmissionsCount, icon: ExamsIcon, bgColorClass: 'bg-gradient-to-br from-yellow-500 to-yellow-600', linkTo: '/teacher/exams' },
    { id: 'meeting-requests', title: "Meeting Requests", value: meetingRequestsCount || 0, icon: MeetingIcon, bgColorClass: 'bg-gradient-to-br from-purple-500 to-purple-600', linkTo: '/teacher/meetings'}
  ];


  return (
    <div className="container mx-auto space-y-6 sm:space-y-8 p-4">
      <div className="flex items-center">
        <TeacherIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mr-3 sm:mr-4" />
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800 dark:text-dark-text">Teacher's Hub</h1>
            {user && <p className="text-secondary-600 dark:text-secondary-300 text-sm sm:text-base">Welcome, {user.name}!</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map(stat => <DashboardStatCard key={stat.id} {...stat} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetCard title="My Classes" size="large" className="lg:col-span-2">
            {myClassesSummary.length > 0 ? (
                 <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {myClassesSummary.map(cls => (
                        <li key={cls.id} className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-shadow shadow hover:shadow-md">
                            <div className="flex justify-between items-center">
                                <Link to={`/teacher/classes/${cls.id}`} className="font-semibold text-lg text-primary-700 dark:text-primary-300 hover:underline">{cls.name} {cls.subject ? `(${cls.subject})` : ''}</Link> {/* Changed usage */}
                                <span className="text-sm text-secondary-600 dark:text-secondary-400 bg-secondary-200 dark:bg-secondary-600 px-2 py-1 rounded-md">{cls.studentCount} Students</span>
                            </div>
                            <div className="mt-3 flex space-x-2">
                                <Button size="sm" variant="ghost" onClick={() => navigate(`/teacher/gradebook?classId=${cls.id}`)}>Manage Grades</Button>
                                <Button size="sm" variant="ghost" onClick={() => navigate(`/teacher/resources?classId=${cls.id}`)}>Upload Resources</Button>
                                <Button size="sm" variant="ghost" onClick={() => navigate(`/teacher/attendance?classId=${cls.id}`)}>Take Attendance</Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-secondary-500 dark:text-secondary-400">You are not currently assigned to any classes.</p>}
        </WidgetCard>

        <WidgetCard title="Quick Actions" size="medium" className="lg:col-span-1">
            <div className="space-y-3">
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<ExamsIcon className="w-5 h-5"/>} onClick={() => navigate('/teacher/gradebook')}>Grade Submissions</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<SyllabusIcon className="w-5 h-5"/>} onClick={() => navigate('/teacher/resources')}>Manage My Resources</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<MeetingIcon className="w-5 h-5"/>} onClick={() => navigate('/teacher/meetings')}>Parent Meeting Requests</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<TimetableIcon className="w-5 h-5"/>} onClick={() => navigate('/my-timetable')}>View My Timetable</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<BellIcon className="w-5 h-5"/>} onClick={() => navigate('/teacher/announcements')}>Post Announcement</Button>
            </div>
        </WidgetCard>
      </div>

       <WidgetCard title="Parent Contacts (Quick Call)">
            <div className="space-y-2">
                {mockParentContacts.map(contact => (
                    <Button
                        key={contact.id}
                        variant="ghost"
                        className="w-full justify-start text-left border dark:border-dark-border"
                        onClick={() => initiateCall([contact], CallType.AUDIO)} // Wrapped contact in an array
                        leftIcon={<PhoneIcon className="w-4 h-4"/>}
                    >
                        Call {contact.name}
                    </Button>
                ))}
                 {mockParentContacts.length === 0 && <p className="text-sm text-secondary-500 dark:text-secondary-400">No parent contacts readily available here. Access via student profiles.</p>}
            </div>
        </WidgetCard>

      <WidgetCard title="Upcoming Lessons & Events">
            {upcomingLessons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingLessons.map(item => (
                        <div key={item.id} className="p-4 bg-primary-50 dark:bg-primary-700 dark:bg-opacity-30 rounded-lg shadow hover:shadow-md transition-shadow">
                            <p className="font-semibold text-primary-700 dark:text-primary-300">{item.title}</p>
                            <p className="text-sm text-primary-600 dark:text-primary-400">
                                On: {new Date(item.dueDate).toLocaleDateString()} at {new Date(item.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <span className="capitalize mt-1 inline-block px-2 py-0.5 rounded text-xs font-medium bg-primary-200 dark:bg-primary-600 text-primary-800 dark:text-primary-100">{item.type}</span>
                        </div>
                    ))}
                </div>
            ) : <p className="text-secondary-500 dark:text-secondary-400">No upcoming lessons or events scheduled in the near future.</p>}
      </WidgetCard>
      
      <p className="mt-8 text-center text-sm text-secondary-500 dark:text-secondary-400">Empowering educators. More tools on the way!</p>
    </div>
  );
};

export default TeacherDashboardPage;