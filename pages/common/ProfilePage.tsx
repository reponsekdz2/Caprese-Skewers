
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { User, CallType } from '../../types'; // Added CallType
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { EditIcon, UsersIcon as ProfileIcon, LockClosedIcon as PasswordIcon, UploadIcon, MailIcon, PhoneIcon as ContactPhoneIcon, CalendarIcon, BriefcaseIcon, LocationMarkerIcon, IdentificationIcon, PhoneIcon as CallUserIcon } from '../../assets/icons';
import { useCallManager } from '../../hooks/useCallManager'; // Import useCallManager
import { useParams } from 'react-router-dom'; // For potential user ID from params


const API_URL = 'http://localhost:3001/api';

interface ProfileDisplayField {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
}

const ProfilePage: React.FC = () => {
  const { user: loggedInUser, getAuthHeaders, login } = useAuth(); 
  const { addToast } = useToast();
  const { initiateCall } = useCallManager(); // Get initiateCall
  const params = useParams<{ userId?: string }>(); // For viewing other profiles
  const viewingOwnProfile = !params.userId || params.userId === loggedInUser?.id;


  const [profileData, setProfileData] = useState<User | null>(null);
  const [editingProfile, setEditingProfile] = useState<Partial<User>>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfileData = useCallback(async () => {
    const userIdToFetch = params.userId || loggedInUser?.id;
    if (!userIdToFetch) {
        setLoading(false);
        addToast({type: 'error', message: 'User ID not found.'});
        return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${userIdToFetch}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch profile data');
      const data: User = await response.json();
      setProfileData(data);
      setAvatarPreview(data.avatar || null);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load profile.' });
      if (!viewingOwnProfile) setProfileData(null); // Clear if viewing other and failed
    } finally {
      setLoading(false);
    }
  }, [params.userId, loggedInUser?.id, getAuthHeaders, addToast, viewingOwnProfile]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const openEditModal = () => {
    if (!profileData || !viewingOwnProfile) return;
    setEditingProfile({
      name: profileData.name,
      phone: profileData.phone,
      address: profileData.address,
      dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
      bio: profileData.bio,
      emergencyContactName: profileData.emergencyContactName,
      emergencyContactPhone: profileData.emergencyContactPhone,
      occupation: profileData.occupation,
    });
    setAvatarPreview(profileData.avatar || null);
    setAvatarFile(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    setIsEditModalOpen(true);
  };

  const handleProfileInputChange = (key: keyof Partial<User>, value: string) => {
    setEditingProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(null);
      setAvatarPreview(profileData?.avatar || null);
    }
  };
  
  const clearAvatarPreview = () => {
      setAvatarFile(null);
      setAvatarPreview(null); 
      if(avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleSaveProfile = async () => {
    if (!loggedInUser || !editingProfile || !viewingOwnProfile) return;
    setSaving(true);

    const formData = new FormData();
    Object.keys(editingProfile).forEach(key => {
      const value = editingProfile[key as keyof User];
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (avatarFile) {
      formData.append('avatarFile', avatarFile);
    } else if (avatarPreview === null && profileData?.avatar) {
      formData.append('avatar', 'REMOVE_AVATAR');
    }

    try {
      const headers = { ...getAuthHeaders() };
      delete headers['Content-Type'];

      const response = await fetch(`${API_URL}/users/${loggedInUser.id}`, {
        method: 'PUT',
        headers: headers,
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      addToast({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditModalOpen(false);
      fetchProfileData(); 
      if (loggedInUser.email && profileData?.password) { 
        await login(loggedInUser.email, profileData.password, loggedInUser.role);
      }
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmNewPassword) {
      addToast({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (!currentPassword || !newPassword) {
        addToast({ type: 'error', message: 'All password fields are required.' });
        return;
    }
    if (!loggedInUser) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/users/${loggedInUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: currentPassword, newPassword: newPassword }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password. Ensure current password is correct.');
      }
      addToast({ type: 'success', message: 'Password changed successfully!' });
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleInitiateCall = (targetUser: User | null) => {
    if (targetUser) {
        initiateCall([targetUser], CallType.AUDIO); // Wrapped targetUser in an array
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  if (!profileData) {
    return <div className="text-center py-10">Could not load profile data. Please try again.</div>;
  }

  const personalDetails: ProfileDisplayField[] = [
    { label: "Full Name", value: profileData.name, icon: ProfileIcon },
    { label: "Email Address", value: profileData.email, icon: MailIcon },
    { label: "Phone Number", value: profileData.phone, icon: ContactPhoneIcon },
    { label: "Role", value: profileData.role, icon: BriefcaseIcon },
    { label: "Date of Birth", value: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : null, icon: CalendarIcon },
    { label: "Address", value: profileData.address, icon: LocationMarkerIcon },
  ];

  const additionalDetails: ProfileDisplayField[] = [
    { label: "Bio", value: profileData.bio },
    { label: "Emergency Contact", value: profileData.emergencyContactName && profileData.emergencyContactPhone ? `${profileData.emergencyContactName} (${profileData.emergencyContactPhone})` : null },
    { label: "Occupation", value: profileData.occupation }
  ].filter(detail => detail.value);


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-secondary-800 mb-8">{viewingOwnProfile ? "My Profile" : `${profileData.name}'s Profile`}</h1>
      
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          <div className="md:col-span-1 flex flex-col items-center text-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt={profileData.name} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover mb-4 shadow-md border-4 border-primary-200" />
            ) : (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-secondary-200 flex items-center justify-center mb-4 shadow-md border-4 border-primary-200">
                <ProfileIcon className="w-16 h-16 sm:w-20 sm:h-20 text-secondary-500" />
              </div>
            )}
            <h2 className="text-2xl font-semibold text-primary-700">{profileData.name}</h2>
            <p className="text-secondary-600">{profileData.role}</p>
            <div className="mt-6 space-y-3 w-full">
              {viewingOwnProfile && (
                <>
                  <Button onClick={openEditModal} variant="primary" className="w-full" leftIcon={<EditIcon className="w-4 h-4"/>}>Edit Profile</Button>
                  <Button onClick={() => setIsPasswordModalOpen(true)} variant="secondary" className="w-full" leftIcon={<PasswordIcon className="w-4 h-4"/>}>Change Password</Button>
                </>
              )}
              {!viewingOwnProfile && profileData.phone && ( // Show call button if viewing other's profile AND they have a phone number
                 <Button onClick={() => handleInitiateCall(profileData)} variant="primary" className="w-full" leftIcon={<CallUserIcon className="w-4 h-4"/>}>Call {profileData.name}</Button>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="space-y-6">
                <section>
                    <h3 className="text-xl font-semibold text-secondary-700 border-b pb-2 mb-3">Personal Details</h3>
                    {personalDetails.map(field => field.value && (
                        <div key={field.label} className="flex items-center mb-3 text-sm">
                            {field.icon && <field.icon className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0"/>}
                            <span className="font-medium text-secondary-600 w-36">{field.label}:</span>
                            <span className="text-secondary-800">{field.value}</span>
                        </div>
                    ))}
                </section>

                {additionalDetails.length > 0 && (
                    <section>
                        <h3 className="text-xl font-semibold text-secondary-700 border-b pb-2 mb-3">Additional Information</h3>
                        {additionalDetails.map(field => field.value && (
                            <div key={field.label} className="mb-3 text-sm">
                                <p className="font-medium text-secondary-600">{field.label}:</p>
                                <p className="text-secondary-800 whitespace-pre-wrap">{field.value}</p>
                            </div>
                        ))}
                    </section>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal (only for own profile) */}
      {viewingOwnProfile && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile" size="lg">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-4">
            <div className="flex flex-col items-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover mb-2 shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-secondary-200 flex items-center justify-center mb-2">
                  <ProfileIcon className="w-12 h-12 text-secondary-400" />
                </div>
              )}
              <Input
                id="avatarUpload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                ref={avatarInputRef}
                className="text-sm"
              />
              {avatarPreview && <Button type="button" variant="ghost" size="sm" onClick={clearAvatarPreview} className="mt-1 text-xs">Remove Avatar</Button>}
            </div>

            <Input label="Full Name" id="editName" value={editingProfile.name || ''} onChange={(e) => handleProfileInputChange('name', e.target.value)} />
            <Input label="Phone Number" id="editPhone" type="tel" value={editingProfile.phone || ''} onChange={(e) => handleProfileInputChange('phone', e.target.value)} />
            <Input label="Address" id="editAddress" value={editingProfile.address || ''} onChange={(e) => handleProfileInputChange('address', e.target.value)} />
            <Input label="Date of Birth" id="editDob" type="date" value={editingProfile.dateOfBirth || ''} onChange={(e) => handleProfileInputChange('dateOfBirth', e.target.value)} />
            <Input label="Bio" id="editBio" type="textarea" rows={3} value={editingProfile.bio || ''} onChange={(e) => handleProfileInputChange('bio', e.target.value)} />
            <Input label="Emergency Contact Name" id="editEmergencyName" value={editingProfile.emergencyContactName || ''} onChange={(e) => handleProfileInputChange('emergencyContactName', e.target.value)} />
            <Input label="Emergency Contact Phone" id="editEmergencyPhone" type="tel" value={editingProfile.emergencyContactPhone || ''} onChange={(e) => handleProfileInputChange('emergencyContactPhone', e.target.value)} />
            { (loggedInUser?.role === 'Parent' || loggedInUser?.role === 'Teacher') && 
              <Input label="Occupation" id="editOccupation" value={editingProfile.occupation || ''} onChange={(e) => handleProfileInputChange('occupation', e.target.value)} />
            }
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Password Modal (only for own profile) */}
       {viewingOwnProfile && (
        <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change Password">
            <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="space-y-4">
            <Input label="Current Password" id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <Input label="New Password" id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <Input label="Confirm New Password" id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Change Password'}</Button>
            </div>
            </form>
        </Modal>
       )}
    </div>
  );
};

export default ProfilePage;