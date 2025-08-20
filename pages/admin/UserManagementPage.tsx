
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, UserRole } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PlusIcon, EditIcon, DeleteIcon, UsersIcon, AdminIcon, TeacherIcon, StudentIcon as RoleStudentIcon, ParentIcon, LibraryIcon as RoleLibraryIcon, BursarIcon, HeadTeacherIcon, DisciplinarianIcon, StaffIcon as RoleStaffIcon, DoctorIcon as RoleDoctorIcon } from '../../assets/icons'; // Added RoleStaffIcon, RoleDoctorIcon
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const workerRoles: UserRole[] = [
    UserRole.TEACHER,
    UserRole.BURSAR,
    UserRole.LIBRARIAN,
    UserRole.STAFF,
    UserRole.DOCTOR,
    UserRole.DISCIPLINARIAN,
    UserRole.HEAD_TEACHER,
    UserRole.ACCOUNTANT,
    UserRole.ADMIN, // Admins can create other admins
];

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<Partial<User>>({
    name: '', email: '', role: UserRole.TEACHER, password: '',
    phone: '', address: '', dateOfBirth: '', bio: '',
    emergencyContactName: '', emergencyContactPhone: '', occupation: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { user: loggedInUser, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data: User[] = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users from server:", error);
      addToast({ type: 'error', message: 'Failed to load users.' });
      setUsers([]);
    }
  }, [addToast, getAuthHeaders]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleInputChange = (key: keyof Partial<User>, value: any) => {
    setCurrentUserData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(null);
      setAvatarPreview(editingUser?.avatar || null); 
    }
  };
  
  const handleFormSubmit = async () => {
    if (!currentUserData.name || !currentUserData.email || !currentUserData.role) {
      addToast({ type: 'error', message: 'Please fill all required fields for the user.' });
      return;
    }
    if (!editingUser && !currentUserData.password) {
      addToast({ type: 'error', message: 'Password is required for new users.' });
      return;
    }
    // Ensure only worker roles are created by Admin/Head Teacher
    if (!editingUser && (loggedInUser?.role === UserRole.ADMIN || loggedInUser?.role === UserRole.HEAD_TEACHER) && 
        (currentUserData.role === UserRole.STUDENT || currentUserData.role === UserRole.PARENT)) {
        addToast({ type: 'error', message: 'Students and Parents should register through their specific portals.' });
        return;
    }


    const formData = new FormData();
    Object.keys(currentUserData).forEach(key => {
      const value = currentUserData[key as keyof User];
      if (value !== undefined && value !== null && key !== 'avatar') { // Don't append avatar string
        formData.append(key, String(value));
      }
    });
    
    if (avatarFile) {
        formData.append('avatarFile', avatarFile);
    } else if (avatarPreview === null && editingUser && editingUser.avatar) {
      formData.append('avatar', 'REMOVE_AVATAR'); // Signal to remove avatar
    }


    try {
      let url = `${API_URL}/users`;
      let method = 'POST';

      if (editingUser) {
        url = `${API_URL}/users/${editingUser.id}`;
        method = 'PUT';
      }
      
      const headers = { ...getAuthHeaders() };
      delete headers['Content-Type']; // Let browser set Content-Type for FormData

      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingUser ? 'update' : 'add'} user`);
      }
      
      addToast({ type: 'success', message: `User ${editingUser ? 'updated' : 'added'} successfully!` });
      fetchUsers(); 
      closeModal();
    } catch (error: any) {
      console.error(`User ${editingUser ? 'update' : 'add'} error:`, error);
      addToast({ type: 'error', message: error.message || `Failed to ${editingUser ? 'update' : 'add'} user.` });
    }
  };

  const openAddUserModal = () => {
    setEditingUser(null);
    setCurrentUserData({ 
        name: '', email: '', role: UserRole.TEACHER, password: '', // Default to Teacher role
        phone: '', address: '', dateOfBirth: '', bio: '',
        emergencyContactName: '', emergencyContactPhone: '', occupation: ''
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };
  
  const openEditUserModal = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setCurrentUserData({
        ...userToEdit, 
        password: '', 
    });
    setAvatarFile(null);
    setAvatarPreview(userToEdit.avatar || null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.id === loggedInUser?.id) {
      addToast({ type: 'error', message: 'You cannot delete your own account.'});
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete user: ${userToDelete.name}? This action cannot be undone.`)) {
      try {
        const response = await fetch(`${API_URL}/users/${userId}`, { 
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete user');
        }
        addToast({ type: 'success', message: `User ${userToDelete.name} deleted.` });
        fetchUsers(); 
      } catch (error: any) {
        console.error("Delete user error:", error);
        addToast({ type: 'error', message: error.message || 'Failed to delete user.' });
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setCurrentUserData({ name: '', email: '', role: UserRole.TEACHER, password: '' });
    setAvatarFile(null);
    setAvatarPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
    }
  };

  const getRoleOptions = () => {
    if (editingUser) {
        // If editing a Student or Parent, only show their current role (effectively disabling change here)
        if (editingUser.role === UserRole.STUDENT || editingUser.role === UserRole.PARENT) {
            return [{ value: editingUser.role, label: editingUser.role }];
        }
        // If editing a worker, allow changing to other worker roles
        return workerRoles.map(role => ({ value: role, label: role }));
    }
    // If adding a new user, only show worker roles
    return workerRoles.map(role => ({ value: role, label: role }));
  };

  const isRoleSelectDisabled = () => {
      if (editingUser && (editingUser.role === UserRole.STUDENT || editingUser.role === UserRole.PARENT)) {
          return true;
      }
      return false;
  };


  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <AdminIcon className="w-6 h-6" />;
      case UserRole.TEACHER: return <TeacherIcon className="w-6 h-6" />;
      case UserRole.STUDENT: return <RoleStudentIcon className="w-6 h-6" />;
      case UserRole.PARENT: return <ParentIcon className="w-6 h-6" />;
      case UserRole.LIBRARIAN: return <RoleLibraryIcon className="w-6 h-6" />;
      case UserRole.BURSAR:
      case UserRole.ACCOUNTANT:
           return <BursarIcon className="w-6 h-6" />;
      case UserRole.HEAD_TEACHER: return <HeadTeacherIcon className="w-6 h-6" />;
      case UserRole.DISCIPLINARIAN: return <DisciplinarianIcon className="w-6 h-6" />;
      case UserRole.STAFF: return <RoleStaffIcon className="w-6 h-6"/>;
      case UserRole.DOCTOR: return <RoleDoctorIcon className="w-6 h-6"/>;
      default: return <UsersIcon className="w-6 h-6" />;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text">User Management</h1>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          <Input
            id="userSearch"
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0 sm:w-64"
            className="mt-0"
          />
          <Button onClick={openAddUserModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto">
            Add User
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200 dark:divide-dark-border">
            <thead className="bg-secondary-50 dark:bg-secondary-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Avatar</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-secondary-200 dark:divide-dark-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.avatar ? (
                      <img src={user.avatar} alt={`${user.name}'s avatar`} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary-200 dark:bg-secondary-600 text-secondary-500 dark:text-secondary-300">
                        {getRoleIcon(user.role)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-dark-text">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{user.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === UserRole.ADMIN ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200' :
                      user.role === UserRole.TEACHER ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200' :
                      user.role === UserRole.STUDENT ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200' :
                      user.role === UserRole.PARENT ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button onClick={() => openEditUserModal(user)} variant="ghost" size="sm" aria-label={`Edit ${user.name}`} leftIcon={<EditIcon className="w-4 h-4"/>}>Edit</Button>
                    {user.id !== loggedInUser?.id && ( // Prevent deleting self
                        <Button onClick={() => handleDeleteUser(user.id)} variant="danger" size="sm" aria-label={`Delete ${user.name}`} leftIcon={<DeleteIcon className="w-4 h-4"/>}>Delete</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">{users.length > 0 ? 'No users match your search.' : 'No users found. Click "Add User" to create one.'}</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingUser ? "Edit User" : "Add New User"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 mb-4">
              <label htmlFor="avatar" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Avatar</label>
              {avatarPreview && <img src={avatarPreview} alt="Avatar preview" className="mt-2 w-24 h-24 rounded-full object-cover"/>}
              <input
                type="file"
                id="avatar"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleAvatarChange}
                className="mt-2 block w-full text-sm text-secondary-500 dark:text-secondary-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-700 file:text-primary-700 dark:file:text-primary-100 hover:file:bg-primary-100 dark:hover:file:bg-primary-600"
              />
              {avatarPreview && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearAvatar} className="mt-2 text-xs">
                      Remove Avatar
                  </Button>
              )}
            </div>
            <Input label="Full Name" id="name" value={currentUserData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} required />
            <Input label="Email" id="email" type="email" value={currentUserData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} required />
            <Input label="Phone (Optional)" id="phone" type="tel" value={currentUserData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} />
            <Input label="Date of Birth (Optional)" id="dateOfBirth" type="date" value={currentUserData.dateOfBirth || ''} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} />
            <Select 
                label="Role" 
                id="role" 
                value={currentUserData.role || UserRole.TEACHER} 
                onChange={(e) => handleInputChange('role', e.target.value as UserRole)} 
                options={getRoleOptions()} 
                required 
                disabled={isRoleSelectDisabled()}
            />
            <Input label={editingUser ? "New Password (optional)" : "Password"} id="password" type="password" value={currentUserData.password || ''} onChange={(e) => handleInputChange('password', e.target.value)} required={!editingUser} placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}/>
            <Input label="Address (Optional)" id="address" containerClassName="md:col-span-2" value={currentUserData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} />
            <Input label="Bio (Optional)" id="bio" type="textarea" containerClassName="md:col-span-2" value={currentUserData.bio || ''} onChange={(e) => handleInputChange('bio', e.target.value)} />
            <Input label="Emergency Contact Name (Optional)" id="emergencyContactName" value={currentUserData.emergencyContactName || ''} onChange={(e) => handleInputChange('emergencyContactName', e.target.value)} />
            <Input label="Emergency Contact Phone (Optional)" id="emergencyContactPhone" type="tel" value={currentUserData.emergencyContactPhone || ''} onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)} />
            {currentUserData.role === UserRole.PARENT && (
                <Input label="Occupation (Optional)" id="occupation" value={currentUserData.occupation || ''} onChange={(e) => handleInputChange('occupation', e.target.value)} />
            )}
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-700 dark:bg-opacity-20 border-l-4 border-yellow-400 text-yellow-700 dark:text-yellow-200 text-xs">
            <p className="font-bold">Security Note:</p>
            <p>Passwords will be sent to the server. In a production system, this connection must be HTTPS, and passwords should be hashed server-side immediately.</p>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary">{editingUser ? "Save Changes" : "Add User"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
