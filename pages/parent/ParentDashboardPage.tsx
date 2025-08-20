import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ParentIcon, ReportIcon, AttendanceIcon, NoticeIcon, FinanceIcon, EventsIcon, ArrowRightIcon, UsersIcon as MeetingIcon, UsersIcon as DisciplineIcon, PhoneIcon, UsersIcon as StaffIcon } from '../../assets/icons';
import { Link, useNavigate } from 'react-router-dom'; // Changed import
import { ParentDashboardData, Meeting, UserRole, CallType, User } from '../../types';
import { useToast } from '../../hooks/useToast';
import WidgetCard from '../../components/common/WidgetCard';
import Button from '../../components/common/Button';
import ProgressBar from '../../components/common/ProgressBar';
import DashboardStatCard from '../../components/common/DashboardStatCard';
import { useCallManager } from '../../hooks/useCallManager';

const API_URL = 'http://localhost:3001/api';

const ParentDashboardPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate(); // Changed usage
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { initiateCall } = useCallManager();

  // Mock contacts for calling - in a real app, fetch this data
  const mockSchoolContacts: User[] = [ // Explicitly typed as User[]
    { id: 'headteacher-mock-id', name: 'Mrs. Davison (Head Teacher)', email: 'headteacher@school.com', role: UserRole.HEAD_TEACHER, avatar: undefined /* Add avatar URL if available */ },
    // Assuming parent's child has a primary teacher. This would ideally come from child's class data.
    { id: 'teacher-mock-id', name: 'Mr. Smith (Child\'s Teacher)', email: 'teacher.smith@school.com', role: UserRole.TEACHER, avatar: undefined },
  ];


  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dashboard/parent/${user.id}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch parent dashboard data');
      const data: ParentDashboardData = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Fetch parent dashboard error:", error);
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

  const { childId, childName, childGrade, childAttendance, childRecentGrades, schoolAnnouncements, upcomingSchoolEvents, feeStatus, upcomingMeetings, childDisciplineCount } = dashboardData;
  
  const quickStats = [
    {id: 'child-attendance', title: "Child's Attendance", value: `${childAttendance.percentage}%`, icon: AttendanceIcon, bgColorClass: 'bg-gradient-to-br from-green-500 to-green-600', linkTo: '/my-attendance'},
    {id: 'child-grades', title: "Child's Grades", value: "View Marks", icon: ReportIcon, bgColorClass: 'bg-gradient-to-br from-blue-500 to-blue-600', linkTo: '/parent/grades'},
    {id: 'child-discipline', title: "Child Discipline", value: childDisciplineCount ? `${childDisciplineCount} Incidents` : "View Records", icon: DisciplineIcon, bgColorClass: 'bg-gradient-to-br from-red-500 to-red-600', linkTo: '/parent/discipline'},
  ];


  return (
    <div className="container mx-auto space-y-6 sm:space-y-8 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start">
        <div className="flex items-center mb-4 sm:mb-0">
            <ParentIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mr-3 sm:mr-4" />
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800 dark:text-dark-text">Parent's Corner</h1>
                {user && <p className="text-secondary-600 dark:text-secondary-300 text-sm sm:text-base">Welcome, {user.name}!</p>}
                {childName && childGrade && <p className="text-sm text-secondary-500 dark:text-secondary-400">Tracking progress for: {childName} (Grade {childGrade})</p>}
            </div>
        </div>
         <Button variant="primary" onClick={() => navigate('/parent/meetings')} leftIcon={<MeetingIcon className="w-5 h-5"/>}>
            Schedule Teacher Meeting
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {quickStats.map(stat => <DashboardStatCard key={stat.id} {...stat} />)}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {feeStatus && (
            <WidgetCard title="Fee Status" className="bg-red-50 dark:bg-red-900 dark:bg-opacity-30 md:col-span-1">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">${feeStatus.amountDue.toFixed(2)}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-300">Due by: {new Date(feeStatus.dueDate).toLocaleDateString()}</p>
                 <Link to="/parent/fees" className="block mt-4"> {/* Changed usage */}
                     <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>Pay Fees / View History</Button>
                 </Link> {/* Changed usage */}
            </WidgetCard>
        )}

        <WidgetCard title="School Contacts" className="md:col-span-1">
            <div className="space-y-2">
                {mockSchoolContacts.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700">
                        <div>
                            <p className="text-sm font-medium text-secondary-800 dark:text-dark-text">{contact.name}</p>
                            <p className="text-xs text-secondary-500 dark:text-secondary-400">{contact.role}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => initiateCall([contact], CallType.AUDIO)} // Wrapped contact in an array
                            leftIcon={<PhoneIcon className="w-4 h-4"/>}
                            aria-label={`Call ${contact.name}`}
                        >
                            Call
                        </Button>
                    </div>
                ))}
            </div>
        </WidgetCard>

        <WidgetCard title="Upcoming Teacher Meetings" className="md:col-span-1">
            {upcomingMeetings && upcomingMeetings.length > 0 ? (
                <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                     {upcomingMeetings.map(meeting => (
                        <li key={meeting.id} className={`p-3 border rounded-md shadow-sm ${meeting.status === 'confirmed' ? 'bg-green-50 dark:bg-green-800 dark:bg-opacity-20 border-green-200 dark:border-green-700' : 'bg-yellow-50 dark:bg-yellow-800 dark:bg-opacity-20 border-yellow-200 dark:border-yellow-700'}`}>
                            <p className="font-medium text-sm text-secondary-800 dark:text-dark-text">Meeting with: {meeting.teacherName}</p>
                            <p className="text-xs text-secondary-500 dark:text-secondary-400">Date: {new Date(meeting.proposedDate).toLocaleDateString()} at {meeting.proposedTime}</p>
                            <p className={`text-xs font-semibold capitalize ${meeting.status === 'confirmed' ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>{meeting.status}</p>
                            {meeting.status === 'confirmed' && meeting.meetingLink && <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Join Meeting</a>}
                        </li>
                    ))}
                </ul>
            ) : <p className="text-secondary-500 dark:text-secondary-400">No upcoming meetings scheduled.</p>}
            <Link to="/parent/meetings" className="block mt-4 text-right"> {/* Changed usage */}
                <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>Manage Meetings</Button>
            </Link> {/* Changed usage */}
        </WidgetCard>
      </div>

      <WidgetCard title="Child's Recent Grades">
        {childRecentGrades && childRecentGrades.length > 0 ? (
            <ul className="space-y-3">
                {childRecentGrades.map(grade => (
                    <li key={grade.id} className="flex justify-between items-center p-3 bg-secondary-50 dark:bg-secondary-700 rounded-md shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-sm font-medium text-secondary-800 dark:text-dark-text">{grade.examName}</span>
                        <span className={`font-semibold text-lg ${ (grade.marksObtained || 0) >= 80 ? 'text-green-600 dark:text-green-400' : (grade.marksObtained || 0) >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                           {grade.marksObtained !== null && grade.marksObtained !== undefined ? `${grade.marksObtained}%` : 'N/A'}
                        </span>
                    </li>
                ))}
            </ul>
        ) : <p className="text-secondary-500 dark:text-secondary-400">No recent grades posted for your child.</p>}
        <Link to="/parent/grades" className="block mt-4 text-right"> {/* Changed usage */}
             <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>View Full Progress Report</Button>
        </Link> {/* Changed usage */}
      </WidgetCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WidgetCard title="School Announcements">
            {schoolAnnouncements && schoolAnnouncements.length > 0 ? (
                <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {schoolAnnouncements.map(notice => (
                        <li key={notice.id} className="p-3 border border-secondary-200 dark:border-dark-border rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors shadow-sm">
                            <p className="font-medium text-sm text-secondary-800 dark:text-dark-text">{notice.title}</p>
                            <p className="text-xs text-secondary-500 dark:text-secondary-400">Published: {new Date(notice.publishDate).toLocaleDateString()}</p>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-secondary-500 dark:text-secondary-400">No new announcements from the school.</p>}
            {/* Link to parent notices page - assuming /parent/notices */}
            <Link to="/notifications" className="block mt-4 text-right"> {/* Changed usage */}
                <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>View All Notices</Button>
            </Link> {/* Changed usage */}
        </WidgetCard>
        <WidgetCard title="Upcoming School Events">
             {upcomingSchoolEvents && upcomingSchoolEvents.length > 0 ? (
                <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {upcomingSchoolEvents.map(event => (
                        <li key={event.id} className="p-3 border border-secondary-200 dark:border-dark-border rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors shadow-sm">
                            <p className="font-medium text-sm text-secondary-800 dark:text-dark-text">{event.title}</p>
                            <p className="text-xs text-secondary-500 dark:text-secondary-400">Date: {new Date(event.startDate).toLocaleDateString()}</p>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-secondary-500 dark:text-secondary-400">No upcoming school events.</p>}
            {/* Link to full events page if available - assuming /parent/events */}
             <Link to="/parent/events" className="block mt-4 text-right"> {/* Changed usage */}
                <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>View All Events</Button>
            </Link> {/* Changed usage */}
        </WidgetCard>
      </div>

      <p className="mt-8 text-center text-sm text-secondary-500 dark:text-secondary-400">Stay connected with your child's school life.</p>
    </div>
  );
};

export default ParentDashboardPage;