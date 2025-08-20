
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom'; // Changed import
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { APP_NAME } from '../../constants';
import { useToast } from '../../hooks/useToast';
import { User, UserRole } from '../../types';
import { StudentIcon, TeacherIcon, ParentIcon, LibraryIcon, BursarIcon, HeadTeacherIcon, DisciplinarianIcon, UsersIcon, EmailIcon, PhoneIcon, OtpIcon } from '../../assets/icons';

type RegisterMethod = 'email' | 'phone';

const roleDetailsMapForRegister: Record<string, { roleEnum: UserRole, Icon: React.ElementType, name: string, additionalFields?: {name: keyof User, label: string, type: string, required?: boolean}[] }> = {
    [UserRole.STUDENT.toLowerCase()]: {
        roleEnum: UserRole.STUDENT, Icon: StudentIcon, name: 'Student'
    },
    [UserRole.TEACHER.toLowerCase()]: { roleEnum: UserRole.TEACHER, Icon: TeacherIcon, name: 'Teacher' },
    [UserRole.PARENT.toLowerCase()]: { roleEnum: UserRole.PARENT, Icon: ParentIcon, name: 'Parent' },
    [UserRole.LIBRARIAN.toLowerCase()]: { roleEnum: UserRole.LIBRARIAN, Icon: LibraryIcon, name: 'Librarian' },
    [UserRole.BURSAR.toLowerCase()]: { roleEnum: UserRole.BURSAR, Icon: BursarIcon, name: 'Bursar/Accountant' },
    [UserRole.ACCOUNTANT.toLowerCase()]: { roleEnum: UserRole.ACCOUNTANT, Icon: BursarIcon, name: 'Bursar/Accountant' },
    [UserRole.HEAD_TEACHER.toLowerCase().replace(' ', '')]: { roleEnum: UserRole.HEAD_TEACHER, Icon: HeadTeacherIcon, name: 'Head Teacher' },
    [UserRole.DISCIPLINARIAN.toLowerCase()]: { roleEnum: UserRole.DISCIPLINARIAN, Icon: DisciplinarianIcon, name: 'Disciplinarian' },
};


