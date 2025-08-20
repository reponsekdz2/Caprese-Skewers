
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; // Changed import
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage'; // New
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import GenericLoginPage from './pages/auth/GenericLoginPage';
import GenericRegisterPage from './pages/auth/GenericRegisterPage';

import AdminLayout from './components/layout/AdminLayout';

// Common Pages for Authenticated Users
import ProfilePage from './pages/common/ProfilePage';
import MyTimetablePage from './pages/common/MyTimetablePage';
import ViewAttendancePage from './pages/common/ViewAttendancePage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/common/NotificationsPage';
import CallHistoryPage from './pages/common/CallHistoryPage';
import ActiveCallPage from './pages/common/ActiveCallPage';


// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import HistoryPage from './pages/admin/HistoryPage';
import StudentManagementPage from './pages/admin/StudentManagementPage';
import ClassManagementPage from './pages/admin/ClassManagementPage';
import ExamsPage from './pages/admin/ExamsPage';
import AttendancePage from './pages/admin/AttendancePage';
import TimetablePage from './pages/admin/TimetablePage';
import SyllabusPage from './pages/admin/SyllabusPage';
import LibraryPage from './pages/admin/LibraryPage';
import InventoryPage from './pages/admin/InventoryPage';
import FinancePage from './pages/admin/FinancePage';
import ExpensesPage from './pages/admin/ExpensesPage';
import PayrollPage from './pages/admin/PayrollPage';
import LeaveManagementPage from './pages/admin/LeaveManagementPage';
import TrainingPage from './pages/admin/TrainingPage';
import NoticeBoardPage from './pages/admin/NoticeBoardPage';
import EventsPage from './pages/admin/EventsPage';
import TransportPage from './pages/admin/TransportPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminAcademicYearSettingsPage from './pages/admin/AdminAcademicYearSettingsPage';
import MeetingAttendanceReportPage from './pages/admin/MeetingAttendanceReportPage';
import StudentReportBuilderPage from './pages/admin/StudentReportBuilderPage';
import ActivitiesManagementPage from './pages/admin/ActivitiesManagementPage'; // New

// Dashboards for other roles
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';
import ParentDashboardPage from './pages/parent/ParentDashboardPage';
import BursarDashboardPage from './pages/bursar/BursarDashboardPage';
import LibrarianDashboardPage from './pages/librarian/LibrarianDashboardPage';
import HeadTeacherDashboardPage from './pages/headteacher/HeadTeacherDashboardPage';
import DisciplinarianDashboardPage from './pages/disciplinarian/DisciplinarianDashboardPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
// Doctor Role Pages
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';
import DoctorStudentWellnessLogPage from './pages/doctor/DoctorStudentWellnessLogPage';


// Student Specific Pages
import StudentAwardsPage from './pages/student/StudentAwardsPage';
import StudentGradesPage from './pages/student/StudentGradesPage';
import StudentAvailableExamsPage from './pages/student/StudentAvailableExamsPage';
import StudentTakeExamPage from './pages/student/StudentTakeExamPage';
import StudentForumPage from './pages/student/StudentForumPage';
import DigitalLibraryPage from './pages/student/DigitalLibraryPage';
import StudentBookRequestPage from './pages/student/StudentBookRequestPage';
import StudentCourseEnrollmentPage from './pages/student/StudentCourseEnrollmentPage';
import LeaderboardPage from './pages/student/LeaderboardPage';
import HomeworkHelperPage from './pages/student/HomeworkHelperPage'; // New
import StudentActivitiesPage from './pages/student/StudentActivitiesPage'; // New

// Teacher Specific Pages
import TeacherResourcesPage from './pages/teacher/TeacherResourcesPage';
import TeacherMeetingsPage from './pages/teacher/TeacherMeetingsPage';
import TeacherCommentsPage from './pages/teacher/TeacherCommentsPage';
import TeacherLeavePage from './pages/teacher/TeacherLeavePage';
import TeacherGradebookPage from './pages/teacher/TeacherGradebookPage';
import LessonPlannerPage from './pages/teacher/LessonPlannerPage'; // New


// Parent Specific Pages
import ParentMeetingsPage from './pages/parent/ParentMeetingsPage';
import ParentChildDisciplinePage from './pages/parent/ParentChildDisciplinePage';
import ParentActivitiesPage from './pages/parent/ParentActivitiesPage'; // New


// Bursar Specific Pages
import { BursarStudentFeesPage } from './pages/bursar/BursarStudentFeesPage'; // Updated to named import
import BursarFeeCategoriesPage from './pages/bursar/BursarFeeCategoriesPage';
import BursarFeeStructuresPage from './pages/bursar/BursarFeeStructuresPage';

