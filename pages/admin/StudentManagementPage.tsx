
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Student, SchoolClass } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PlusIcon, EditIcon, DeleteIcon, StudentIcon as DefaultStudentIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const StudentManagementPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudentData, setCurrentStudentData] = useState<Partial<Student>>({
    name: '', studentId: '', grade: '', parentContact: '', classId: '', medicalConditions: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudentsAndClasses = useCallback(async () => {
    try {
      const [studentsResponse, classesResponse] = await Promise.all([
        fetch(`${API_URL}/students`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/classes`, { headers: getAuthHeaders() })
      ]);
      if (!studentsResponse.ok) throw new Error('Failed to fetch students');
      if (!classesResponse.ok) throw new Error('Failed to fetch classes');
      
      const studentsData: Student[] = await studentsResponse.json();
      const classesData: SchoolClass[] = await classesResponse.json();
      setStudents(studentsData);
      setSchoolClasses(classesData);
    } catch (error) {
      console.error("Failed to load students or classes:", error);
      addToast({ type: 'error', message: 'Failed to load student or class data.' });
    }
  }, [addToast, getAuthHeaders]);

  useEffect(() => {
    fetchStudentsAndClasses();
  }, [fetchStudentsAndClasses]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleInputChange = (key: keyof Partial<Student>, value: string) => {
    setCurrentStudentData((prev) => ({ ...prev, [key]: value }));
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
      setAvatarPreview(editingStudent?.avatar || null);
    }
  };
  
  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleFormSubmit = async () => {
    if (!currentStudentData.name || !currentStudentData.studentId || !currentStudentData.grade) {
      addToast({ type: 'error', message: 'Name, Student ID, and Grade are required.' });
      return;
    }

    const formData = new FormData();
    Object.keys(currentStudentData).forEach(key => {
        const value = currentStudentData[key as keyof Student];
        if (value !== undefined && value !== null && key !== 'avatar') {
            formData.append(key, String(value));
        }
    });
    
    if (avatarFile) {
        formData.append('avatarFile', avatarFile);
    } else if (avatarPreview === null && editingStudent && editingStudent.avatar) {
      formData.append('avatar', 'REMOVE_AVATAR');
    }

    try {
      let url = `${API_URL}/students`;
      let method = 'POST';

      if (editingStudent) {
        url = `${API_URL}/students/${editingStudent.id}`;
        method = 'PUT';
      }
      
      const headers = { ...getAuthHeaders() };
      delete headers['Content-Type']; 

      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingStudent ? 'update' : 'add'} student`);
      }
      
      addToast({ type: 'success', message: `Student ${editingStudent ? 'updated' : 'added'} successfully!` });
      fetchStudentsAndClasses(); 
      closeModal();
    } catch (error: any) {
      console.error(`Student ${editingStudent ? 'update' : 'add'} error:`, error);
      addToast({ type: 'error', message: error.message || `Failed to ${editingStudent ? 'update' : 'add'} student.` });
    }
  };

  const openAddStudentModal = () => {
    setEditingStudent(null);
    setCurrentStudentData({ 
        name: '', studentId: '', grade: '', parentContact: '', classId: '', medicalConditions: '' 
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const openEditStudentModal = (studentToEdit: Student) => {
    setEditingStudent(studentToEdit);
    setCurrentStudentData(studentToEdit); 
    setAvatarFile(null);
    setAvatarPreview(studentToEdit.avatar || null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (studentIdToDelete: string) => {
    const studentToDelete = students.find(s => s.id === studentIdToDelete);
    if (!studentToDelete) return;

    if (window.confirm(`Are you sure you want to delete student: ${studentToDelete.name}? This action cannot be undone.`)) {
       try {
        const response = await fetch(`${API_URL}/students/${studentIdToDelete}`, { 
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to delete student');
        }
        addToast({ type: 'success', message: `Student ${studentToDelete.name} deleted.` });
        fetchStudentsAndClasses();
      } catch (error: any) {
        console.error("Delete student error:", error);
        addToast({ type: 'error', message: error.message || 'Failed to delete student.' });
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setCurrentStudentData({ name: '', studentId: '', grade: '', parentContact: '', classId: '', medicalConditions: '' });
    setAvatarFile(null);
    setAvatarPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const classOptions = [{value: '', label: 'Not Assigned'}, ...schoolClasses.map(c => ({ value: c.id, label: c.name }))];

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800">Student Management</h1>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
           <Input
            id="studentSearch"
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0 sm:w-64"
            className="mt-0"
          />
          <Button onClick={openAddStudentModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto">
            Add Student
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Avatar</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Student ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Grade/Class</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Assigned Class</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Parent Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-secondary-50 transition-colors duration-150">
                   <td className="px-6 py-4 whitespace-nowrap">
                    {student.avatar ? (
                      <img src={student.avatar} alt={`${student.name}'s avatar`} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary-200 text-secondary-500">
                        <DefaultStudentIcon className="w-6 h-6" />
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{student.studentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{student.grade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{schoolClasses.find(c => c.id === student.classId)?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{student.parentContact || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button onClick={() => openEditStudentModal(student)} variant="ghost" size="sm" aria-label={`Edit ${student.name}`} leftIcon={<EditIcon className="w-4 h-4"/>}>Edit</Button>
                    <Button onClick={() => handleDeleteStudent(student.id)} variant="danger" size="sm" aria-label={`Delete ${student.name}`} leftIcon={<DeleteIcon className="w-4 h-4"/>}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && <p className="text-center text-secondary-500 py-8">{students.length > 0 ? 'No students match your search.' : 'No students found. Click "Add Student" to create one.'}</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingStudent ? "Edit Student" : "Add New Student"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 mb-4">
                <label htmlFor="studentAvatar" className="block text-sm font-medium text-secondary-700">Avatar</label>
                {avatarPreview && <img src={avatarPreview} alt="Avatar preview" className="mt-2 w-24 h-24 rounded-full object-cover"/>}
                <input
                type="file" id="studentAvatar" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange}
                className="mt-2 block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {avatarPreview && <Button type="button" variant="ghost" size="sm" onClick={clearAvatar} className="mt-2 text-xs">Remove Avatar</Button>}
            </div>
            <Input label="Full Name" id="studentName" value={currentStudentData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} required />
            <Input label="Student ID" id="studentIdentifier" value={currentStudentData.studentId || ''} onChange={(e) => handleInputChange('studentId', e.target.value)} required disabled={!!editingStudent} placeholder={editingStudent ? currentStudentData.studentId : "Enter unique Student ID"}/>
            <Input label="Grade (e.g., 10A, Year 5)" id="studentGrade" value={currentStudentData.grade || ''} onChange={(e) => handleInputChange('grade', e.target.value)} required />
            <Select label="Assign to Class (Optional)" id="classId" options={classOptions} value={currentStudentData.classId || ''} onChange={(e) => handleInputChange('classId', e.target.value)} />
            <Input label="Parent/Guardian Contact (Optional)" id="parentContact" type="text" value={currentStudentData.parentContact || ''} onChange={(e) => handleInputChange('parentContact', e.target.value)} containerClassName="md:col-span-2"/>
            <Input label="Medical Conditions (Optional)" id="medicalConditions" type="textarea" containerClassName="md:col-span-2" value={currentStudentData.medicalConditions || ''} onChange={(e) => handleInputChange('medicalConditions', e.target.value)} />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary">{editingStudent ? "Save Changes" : "Add Student"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentManagementPage;