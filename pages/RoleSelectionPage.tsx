
import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Changed import
import { APP_NAME } from '../constants';
import { UserRole, RoleCardData } from '../types';
import {
    StudentIcon, TeacherIcon, ParentIcon, LibraryIcon, BursarIcon,
    HeadTeacherIcon, DisciplinarianIcon, AdminIcon, ArrowRightIcon,
    DoctorIcon, StaffIcon
} from '../assets/icons'; // Ensured relative path
import Button from '../components/common/Button';

const RoleCard: React.FC<{ roleData: RoleCardData, index: number }> = ({ roleData, index }) => {
    const navigate = useNavigate(); // Changed usage
    return (
        <div
            className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-primary-400/30 dark:hover:shadow-primary-500/20 transition-all duration-300 transform hover:-translate-y-1 p-6 sm:p-8 flex flex-col items-center text-center border-2 border-transparent hover:border-primary-300 dark:hover:border-primary-500 group animate-cardEntry"
            role="region"
            aria-labelledby={`role-title-${roleData.role}`}
            style={{ animationDelay: `${index * 100}ms`, opacity: 0 }} // Initial opacity for animation
        >
            <div className={`p-4 rounded-full mb-4 transition-all duration-300 ease-out ${roleData.avatarBgColor || 'bg-blue-100 dark:bg-blue-700'} group-hover:shadow-lg group-hover:scale-105`}>
                <roleData.icon className="w-16 h-16 sm:w-20 sm:h-20 text-primary-600 dark:text-primary-300 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h2 id={`role-title-${roleData.role}`} className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-white mb-2">{roleData.title}</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 flex-grow">{roleData.description}</p>
            <div className="w-full space-y-3">
                <Button
                    variant="primary"
                    className="w-full group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-400 dark:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-600 focus:ring-blue-400"
                    onClick={() => navigate(roleData.loginPath)}
                    rightIcon={<ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"/>}
                >
                    Login
                </Button>
                {(roleData.role === UserRole.STUDENT || roleData.role === UserRole.PARENT) && roleData.registerPath && (
                    <Button
                        variant="secondary"
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 focus:ring-green-400"
                        onClick={() => navigate(roleData.registerPath)}
                    >
                        Register
                    </Button>
                )}
            </div>
        </div>
    );
};

export const RoleSelectionPage: React.FC = () => { // NAMED EXPORT
    const roles: RoleCardData[] = [
        {
            role: UserRole.STUDENT,
            title: "Student Portal",
            description: "Access your courses, assignments, grades, and connect with classmates.",
            icon: StudentIcon,
            loginPath: `/login/${UserRole.STUDENT.toLowerCase()}`,
            registerPath: `/register/${UserRole.STUDENT.toLowerCase()}`,
            avatarBgColor: 'bg-green-100 dark:bg-green-800'
        },
        {
            role: UserRole.TEACHER,
            title: "Teacher's Hub",
            description: "Manage your classes, assignments, grading, and view your timetable.",
            icon: TeacherIcon,
            loginPath: `/login/${UserRole.TEACHER.toLowerCase()}`,
            avatarBgColor: 'bg-blue-100 dark:bg-blue-800'
        },
        {
            role: UserRole.PARENT,
            title: "Parent's Corner",
            description: "View your child's progress, attendance, grades, and school announcements.",
            icon: ParentIcon,
            loginPath: `/login/${UserRole.PARENT.toLowerCase()}`,
            registerPath: `/register/${UserRole.PARENT.toLowerCase()}`,
            avatarBgColor: 'bg-sky-100 dark:bg-sky-800'
        },
        {
            role: UserRole.ADMIN,
            title: "Admin Portal",
            description: "Manage school operations, users, academic settings, and system configurations.",
            icon: AdminIcon,
            loginPath: "/login/admin",
            avatarBgColor: 'bg-slate-200 dark:bg-slate-700'
        },
        {
            role: UserRole.LIBRARIAN,
            title: "Librarian Desk",
            description: "Manage library resources, book transactions, and member accounts.",
            icon: LibraryIcon,
            loginPath: `/login/${UserRole.LIBRARIAN.toLowerCase()}`,
            avatarBgColor: 'bg-teal-100 dark:bg-teal-800'
        },
        {
            role: UserRole.BURSAR,
            title: "Finance Office",
            description: "Oversee fee collections, expense tracking, payroll, and financial reporting.",
            icon: BursarIcon,
            loginPath: `/login/${UserRole.BURSAR.toLowerCase()}`,
            avatarBgColor: 'bg-cyan-100 dark:bg-cyan-800'
        },
        {
            role: UserRole.HEAD_TEACHER,
            title: "Head Teacher",
            description: "Access school oversight tools, staff management, and academic reports.",
            icon: HeadTeacherIcon,
            loginPath: `/login/${UserRole.HEAD_TEACHER.toLowerCase().replace(' ', '')}`,
            avatarBgColor: 'bg-emerald-100 dark:bg-emerald-800'
        },
         {
            role: UserRole.DISCIPLINARIAN,
            title: "Dean's Office",
            description: "Manage student conduct, incident reports, and disciplinary actions.",
            icon: DisciplinarianIcon,
            loginPath: `/login/${UserRole.DISCIPLINARIAN.toLowerCase()}`,
            avatarBgColor: 'bg-indigo-100 dark:bg-indigo-800' 
        },
        {
            role: UserRole.DOCTOR,
            title: "School Doctor",
            description: "Access student wellness logs, manage health records, and issue advisories.",
            icon: DoctorIcon,
            loginPath: `/login/${UserRole.DOCTOR.toLowerCase()}`,
            avatarBgColor: 'bg-pink-100 dark:bg-pink-800'
        },
        {
            role: UserRole.STAFF,
            title: "General Staff",
            description: "Access staff portal for internal communications, leave requests, and resources.",
            icon: StaffIcon,
            loginPath: `/login/${UserRole.STAFF.toLowerCase()}`,
            avatarBgColor: 'bg-gray-200 dark:bg-gray-700'
        },
    ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tl from-sky-500 via-teal-500 to-emerald-500 dark:from-sky-800 dark:via-teal-800 dark:to-emerald-800 p-4 sm:p-6 animate-fadeIn">
      <header className="mb-8 sm:mb-12 text-center animate-slideInUp" style={{ animationDelay: '0ms', opacity: 0 }}>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight shadow-sm">
          Select Your Role
        </h1>
        <p className="text-lg sm:text-xl text-white/90 dark:text-slate-200 max-w-2xl mx-auto">
          Choose your role below to access the appropriate portal.
        </p>
      </header>
      <main className="w-full max-w-screen-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {roles.map((roleData, index) => (
            <RoleCard key={roleData.role} roleData={roleData} index={index} />
          ))}
        </div>
      </main>
       <footer className="mt-10 text-center text-slate-100 dark:text-slate-300 text-xs" style={{ animationDelay: `${roles.length * 100 + 200}ms`, opacity: 0, animation: 'fadeIn 0.5s ease-out forwards' }}>
        <Link to="/" className="text-sm text-white/80 hover:text-white hover:underline">&larr; Back to Welcome Page</Link>
        <p className="mt-2">&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
};