// Head Teacher Specific Pages
import HeadTeacherStaffPage from './pages/headteacher/HeadTeacherStaffPage';
import HeadTeacherCommunicationPage from './pages/headteacher/HeadTeacherCommunicationPage';


// Disciplinarian Specific Pages
import DisciplinarianRulesPage from './pages/disciplinarian/DisciplinarianRulesPage';
import DisciplinarianIncidentsPage from './pages/disciplinarian/DisciplinarianIncidentsPage';

// Librarian Specific Pages
import LibrarianBookRequestsPage from './pages/librarian/LibrarianBookRequestsPage';
import LibrarianFineManagementPage from './pages/librarian/LibrarianFineManagementPage';

import { UserRole, CallLog, Notification as AppNotification, ToastType } from './types';
import { useCallManager } from './hooks/useCallManager';
import { useToast } from './hooks/useToast';


const App: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation(); 
  const { setIncomingCall } = useCallManager();
  const { addToast } = useToast();

  useEffect(() => {
    if (user && !(window as any).socket) {
      const wsUrl = `ws://${window.location.hostname}:3001?userId=${user.id}`;
      const socket = new WebSocket(wsUrl);
      (window as any).socket = socket;

      socket.onopen = () => console.log('App: Global WebSocket Connected');
      
      socket.onclose = () => {
        console.log('App: Global WebSocket Disconnected');
        if ((window as any).socket === socket) {
            (window as any).socket = null;
        }
      };
      socket.onerror = (error) => console.error('App: Global WebSocket Error:', error);

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          console.log("App: Global WebSocket message received: ", message);
          
          if (message.type === 'call-initiate-signal' && message.payload) { 
            setIncomingCall(message.payload as CallLog);
          } else if (message.type === 'new-notification' && message.payload) {
            const notificationPayload = message.payload as AppNotification;
            let toastTypeForNotification: ToastType = 'info';
            if (notificationPayload.type && ['success', 'error', 'info', 'warning'].includes(notificationPayload.type)) {
                toastTypeForNotification = notificationPayload.type as ToastType;
            }
            addToast({
                type: toastTypeForNotification,
                message: notificationPayload.message,
                duration: 7000
            });
          }
        } catch (e) {
          console.error('App: Error processing global WebSocket message:', e);
        }
      };
    } else if (!user && (window as any).socket) {
      (window as any).socket.close();
      (window as any).socket = null;
      console.log('App: Global WebSocket Closed on logout.');
    }
    // No return function needed for cleanup here, as socket cleanup is handled by the conditions.
    // This empty return is to satisfy React's useEffect cleanup signature.
    return () => {}; 
  }, [user, setIncomingCall, addToast]);


  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  const publicPaths = [
    '/', // Landing Page
    '/select-role', // New role selection page
    '/login/admin',
    `/login/${UserRole.STUDENT.toLowerCase()}`,
    `/login/${UserRole.TEACHER.toLowerCase()}`,
    `/login/${UserRole.PARENT.toLowerCase()}`,
    `/login/${UserRole.BURSAR.toLowerCase()}`,
    `/login/${UserRole.ACCOUNTANT.toLowerCase()}`,
    `/login/${UserRole.LIBRARIAN.toLowerCase()}`,
    `/login/${UserRole.HEAD_TEACHER.toLowerCase().replace(' ', '')}`,
    `/login/${UserRole.DISCIPLINARIAN.toLowerCase()}`,
    `/login/${UserRole.STAFF.toLowerCase()}`,
    `/login/${UserRole.DOCTOR.toLowerCase()}`,
    `/register/${UserRole.STUDENT.toLowerCase()}`,
    `/register/${UserRole.PARENT.toLowerCase()}`,
  ];
  
  if (!user && !publicPaths.includes(location.pathname)) {
    const isDisallowedRegisterPath = /^\/register\/(?!student|parent)[a-zA-Z0-9_-]+$/.test(location.pathname);
    const isDisallowedLoginPath = /^\/login\/(?!admin|student|teacher|parent|bursar|accountant|librarian|headteacher|disciplinarian|staff|doctor)[a-zA-Z0-9_-]+$/.test(location.pathname);
    
    const isNotGenericAuthPath = !(/^\/(login|register)\/[a-zA-Z0-9_-]+$/.test(location.pathname));
    const isNotRootPath = !['/', '/select-role'].includes(location.pathname); // Updated to include select-role

    // Refactored conditional for clarity
    const isAuthPathIssue = isDisallowedRegisterPath || isDisallowedLoginPath;
    const isNonAuthPathIssue = isNotRootPath && isNotGenericAuthPath;

    if ( isAuthPathIssue || isNonAuthPathIssue ) {
        return <Navigate to="/" replace />;
    }
  }

  if (user && (location.pathname === '/' || location.pathname === '/select-role' || /^\/(login|register)\/[a-zA-Z0-9_-]+$/.test(location.pathname) || location.pathname === '/login/admin')) {
    let dashboardPath = '/';
    switch (user.role) {
      case UserRole.ADMIN: dashboardPath = '/admin/dashboard'; break;
      case UserRole.TEACHER: dashboardPath = '/teacher/dashboard'; break;
      case UserRole.STUDENT: dashboardPath = '/student/dashboard'; break;
      case UserRole.PARENT: dashboardPath = '/parent/dashboard'; break;
      case UserRole.LIBRARIAN: dashboardPath = '/librarian/dashboard'; break;
      case UserRole.BURSAR:
      case UserRole.ACCOUNTANT: dashboardPath = '/bursar/dashboard'; break;
      case UserRole.HEAD_TEACHER: dashboardPath = '/headteacher/dashboard'; break;
      case UserRole.DISCIPLINARIAN: dashboardPath = '/disciplinarian/dashboard'; break;
      case UserRole.STAFF: dashboardPath = '/staff/dashboard'; break;
      case UserRole.DOCTOR: dashboardPath = '/doctor/dashboard'; break;
      default: dashboardPath = '/';
    }
    return <Navigate to={dashboardPath} replace />;
  }


  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/select-role" element={<RoleSelectionPage />} />
      <Route path="/login/admin" element={<AdminLoginPage />} />
      
      <Route path="/login/:role" element={<GenericLoginPage />} />
      <Route path="/register/:role" element={<GenericRegisterPage />} />

      {/* Authenticated Routes Layout */}
      <Route element={<AdminLayout />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} /> {/* For viewing other profiles */}
        <Route path="/my-timetable" element={<MyTimetablePage />} />
        <Route path="/my-attendance" element={<ViewAttendancePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/call-history" element={<CallHistoryPage />} />
        <Route path="/active-call/:callId" element={<ActiveCallPage />} />

        {/* Admin Routes */}
        {user?.role === UserRole.ADMIN && (
          <Route path="/admin">
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="students" element={<StudentManagementPage />} />
            <Route path="classes" element={<ClassManagementPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="activities" element={<ActivitiesManagementPage />} /> {/* New */}
            <Route path="academics">
                <Route path="exams" element={<ExamsPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="timetable" element={<TimetablePage />} />
                <Route path="syllabus" element={<SyllabusPage />} />
                <Route path="year-settings" element={<AdminAcademicYearSettingsPage />} />
            </Route>
            <Route path="resources">
                 <Route path="library" element={<LibraryPage />} />
                 <Route path="inventory" element={<InventoryPage />} />
                 {/* Teacher Resources also accessible by Admin via Sidebar link */}
            </Route>
            <Route path="finance">
                <Route index element={<FinancePage />} />
                <Route path="student-fees" element={<BursarStudentFeesPage />} />
                <Route path="student-fees/:studentId" element={<BursarStudentFeesPage />} />
                <Route path="fee-categories" element={<BursarFeeCategoriesPage />} />
                <Route path="fee-structures" element={<BursarFeeStructuresPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="payroll" element={<PayrollPage />} />
            </Route>
            <Route path="hr">
                <Route path="leave" element={<LeaveManagementPage />} />
                <Route path="training" element={<TrainingPage />} />
            </Route>
            <Route path="communication">
                <Route path="notices" element={<NoticeBoardPage />} />
                <Route path="events" element={<EventsPage />} />
                {/* Message sending typically part of HeadTeacher role or Chat */}
            </Route>
             <Route path="discipline">
                <Route path="rules" element={<DisciplinarianRulesPage />} />
                <Route path="incidents" element={<DisciplinarianIncidentsPage />} />
            </Route>
            <Route path="transport" element={<TransportPage />} />
             <Route path="reports">
                <Route path="student" element={<StudentReportBuilderPage />} />
                <Route path="meeting-attendance" element={<MeetingAttendanceReportPage />} />
            </Route>
          </Route>
        )}

        {/* Teacher Routes (includes Head Teacher for these) */}
        {(user?.role === UserRole.TEACHER || user?.role === UserRole.HEAD_TEACHER) && (
          <Route path="/teacher">
            <Route path="dashboard" element={<TeacherDashboardPage />} />
            <Route path="gradebook" element={<TeacherGradebookPage />} />
            <Route path="exams" element={<ExamsPage />} /> {/* Admin exam page used by teachers for their context */}
            <Route path="resources" element={<TeacherResourcesPage />} />
            <Route path="lesson-planner" element={<LessonPlannerPage />} /> {/* New */}
            <Route path="attendance" element={<AttendancePage />} /> {/* Admin attendance page used by teachers */}
            <Route path="meetings" element={<TeacherMeetingsPage />} />
            <Route path="comments" element={<TeacherCommentsPage />} />
            <Route path="my-leave" element={<TeacherLeavePage />} />
          </Route>
        )}
        
        {/* Student Routes */}
        {user?.role === UserRole.STUDENT && (
          <Route path="/student">
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="homework-helper" element={<HomeworkHelperPage />} /> {/* New */}
            <Route path="activities" element={<StudentActivitiesPage />} /> {/* New */}
            <Route path="awards" element={<StudentAwardsPage />} />
            <Route path="grades" element={<StudentGradesPage />} />
            <Route path="exams" element={<StudentAvailableExamsPage />} />
            <Route path="exams/:examId/take" element={<StudentTakeExamPage />} />
            <Route path="forum" element={<StudentForumPage />} />
            <Route path="library" element={<DigitalLibraryPage />} />
            <Route path="book-requests" element={<StudentBookRequestPage />} />
            <Route path="courses" element={<StudentCourseEnrollmentPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
          </Route>
        )}
        
        {/* Parent Routes */}
        {user?.role === UserRole.PARENT && (
          <Route path="/parent">
            <Route path="dashboard" element={<ParentDashboardPage />} />
            <Route path="grades" element={<StudentGradesPage />} /> {/* Re-uses student's grade view, adapted by context */}
            <Route path="discipline" element={<ParentChildDisciplinePage />} />
            <Route path="meetings" element={<ParentMeetingsPage />} />
            <Route path="activities" element={<ParentActivitiesPage />} /> {/* New */}
            {/* MyTimetable & MyAttendance are common */}
          </Route>
        )}

        {/* Librarian Routes */}
        {user?.role === UserRole.LIBRARIAN && (
          <Route path="/librarian">
            <Route path="dashboard" element={<LibrarianDashboardPage />} />
            <Route path="books" element={<LibraryPage />} /> {/* Admin's library page for managing books */}
            <Route path="book-requests" element={<LibrarianBookRequestsPage />} />
            <Route path="fines" element={<LibrarianFineManagementPage />} />
          </Route>
        )}
        
        {/* Bursar/Accountant Routes */}
        {(user?.role === UserRole.BURSAR || user?.role === UserRole.ACCOUNTANT) && (
          <Route path="/bursar">
            <Route path="dashboard" element={<BursarDashboardPage />} />
            <Route path="student-fees" element={<BursarStudentFeesPage />} />
            <Route path="student-fees/:studentId" element={<BursarStudentFeesPage />} /> {/* For deep linking */}
            <Route path="fee-categories" element={<BursarFeeCategoriesPage />} />
            <Route path="fee-structures" element={<BursarFeeStructuresPage />} />
            <Route path="expenses" element={<ExpensesPage />} /> {/* Admin's expenses page */}
          </Route>
        )}
        
        {/* Head Teacher Specific Routes (if not covered by admin/teacher) */}
        {user?.role === UserRole.HEAD_TEACHER && (
            <Route path="/headteacher">
                {/* Dashboard is already common with teacher */}
                <Route path="staff" element={<HeadTeacherStaffPage />} />
                <Route path="communication" element={<HeadTeacherCommunicationPage />} />
                <Route path="users" element={<UserManagementPage />} /> {/* Access to user management */}
            </Route>
        )}

        {/* Disciplinarian Routes */}
        {user?.role === UserRole.DISCIPLINARIAN && (
            <Route path="/disciplinarian">
                <Route path="dashboard" element={<DisciplinarianDashboardPage />} />
                <Route path="rules" element={<DisciplinarianRulesPage />} />
                <Route path="incidents" element={<DisciplinarianIncidentsPage />} />
            </Route>
        )}

         {/* Staff Routes */}
        {user?.role === UserRole.STAFF && (
            <Route path="/staff">
                <Route path="dashboard" element={<StaffDashboardPage />} />
                 {/* MyLeave is covered by TeacherLeavePage, MyTimetable common */}
            </Route>
        )}
         {/* Doctor Routes */}
        {user?.role === UserRole.DOCTOR && (
            <Route path="/doctor">
                <Route path="dashboard" element={<DoctorDashboardPage />} />
                <Route path="wellness-logs" element={<DoctorStudentWellnessLogPage />} />
                <Route path="wellness-logs/:studentId" element={<DoctorStudentWellnessLogPage />} />
            </Route>
        )}

      </Route>
      {/* Catch-all for authenticated users if no specific route matches, redirect to their dashboard */}
      {/* This needs to be more specific if we have many sub-routes or a default landing page */}
      {/* {user && <Route path="*" element={<Navigate to={userDashboardPath(user)} replace />} />} */}
      
    </Routes>
  );
};

export default App;