const GenericRegisterPage: React.FC = () => {
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>('email');
  const [formData, setFormData] = useState<Partial<User>>({ name: '', email: '', password: '', phone: ''});
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);
  const { register, registerWithPhone } = useAuth();
  const navigate = useNavigate(); // Changed usage
  const { addToast } = useToast();
  const { role } = useParams<{ role: string }>(); // Changed usage

  const currentRoleDetails = role ? roleDetailsMapForRegister[role.toLowerCase()] : null;
  const RoleIcon = currentRoleDetails ? currentRoleDetails.Icon : UsersIcon;
  const roleName = currentRoleDetails ? currentRoleDetails.name : "User";

   useEffect(() => {
    if (!role || !currentRoleDetails) {
      addToast({ type: 'error', message: 'Invalid user role specified for registration.' });
      navigate('/');
    } else {
        setFormData(prev => ({ ...prev, role: currentRoleDetails.roleEnum }));
    }
  }, [role, navigate, addToast, currentRoleDetails]);

  if (!currentRoleDetails) {
    return <div className="flex items-center justify-center h-screen">Loading or invalid role...</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleSendOtp = async () => {
    if (!formData.phone) {
        addToast({ type: 'error', message: 'Please enter your phone number.' });
        return;
    }
    setPageLoading(true);
    // Simulate OTP sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    addToast({ type: 'info', message: `OTP sent to ${formData.phone} (simulated). Use 123456` });
    setPageLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match.');
      addToast({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    if (!formData.name || !formData.password) {
        setError('Name and password are required.');
        addToast({ type: 'error', message: 'Name and password are required.' });
        return;
    }
    if (registerMethod === 'email' && !formData.email) {
        setError('Email is required for email registration.');
        addToast({ type: 'error', message: 'Email is required.' });
        return;
    }
    if (registerMethod === 'phone' && (!formData.phone || !otp)) {
        setError('Phone number and OTP are required for phone registration.');
        addToast({ type: 'error', message: 'Phone number and OTP are required.' });
        return;
    }
    if (currentRoleDetails.additionalFields) {
        for (const field of currentRoleDetails.additionalFields) {
            if (field.required && !formData[field.name]) {
                 setError(`Please fill in the ${field.label} field.`);
                 addToast({ type: 'error', message: `Please fill in the ${field.label} field.`});
                 return;
            }
        }
    }

    setPageLoading(true);
    let success = false;
    if (registerMethod === 'email' && register) {
        success = await register(formData);
    } else if (registerMethod === 'phone' && registerWithPhone) {
        success = await registerWithPhone(formData, otp);
    } else {
        setError('Registration service is unavailable.');
        addToast({ type: 'error', message: 'Registration service unavailable.' });
    }

    if (success) {
        addToast({ type: 'success', message: `${roleName} registration successful! You can now log in.` });
        navigate(`/login/${role}`);
    } else {
        setError(`Registration failed. The email/phone might already be in use or an error occurred.`);
        // Toast for specific error message handled by register/registerWithPhone if they return structured errors
    }
    setPageLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-800 dark:to-secondary-900 p-4">
      <div className="bg-white dark:bg-dark-card p-8 sm:p-12 rounded-xl shadow-2xl w-full max-w-md animate-cardEntry">
        <div className="flex flex-col items-center mb-6">
            <RoleIcon className="w-16 h-16 text-primary-600 dark:text-primary-400 mb-3" />
            <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-300">{APP_NAME}</h1>
            <p className="text-center text-secondary-600 dark:text-secondary-400 mt-1">{roleName} Registration</p>
        </div>

        <div className="mb-6 flex border-b border-secondary-300 dark:border-dark-border">
            <button
                onClick={() => setRegisterMethod('email')}
                className={`flex-1 py-3 text-sm font-medium focus:outline-none transition-colors ${registerMethod === 'email' ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400' : 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'}`}
            >
                <EmailIcon className="w-5 h-5 inline mr-1 mb-0.5" /> Register with Email
            </button>
            <button
                onClick={() => setRegisterMethod('phone')}
                className={`flex-1 py-3 text-sm font-medium focus:outline-none transition-colors ${registerMethod === 'phone' ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400' : 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'}`}
            >
                <PhoneIcon className="w-5 h-5 inline mr-1 mb-0.5" /> Register with Phone
            </button>
        </div>
        
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            id="name"
            name="name"
            type="text"
            value={formData.name || ''}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            required
          />
          {registerMethod === 'email' && (
            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required={registerMethod === 'email'}
              autoComplete="email"
            />
          )}
          {registerMethod === 'phone' && (
            <>
              <Input
                label="Phone Number"
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                required={registerMethod === 'phone'}
                autoComplete="tel"
              />
              <div className="flex items-end gap-2">
                 <Input
                    label="One-Time Password (OTP)"
                    id="otp"
                    name="otp" // Name attribute for consistency, though value directly managed
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    required={registerMethod === 'phone'}
                    containerClassName="flex-grow"
                 />
                 <Button type="button" variant="secondary" onClick={handleSendOtp} disabled={pageLoading || !formData.phone} className="mb-4">
                    {pageLoading ? 'Sending...' : 'Send OTP'}
                 </Button>
               </div>
            </>
          )}
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            value={formData.password || ''}
            onChange={handleInputChange}
            placeholder="Create a password"
            required
            autoComplete="new-password"
          />
          <Input
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
            autoComplete="new-password"
          />
          {currentRoleDetails.additionalFields?.map(field => (
             <Input
                key={field.name}
                label={field.label}
                id={String(field.name)}
                name={String(field.name)}
                type={field.type}
                value={formData[field.name] as string || ''}
                onChange={handleInputChange}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                required={field.required}
             />
          ))}

          <Button type="submit" variant="primary" size="lg" className="w-full mt-4" disabled={pageLoading}>
            {pageLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div>
            ) : (
              `Register as ${roleName}`
            )}
          </Button>
        </form>
         <p className="mt-4 text-sm text-center">
            Already have an account?{' '}
            <Link to={`/login/${role}`} className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 hover:underline">
             Login here
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

export default GenericRegisterPage;
