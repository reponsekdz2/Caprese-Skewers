
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../../types';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input'; // Added import
import { UsersIcon as PageIcon, TeacherIcon, LibraryIcon, UsersIcon as GenericStaffIcon, AdminIcon, EyeIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

interface StaffMember extends User {
    classesTaughtCount?: number; // Specific to teachers
}

const HeadTeacherStaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchStaffOverview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/headteacher/staff-overview`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch staff overview');
      const data: StaffMember[] = await response.json();
      setStaffList(data);
    } catch (error) {
      console.error("Fetch staff overview error:", error);
      addToast({ type: 'error', message: 'Failed to load staff overview.' });
    } finally {
      setLoading(false);
    }
  }, [addToast, getAuthHeaders]);

  useEffect(() => {
    fetchStaffOverview();
  }, [fetchStaffOverview]);


  const filteredStaff = staffList.filter(staff => 
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (staff.email && staff.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    staff.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: UserRole) => {
    switch(role) {
        case UserRole.TEACHER: return <TeacherIcon className="w-5 h-5 mr-2 text-blue-500"/>;
        case UserRole.LIBRARIAN: return <LibraryIcon className="w-5 h-5 mr-2 text-indigo-500"/>;
        case UserRole.ADMIN: return <AdminIcon className="w-5 h-5 mr-2 text-red-500"/>;
        // Add other roles if needed
        default: return <GenericStaffIcon className="w-5 h-5 mr-2 text-gray-500"/>;
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center"><PageIcon className="w-8 h-8 mr-2 text-primary-600" />Staff Overview</h1>
        <Input
            id="searchStaff"
            type="text"
            placeholder="Search by Name, Email, or Role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0 sm:w-72"
            className="mt-0"
        />
      </div>

      {loading && staffList.length === 0 ? <p className="text-center py-8">Loading staff information...</p> : (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            {staff.avatar ? (
                                <img src={staff.avatar} alt={staff.name} className="w-8 h-8 rounded-full mr-3 object-cover"/>
                            ) : (
                                <span className="w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center mr-3">
                                    {getRoleIcon(staff.role)}
                                </span>
                            )}
                            <span className="text-sm font-medium text-secondary-900">{staff.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 flex items-center">
                        {getRoleIcon(staff.role)}
                        {staff.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{staff.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{staff.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {staff.role === UserRole.TEACHER && `Classes: ${staff.classesTaughtCount || 0}`}
                        {/* Add other role-specific details here */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button onClick={() => navigate(`/headteacher/users?userId=${staff.id}`)} variant="ghost" size="sm" leftIcon={<EyeIcon className="w-4 h-4"/>}>Manage User</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStaff.length === 0 && !loading && <p className="text-center text-secondary-500 py-8">No staff members found matching your search.</p>}
        </div>
      )}
    </div>
  );
};

export default HeadTeacherStaffPage;