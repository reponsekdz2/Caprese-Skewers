
import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom'; // Changed import
import {
  HomeIcon, UsersIcon, HistoryIcon, StudentIcon, ClassIcon,
  FinanceIcon, LibraryIcon, InventoryIcon,
  AttendanceIcon, ExamsIcon, TimetableIcon, SyllabusIcon, PayrollIcon,
  LeaveIcon, TrainingIcon, NoticeIcon, EventsIcon,
  TransportIcon, SettingsIcon, AcademicsIcon, ReportIcon, ChevronDownIcon,
  TeacherIcon, ParentIcon, BursarIcon, HeadTeacherIcon, DisciplinarianIcon, AdminIcon, AwardIcon,
  UsersIcon as MeetingIcon,
  UsersIcon as StaffIcon, // Already aliased for consistency if needed
  UsersIcon as ForumIcon, // Already aliased for consistency if needed
  ReportIcon as DisciplineRulesIcon, // Already aliased
  BellIcon as CommunicationIcon, // Already aliased
  ChatBubbleIcon,
  PlusIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  LeaderboardIcon,
  BellIcon,
  PhoneIcon as CallHistoryIcon, // New
  ClipboardCheckIcon, // New
  SparklesIcon, // For AI features
  BrainCircuitIcon, // For AI features
  ActivityIcon, // For Extracurricular Activities
} from '../../assets/icons';
import { NavItem, UserRole } from '../../types';
import { APP_NAME } from '../../constants';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const allNavItems: NavItem[] = [
  // Common Links for Authenticated Users
  { name: 'My Profile', path: '/profile', icon: UsersIcon, roles: Object.values(UserRole) },
  { name: 'Chat', path: '/chat', icon: ChatBubbleIcon, roles: Object.values(UserRole) },
  { name: 'Notifications', path: '/notifications', icon: BellIcon, roles: Object.values(UserRole) },
  { name: 'Call History', path: '/call-history', icon: CallHistoryIcon, roles: Object.values(UserRole) }, 


  // Admin Specific
  { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon, roles: [UserRole.ADMIN] },
  { name: 'User Management', path: '/admin/users', icon: UsersIcon, roles: [UserRole.ADMIN] },
  { name: 'Student Management', path: '/admin/students', icon: StudentIcon, roles: [UserRole.ADMIN] },
  { name: 'Class Management', path: '/admin/classes', icon: ClassIcon, roles: [UserRole.ADMIN] },
  { name: 'Activities', path: '/admin/activities', icon: ActivityIcon, roles: [UserRole.ADMIN] }, // New
  {
    name: 'Academics Admin', path: '/admin/academics', icon: AcademicsIcon, roles: [UserRole.ADMIN], subItems: [
      { name: 'Exams & Marks', path: '/admin/academics/exams', icon: ExamsIcon, roles: [UserRole.ADMIN] },
      { name: 'Record Attendance', path: '/admin/academics/attendance', icon: AttendanceIcon, roles: [UserRole.ADMIN] },
      { name: 'Manage Timetable', path: '/admin/academics/timetable', icon: TimetableIcon, roles: [UserRole.ADMIN] },
      { name: 'Syllabus', path: '/admin/academics/syllabus', icon: SyllabusIcon, roles: [UserRole.ADMIN] },
      { name: 'Academic Year', path: '/admin/academics/year-settings', icon: CalendarDaysIcon, roles: [UserRole.ADMIN] },
    ]
  },
  {
    name: 'Resources Admin', path: '/admin/resources', icon: LibraryIcon, roles: [UserRole.ADMIN], subItems: [
      { name: 'Library', path: '/admin/library', icon: LibraryIcon, roles: [UserRole.ADMIN] },
      { name: 'Inventory', path: '/admin/inventory', icon: InventoryIcon, roles: [UserRole.ADMIN] },
      { name: 'Teacher Resources', path: '/teacher/resources', icon: SyllabusIcon, roles: [UserRole.ADMIN] }, 
    ]
  },
  {
    name: 'Finance Admin', path: '/admin/finance', icon: FinanceIcon, roles: [UserRole.ADMIN], subItems: [
      { name: 'Fee Summary', path: '/admin/finance/fees', icon: FinanceIcon, roles: [UserRole.ADMIN] }, 
      { name: 'Student Fee Details', path: '/admin/finance/student-fees', icon: UsersIcon, roles: [UserRole.ADMIN] },
      { name: 'Fee Categories', path: '/admin/finance/fee-categories', icon: FinanceIcon, roles: [UserRole.ADMIN] },
      { name: 'Fee Structures', path: '/admin/finance/fee-structures', icon: FinanceIcon, roles: [UserRole.ADMIN] },
      { name: 'Expenses', path: '/admin/finance/expenses', icon: ReportIcon, roles: [UserRole.ADMIN] },
      { name: 'Payroll', path: '/admin/finance/payroll', icon: PayrollIcon, roles: [UserRole.ADMIN] },
    ]
  },
  {
    name: 'HR Admin', path: '/admin/hr', icon: UsersIcon, roles: [UserRole.ADMIN], subItems: [
      { name: 'Staff Leave', path: '/admin/hr/leave', icon: LeaveIcon, roles: [UserRole.ADMIN] },
      { name: 'Staff Training', path: '/admin/hr/training', icon: TrainingIcon, roles: [UserRole.ADMIN] },
    ]
  },
  {
    name: 'Communication Admin', path: '/admin/communication', icon: NoticeIcon, roles: [UserRole.ADMIN], subItems: [
      { name: 'Notice Board', path: '/admin/communication/notices', icon: NoticeIcon, roles: [UserRole.ADMIN] },
      { name: 'Events Management', path: '/admin/communication/events', icon: EventsIcon, roles: [UserRole.ADMIN] },
      { name: 'Send Messages', path: '/admin/communication/messages', icon: CommunicationIcon, roles: [UserRole.ADMIN] }, 
    ]
  },
  {
    name: 'Discipline Admin', path: '/admin/discipline', icon: DisciplinarianIcon, roles: [UserRole.ADMIN], subItems: [
        { name: 'Discipline Rules', path: '/admin/discipline/rules', icon: DisciplineRulesIcon, roles: [UserRole.ADMIN] },
        { name: 'Incident Logs', path: '/admin/discipline/incidents', icon: ReportIcon, roles: [UserRole.ADMIN] },
    ]
  },
   {
    name: 'Reports Admin', path: '/admin/reports', icon: ReportIcon, roles: [UserRole.ADMIN, UserRole.HEAD_TEACHER], subItems: [
      { name: 'Student Reports', path: '/admin/reports/student', icon: ReportIcon, roles: [UserRole.ADMIN, UserRole.HEAD_TEACHER] },
      { name: 'Meeting Attendance', path: '/admin/reports/meeting-attendance', icon: ClipboardCheckIcon, roles: [UserRole.ADMIN, UserRole.HEAD_TEACHER] }, 
    ]
  },
  { name: 'Transport Admin', path: '/admin/transport', icon: TransportIcon, roles: [UserRole.ADMIN] },
  { name: 'Activity History', path: '/admin/history', icon: HistoryIcon, roles: [UserRole.ADMIN] },
  { name: 'Settings', path: '/admin/settings', icon: SettingsIcon, roles: [UserRole.ADMIN] },

  // Teacher Specific
  { name: 'Dashboard', path: '/teacher/dashboard', icon: HomeIcon, roles: [UserRole.TEACHER, UserRole.HEAD_TEACHER] },
  { name: 'My Gradebook', path: '/teacher/gradebook', icon: ReportIcon, roles: [UserRole.TEACHER, UserRole.HEAD_TEACHER] },
  { name: 'Exams & Grading', path: '/teacher/exams', icon: ExamsIcon, roles: [UserRole.TEACHER, UserRole.HEAD_TEACHER] },
  { name: 'My Resources', path: '/teacher/resources', icon: SyllabusIcon, roles: [UserRole.TEACHER, UserRole.HEAD_TEACHER] },
  { name: 'AI Lesson Planner', path: '/teacher/lesson-planner', icon: SparklesIcon, roles: [UserRole.TEACHER, UserRole.HEAD_TEACHER] }, // New
  { name: 'Record Attendance', path: '/teacher/attendance', icon: AttendanceIcon, roles: [UserRole.TEACHER, UserRole.HEAD_TEACHER] },
  { name: 'My Timetable', path: '/my-timetable', icon: TimetableIcon, roles: [UserRole.TEACHER, UserRole.HEAD_TEACHER, UserRole.STUDENT, UserRole.PARENT, UserRole.STAFF] },
  { name: 'Meeting Requests', path: '/teacher/meetings', icon: MeetingIcon, roles: [UserRole.TEACHER, UserRole.HEAD_TEACHER] },
  { name: 'Add Student Comments', path: '/teacher/comments', icon: ReportIcon, roles: [UserRole.TEACHER, UserRole.HEAD_TEACHER] },
  { name: 'My Leave', path: '/teacher/my-leave', icon: LeaveIcon, roles: [UserRole.TEACHER, UserRole.HEAD_TEACHER] },
  
  // Student Specific
  { name: 'Dashboard', path: '/student/dashboard', icon: HomeIcon, roles: [UserRole.STUDENT] },
  { name: 'AI Homework Helper', path: '/student/homework-helper', icon: BrainCircuitIcon, roles: [UserRole.STUDENT] }, // New
  { name: 'Extracurriculars', path: '/student/activities', icon: ActivityIcon, roles: [UserRole.STUDENT] }, // New
  { name: 'Course Enrollment', path: '/student/courses', icon: BookOpenIcon, roles: [UserRole.STUDENT] },
  { name: 'Online Exams', path: '/student/exams', icon: ExamsIcon, roles: [UserRole.STUDENT] },
  { name: 'Grades', path: '/student/grades', icon: ReportIcon, roles: [UserRole.STUDENT] },
  { name: 'My Awards', path: '/student/awards', icon: AwardIcon, roles: [UserRole.STUDENT] },
  { name: 'Leaderboard', path: '/student/leaderboard', icon: LeaderboardIcon, roles: [UserRole.STUDENT] },
  { name: 'Student Forum', path: '/student/forum', icon: ForumIcon, roles: [UserRole.STUDENT] },
  { name: 'Digital Library', path: '/student/library', icon: LibraryIcon, roles: [UserRole.STUDENT] },
  { name: 'Book Requests', path: '/student/book-requests', icon: PlusIcon, roles: [UserRole.STUDENT] },
  { name: 'My Attendance', path: '/my-attendance', icon: AttendanceIcon, roles: [UserRole.STUDENT, UserRole.PARENT] },

  // Parent Specific
  { name: 'Dashboard', path: '/parent/dashboard', icon: HomeIcon, roles: [UserRole.PARENT] },
  { name: 'Child Grades', path: '/parent/grades', icon: ReportIcon, roles: [UserRole.PARENT] },
  { name: 'Child Discipline', path: '/parent/discipline', icon: DisciplineRulesIcon, roles: [UserRole.PARENT] },
  { name: 'Teacher Meetings', path: '/parent/meetings', icon: MeetingIcon, roles: [UserRole.PARENT] },
  { name: 'School Activities', path: '/parent/activities', icon: ActivityIcon, roles: [UserRole.PARENT] }, // New

  // Librarian Specific
  { name: 'Dashboard', path: '/librarian/dashboard', icon: HomeIcon, roles: [UserRole.LIBRARIAN] },
  { name: 'Manage Books', path: '/librarian/books', icon: LibraryIcon, roles: [UserRole.LIBRARIAN] },
  { name: 'Book Requests', path: '/librarian/book-requests', icon: PlusIcon, roles: [UserRole.LIBRARIAN] },
  { name: 'Manage Fines', path: '/librarian/fines', icon: FinanceIcon, roles: [UserRole.LIBRARIAN] },
  
  // Bursar Specific
  { name: 'Dashboard', path: '/bursar/dashboard', icon: HomeIcon, roles: [UserRole.BURSAR, UserRole.ACCOUNTANT] },
  { name: 'Student Fees', path: '/bursar/student-fees', icon: FinanceIcon, roles: [UserRole.BURSAR, UserRole.ACCOUNTANT] },
  { name: 'Fee Categories', path: '/bursar/fee-categories', icon: FinanceIcon, roles: [UserRole.BURSAR, UserRole.ACCOUNTANT] },
  { name: 'Fee Structures', path: '/bursar/fee-structures', icon: FinanceIcon, roles: [UserRole.BURSAR, UserRole.ACCOUNTANT] },
  
  // Head Teacher (Specific to Head Teacher if not covered by Teacher or Admin)
   { name: 'Staff Management', path: '/headteacher/staff', icon: StaffIcon, roles: [UserRole.HEAD_TEACHER] },
   { name: 'User Accounts (View)', path: '/headteacher/users', icon: UsersIcon, roles: [UserRole.HEAD_TEACHER] }, // Can view users, admin edits
   { name: 'School Communication', path: '/headteacher/communication', icon: CommunicationIcon, roles: [UserRole.HEAD_TEACHER] },

  // Disciplinarian
  { name: 'Dashboard', path: '/disciplinarian/dashboard', icon: HomeIcon, roles: [UserRole.DISCIPLINARIAN] },
  { name: 'Discipline Rules', path: '/disciplinarian/rules', icon: DisciplineRulesIcon, roles: [UserRole.DISCIPLINARIAN] },
  { name: 'Incident Reports', path: '/disciplinarian/incidents', icon: ReportIcon, roles: [UserRole.DISCIPLINARIAN] },

  // General Staff
  { name: 'Dashboard', path: '/staff/dashboard', icon: HomeIcon, roles: [UserRole.STAFF] },
  // Other staff specific links can be added here
];


const SidebarNavLink: React.FC<{ item: NavItem; toggleSidebar: () => void; userRole: UserRole | null }> = ({ item, toggleSidebar, userRole }) => {
  if (item.roles && userRole && !item.roles.includes(userRole)) {
    return null;
  }

  // Construct the path, considering user role if necessary (though most paths are absolute)
  let path = item.path;
  // Example: if (userRole === UserRole.TEACHER && item.path === '/dashboard') path = '/teacher/dashboard';
  // This logic is largely handled by having separate dashboard paths per role in allNavItems
  
  return (
    <NavLink // Changed usage
      to={path}
      onClick={() => { if (window.innerWidth < 1024 && !item.subItems) toggleSidebar() }}
      className={({ isActive }) =>
        `flex items-center p-3 rounded-lg hover:bg-secondary-700 dark:hover:bg-dark-secondary hover:text-white dark:hover:text-primary-300 transition-colors duration-150 ${
          isActive && !item.subItems ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-lg' : 'text-secondary-300 dark:text-secondary-400 hover:text-white dark:hover:text-primary-200'
        }`
      }
    >
      <item.icon className="w-6 h-6 mr-3 flex-shrink-0" />
      {item.name}
    </NavLink> // Changed usage
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleSubmenuToggle = (itemName: string) => {
    setOpenSubmenu(openSubmenu === itemName ? null : itemName);
  };

  const visibleNavItems = user?.role
    ? allNavItems.filter(item =>
        !item.roles || // Item has no specific roles (common to all authenticated)
        item.roles.includes(user.role) || // Item includes the current user's role
        // Special case for Head Teacher: can access Teacher routes
        (user.role === UserRole.HEAD_TEACHER && item.roles?.includes(UserRole.TEACHER)) ||
        // Admin can access almost anything (or define this more granularly if needed)
        (user.role === UserRole.ADMIN) 
    )
    : [];

  const getRoleSpecificAppName = () => {
    if (!user) return APP_NAME;
    switch (user.role) {
      case UserRole.ADMIN: return "Admin Portal";
      case UserRole.TEACHER: return "Teacher's Hub";
      case UserRole.STUDENT: return "Student Portal";
      case UserRole.PARENT: return "Parent's Corner";
      case UserRole.LIBRARIAN: return "Library System";
      case UserRole.BURSAR:
      case UserRole.ACCOUNTANT:
         return "Finance Office";
      case UserRole.HEAD_TEACHER: return "Head Teacher's Office";
      case UserRole.DISCIPLINARIAN: return "Dean's Office";
      case UserRole.STAFF: return "Staff Portal";
      default: return APP_NAME;
    }
  };


  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-secondary-800 dark:bg-dark-card text-white transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:flex-col shadow-lg`}
      >
        <div className="flex items-center justify-between p-4 h-16 border-b border-secondary-700 dark:border-dark-border">
          <Link to="/" className="text-xl font-bold text-white"> {/* Changed usage */}
            {getRoleSpecificAppName()}
          </Link> {/* Changed usage */}
          <button onClick={toggleSidebar} className="lg:hidden text-secondary-300 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-grow p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-700 scrollbar-track-secondary-800">
          {visibleNavItems.map((item) => (
             item.subItems ? (
              <div key={item.name}>
                <button
                  onClick={() => handleSubmenuToggle(item.name)}
                  className="w-full flex items-center justify-between p-3 rounded-lg text-secondary-300 dark:text-secondary-400 hover:bg-secondary-700 dark:hover:bg-dark-secondary hover:text-white dark:hover:text-primary-300 transition-colors duration-150"
                >
                  <div className="flex items-center">
                    <item.icon className="w-6 h-6 mr-3 flex-shrink-0" />
                    {item.name}
                  </div>
                  <ChevronDownIcon className={`w-5 h-5 transition-transform ${openSubmenu === item.name ? 'rotate-180' : ''}`} />
                </button>
                {openSubmenu === item.name && (
                  <div className="pl-7 mt-1 space-y-1">
                    {item.subItems.map(subItem => (
                        // Ensure sub-item roles are also checked
                        (!subItem.roles || (user?.role && subItem.roles.includes(user.role)) || user?.role === UserRole.ADMIN || (user?.role === UserRole.HEAD_TEACHER && subItem.roles?.includes(UserRole.TEACHER)) ) ? (
                            <SidebarNavLink key={subItem.name} item={subItem} toggleSidebar={toggleSidebar} userRole={user.role} />
                        ) : null
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <SidebarNavLink key={item.name} item={item} toggleSidebar={toggleSidebar} userRole={user.role} />
            )
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
