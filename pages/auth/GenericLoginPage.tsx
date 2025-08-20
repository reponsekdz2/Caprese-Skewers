
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom'; // Changed import
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { APP_NAME } from '../../constants';
import { useToast } from '../../hooks/useToast';
import { UserRole } from '../../types';
import { StudentIcon, TeacherIcon, ParentIcon, LibraryIcon, BursarIcon, HeadTeacherIcon, DisciplinarianIcon, UsersIcon, EmailIcon, PhoneIcon, OtpIcon } from '../../assets/icons';

type LoginMethod = 'email' | 'phone';

const roleDetailsMap: Record<string, { roleEnum: UserRole, Icon: React.ElementType, name: string }> = {
    [UserRole.STUDENT.toLowerCase()]: { roleEnum: UserRole.STUDENT, Icon: StudentIcon, name: 'Student' },
    [UserRole.TEACHER.toLowerCase()]: { roleEnum: UserRole.TEACHER, Icon: TeacherIcon, name: 'Teacher' },
    [UserRole.PARENT.toLowerCase()]: { roleEnum: UserRole.PARENT, Icon: ParentIcon, name: 'Parent' },
    [UserRole.LIBRARIAN.toLowerCase()]: { roleEnum: UserRole.LIBRARIAN, Icon: LibraryIcon, name: 'Librarian' },
    [UserRole.BURSAR.toLowerCase()]: { roleEnum: UserRole.BURSAR, Icon: BursarIcon, name: 'Bursar/Accountant' },
    [UserRole.ACCOUNTANT.toLowerCase()]: { roleEnum: UserRole.ACCOUNTANT, Icon: BursarIcon, name: 'Bursar/Accountant' },
    [UserRole.HEAD_TEACHER.toLowerCase().replace(' ', '')]: { roleEnum: UserRole.HEAD_TEACHER, Icon: HeadTeacherIcon, name: 'Head Teacher' },
    [UserRole.DISCIPLINARIAN.toLowerCase()]: { roleEnum: UserRole.DISCIPLINARIAN, Icon: DisciplinarianIcon, name: 'Disciplinarian' },
};


const GenericLoginPage: React.FC = () => {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);
  const { login, loginWithPhone } = useAuth();
  const navigate = useNavigate(); // Changed usage
  const { addToast } = useToast();
  const { role } = useParams<{ role: string }>(); // Changed usage

  const currentRoleDetails = role ? roleDetailsMap[role.toLowerCase()] : null;
  const RoleIcon = currentRoleDetails ? currentRoleDetails.Icon : UsersIcon;
  const roleName = currentRoleDetails ? currentRoleDetails.name : "User";

  useEffect(() => {
    if (!role || !currentRoleDetails) {
      addToast({ type: 'error', message: 'Invalid user role specified for login.' });
      navigate('/');
    }
  }, [role, navigate, addToast, currentRoleDetails]);

  if (!currentRoleDetails) {
    return <div className="flex items-center justify-center h-screen">Loading or invalid role...</div>;
  }
  
  const handleSendOtp = async () => {
    if (!phone) {
        addToast({ type: 'error', message: 'Please enter your phone number.' });
        return;
    }
    setPageLoading(true);
    // Simulate OTP sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    addToast({ type: 'info', message: `OTP sent to ${phone} (simulated). Use 123456` });
    setPageLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPageLoading(true);
    let success = false;

    if (!currentRoleDetails) {
        addToast({ type: 'error', message: 'Role not correctly identified.' });
        setPageLoading(false);
        return;
    }

    try {
      if (loginMethod === 'email') {
        if (!email || !password) {
            setError('Email and password are required.');
            addToast({ type: 'error', message: 'Email and password are required.' });
            setPageLoading(false);
            return;
        }
        success = await login(email, password, currentRoleDetails.roleEnum);
      } else { // Phone login
        if (!phone || !otp) {
            setError('Phone number and OTP are required.');
            addToast({ type: 'error', message: 'Phone number and OTP are required.' });
            setPageLoading(false);
            return;
        }
        if (loginWithPhone) {
            success = await loginWithPhone(phone, otp, currentRoleDetails.roleEnum);
        } else {
            setError('Phone login is not available at the moment.');
            addToast({type: 'error', message: 'Phone login service unavailable.'});
        }
      }

      if (success) {
        addToast({ type: 'success', message: `${roleName} login successful! Redirecting...` });
        navigate(`/${role}/dashboard`);
      } else {
        setError(`Invalid ${roleName.toLowerCase()} credentials. Please try again.`);
        // Toast is handled by login/loginWithPhone on failure if specific error messages are returned from there.
      }
    } catch (err) {
      console.error(`${roleName} Login page error:`, err);
      setError('An unexpected error occurred. Please try again.');
      addToast({ type: 'error', message: 'Login failed. Please try again.' });
    }
    setPageLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-800 dark:to-secondary-900 p-4">
      <div className="bg-white dark:bg-dark-card p-8 sm:p-12 rounded-xl shadow-2xl w-full max-w-md animate-cardEntry">
         <div className="flex flex-col items-center mb-6">
            <RoleIcon className="w-16 h-16 text-primary-600 dark:text-primary-400 mb-3" />
            <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-300">{APP_NAME}</h1>
            <p className="text-center text-secondary-600 dark:text-secondary-400 mt-1">{roleName} Login</p>
        </div>

        <div className="mb-6 flex border-b border-secondary-300 dark:border-dark-border">
            <button
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-3 text-sm font-medium focus:outline-none transition-colors ${loginMethod === 'email' ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400' : 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'}`}
            >
                <EmailIcon className="w-5 h-5 inline mr-1 mb-0.5" /> Email
            </button>
            <button
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-3 text-sm font-medium focus:outline-none transition-colors ${loginMethod === 'phone' ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400' : 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'}`}
            >
                <PhoneIcon className="w-5 h-5 inline mr-1 mb-0.5" /> Phone
            </button>
        </div>
        
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          {loginMethod === 'email' && (
            <>
              <Input
                label={`${roleName} Email`}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`Enter your ${roleName.toLowerCase()} email`}
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </>
          )}
          {loginMethod === 'phone' && (
            <>
              <Input
                label={`${roleName} Phone Number`}
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                required
                autoComplete="tel"
              />
              <div className="flex items-end gap-2">
                 <Input
                    label="One-Time Password (OTP)"
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    required={loginMethod === 'phone'}
                    containerClassName="flex-grow"
                 />
                 <Button type="button" variant="secondary" onClick={handleSendOtp} disabled={pageLoading || !phone} className="mb-4">
                    {pageLoading ? 'Sending...' : 'Send OTP'}
                 </Button>
               </div>
            </>
          )}
          <Button type="submit" variant="primary" size="lg" className="w-full mt-4" disabled={pageLoading}>
            {pageLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div>
            ) : (
              `Login as ${roleName}`
            )}
          </Button>
        </form>
        <p className="mt-4 text-sm text-center">
            Don't have an account?{' '}
            <Link to={`/register/${role}`} className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 hover:underline">
             Register here
            </Link>
        </p>
         <div className="mt-6 text-center">
            <Link to="/select-role" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 hover:underline">
                &larr; Back to Role Selection
            </Link>
        </div>
      </div>
    </div>
  );
};

export default GenericLoginPage;
