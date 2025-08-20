
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Changed import
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { APP_NAME } from '../../constants';
import { useToast } from '../../hooks/useToast';
import { AdminIcon, EmailIcon, PhoneIcon, OtpIcon } from '../../assets/icons';
import { UserRole } from '../../types';

type LoginMethod = 'email' | 'phone';

const AdminLoginPage: React.FC = () => {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithPhone } = useAuth();
  const navigate = useNavigate(); // Changed usage
  const { addToast } = useToast();

  const handleSendOtp = async () => {
    // In a real app, this would call a backend endpoint to send OTP
    if (!phone) {
        addToast({ type: 'error', message: 'Please enter your phone number.' });
        return;
    }
    setLoading(true);
    // Simulate OTP sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    addToast({ type: 'info', message: `OTP sent to ${phone} (simulated). Use 123456` });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    let success = false;

    try {
      if (loginMethod === 'email') {
        if (!email || !password) {
            setError('Email and password are required.');
            addToast({ type: 'error', message: 'Email and password are required.' });
            setLoading(false);
            return;
        }
        success = await login(email, password, UserRole.ADMIN);
      } else { // Phone login
        if (!phone || !otp) {
            setError('Phone number and OTP are required.');
            addToast({ type: 'error', message: 'Phone number and OTP are required.' });
            setLoading(false);
            return;
        }
        if (loginWithPhone) { // Check if function exists
             success = await loginWithPhone(phone, otp, UserRole.ADMIN);
        } else {
            setError('Phone login is not available at the moment.');
            addToast({type: 'error', message: 'Phone login service unavailable.'});
        }
      }

      if (success) {
        addToast({ type: 'success', message: 'Admin login successful! Redirecting...' });
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin credentials. Please try again.');
        // Toast is handled by login/loginWithPhone on failure
      }
    } catch (err) {
      console.error("Admin Login page error:", err);
      setError('An unexpected error occurred. Please try again.');
      addToast({ type: 'error', message: 'Login failed. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-800 dark:to-secondary-900 p-4">
      <div className="bg-white dark:bg-dark-card p-8 sm:p-12 rounded-xl shadow-2xl w-full max-w-md animate-cardEntry">
        <div className="flex flex-col items-center mb-6">
            <AdminIcon className="w-16 h-16 text-primary-600 dark:text-primary-400 mb-3" />
            <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-300">{APP_NAME}</h1>
            <p className="text-center text-secondary-600 dark:text-secondary-400 mt-1">Administrator Login</p>
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
                label="Admin Email"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., reponsekdz06@gmail.com"
                required
                autoComplete="email"
              />
              <Input
                label="Admin Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                autoComplete="current-password"
              />
            </>
          )}

          {loginMethod === 'phone' && (
            <>
              <Input
                label="Admin Phone Number"
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                 <Button type="button" variant="secondary" onClick={handleSendOtp} disabled={loading || !phone} className="mb-4">
                    {loading ? 'Sending...' : 'Send OTP'}
                 </Button>
               </div>
            </>
          )}
          <Button type="submit" variant="primary" size="lg" className="w-full mt-4" disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div>
            ) : (
              'Login as Admin'
            )}
          </Button>
        </form>
         <p className="mt-6 text-xs text-center text-secondary-500 dark:text-secondary-400">
          Access for authorized administrators only.
        </p>
        <div className="mt-4 text-center">
            <Link to="/select-role" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 hover:underline">
                &larr; Back to Role Selection
            </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
