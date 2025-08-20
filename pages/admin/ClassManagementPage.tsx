import React, { useState, useEffect, useCallback } from 'react';
import { SchoolClass, User, UserRole } from '../../types'; 
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PlusIcon, EditIcon, DeleteIcon, ClassIcon as PageIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const ClassManagementPage: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClassData, setCurrentClassData] = useState<Partial<SchoolClass>>({
    name: '',
    teacherId: null,
    subject: '',
  });
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAuth(); 
  const { addToast } = useToast();

  const fetchClassesAndTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const classesResponse = await fetch(`${API_URL}/classes`, { headers: getAuthHeaders() });
      if (!classesResponse.ok) throw new Error('Failed to fetch classes');
      const classesData: SchoolClass[] = await classesResponse.json();
      setClasses(classesData);

      const usersResponse = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
      if (!usersResponse.ok) throw new Error('Failed to fetch users for teacher list');
      const allUsers: User[] = await usersResponse.json();
      setTeachers(allUsers.filter(u => u.role === UserRole.TEACHER || u.role === UserRole.HEAD_TEACHER));
      
    } catch (error) {
      console.error("Failed to load classes or teachers from server:", error);
      addToast({ type: 'error', message: 'Failed to load class or teacher data.' });
    } finally {
        setLoading(false);
    }
  }, [addToast, getAuthHeaders]);

  useEffect(() => {
    fetchClassesAndTeachers();
  }, [fetchClassesAndTeachers]);

  const handleInputChange = (key: keyof Partial<SchoolClass>, value: string | null) => {
    setCurrentClassData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async () => {
    if (!currentClassData.name) {
      addToast({ type: 'error', message: 'Class name is required.' });
      return;
    }

    setLoading(true);
    try {
      let url = `${API_URL}/classes`;
      let method = 'POST';
      const body = JSON.stringify({
        name: currentClassData.name,
        teacherId: currentClassData.teacherId || null, 
        subject: currentClassData.subject || null,
      });

      if (editingClass) {
        url = `${API_URL}/classes/${editingClass.id}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(), 
        body: body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingClass ? 'update' : 'add'} class`);
      }
      
      addToast({ type: 'success', message: `Class ${editingClass ? 'updated' : 'added'} successfully!` });
      fetchClassesAndTeachers(); 
      closeModal();
    } catch (error: any) {
      console.error(`Class ${editingClass ? 'update' : 'add'} error:`, error);
      addToast({ type: 'error', message: error.message || `Failed to ${editingClass ? 'update' : 'add'} class.` });
    } finally {
        setLoading(false);
    }
  };

  const openAddClassModal = () => {
    setEditingClass(null);
    setCurrentClassData({ name: '', teacherId: teachers.length > 0 ? teachers[0].id : null, subject: '' });
    setIsModalOpen(true);
  };

  const openEditClassModal = (classToEdit: SchoolClass) => {
    setEditingClass(classToEdit);
    setCurrentClassData(classToEdit);
    setIsModalOpen(true);
  };

  const handleDeleteClass = async (classIdToDelete: string) => {
    const classToDelete = classes.find(c => c.id === classIdToDelete);
    if (!classToDelete) return;

    if (window.confirm(`Are you sure you want to delete class: ${classToDelete.name}? This action cannot be undone.`)) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/classes/${classIdToDelete}`, { 
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to delete class');
        }
        addToast({ type: 'success', message: `Class ${classToDelete.name} deleted.` });
        fetchClassesAndTeachers(); 
      } catch (error: any) {
        console.error("Delete class error:", error);
        addToast({ type: 'error', message: error.message || 'Failed to delete class.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    setCurrentClassData({ name: '', teacherId: null, subject: '' });
  };

  const teacherOptions = [
    { value: '', label: 'Unassigned' }, 
    ...teachers.map(t => ({ value: t.id, label: t.name }))
  ];
  
  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return 'N/A';
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-2 text-primary-600" />
          Class Management
        </h1>
        <Button onClick={openAddClassModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto">
          Add New Class
        </Button>
      </div>

      {loading && classes.length === 0 ? <p className="text-center py-8">Loading classes...</p> : (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Class Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Assigned Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Student Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{cls.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{cls.subject || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{getTeacherName(cls.teacherId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{cls.studentCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button onClick={() => openEditClassModal(cls)} variant="ghost" size="sm" leftIcon={<EditIcon className="w-4 h-4"/>}>Edit</Button>
                      <Button onClick={() => handleDeleteClass(cls.id)} variant="danger" size="sm" leftIcon={<DeleteIcon className="w-4 h-4"/>}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {classes.length === 0 && !loading && <p className="text-center text-secondary-500 py-8">No classes defined yet.</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingClass ? "Edit Class" : "Add New Class"}>
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
          <Input label="Class Name (e.g., Grade 10A, Year 5 Blue)" id="className" value={currentClassData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} required />
          <Input label="Subject (Optional, e.g., Mathematics, Science)" id="classSubject" value={currentClassData.subject || ''} onChange={(e) => handleInputChange('subject', e.target.value)} />
          <Select label="Assign Teacher (Optional)" id="teacherId" options={teacherOptions} value={currentClassData.teacherId || ''} onChange={(e) => handleInputChange('teacherId', e.target.value || null)} />
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (editingClass ? 'Saving...' : 'Adding...') : (editingClass ? "Save Changes" : "Add Class")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClassManagementPage;
