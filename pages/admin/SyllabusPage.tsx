
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Syllabus, SchoolClass } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { SyllabusIcon as PageIcon, PlusIcon, EditIcon, DeleteIcon, UploadIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const SyllabusPage: React.FC = () => {
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSyllabusData, setCurrentSyllabusData] = useState<Partial<Syllabus>>({
    classId: '',
    subject: '',
    title: '',
    description: '',
  });
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingSyllabus, setEditingSyllabus] = useState<Syllabus | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');


  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchSyllabi = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/academics/syllabus`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch syllabi');
      const data: Syllabus[] = await response.json();
      setSyllabi(data);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load syllabi.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);
  
  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/classes`, { headers: getAuthHeaders() });
      if (response.ok) setClasses(await response.json());
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load classes for filter.' });
    }
  }, [getAuthHeaders, addToast]);


  useEffect(() => {
    fetchSyllabi();
    fetchClasses();
  }, [fetchSyllabi, fetchClasses]);

  const handleInputChange = (key: keyof Partial<Syllabus>, value: string) => {
    setCurrentSyllabusData(prev => ({ ...prev, [key]: value }));
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSyllabusFile(event.target.files[0]);
    } else {
      setSyllabusFile(null);
    }
  };


  const handleFormSubmit = async () => {
    if (!currentSyllabusData.classId || !currentSyllabusData.subject || !currentSyllabusData.title || !currentSyllabusData.description) {
      addToast({ type: 'error', message: 'Class, Subject, Title, and Description are required.' });
      return;
    }
    
    const formData = new FormData();
    formData.append('classId', currentSyllabusData.classId);
    formData.append('subject', currentSyllabusData.subject);
    formData.append('title', currentSyllabusData.title);
    formData.append('description', currentSyllabusData.description);
    if (syllabusFile) {
        formData.append('syllabusFile', syllabusFile);
    }


    setLoading(true);
    const method = editingSyllabus ? 'PUT' : 'POST';
    const url = editingSyllabus ? `${API_URL}/academics/syllabus/${editingSyllabus.id}` : `${API_URL}/academics/syllabus`;
    
    try {
      const headers = { ...getAuthHeaders() }; 
      delete headers['Content-Type']; 

      const response = await fetch(url, {
        method,
        headers,
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingSyllabus ? 'update' : 'add'} syllabus`);
      }
      addToast({ type: 'success', message: `Syllabus ${editingSyllabus ? 'updated' : 'added'} successfully!` });
      fetchSyllabi();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSyllabus(null);
    setCurrentSyllabusData({ classId: '', subject: '', title: '', description: '' });
    setSyllabusFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const openEditModal = (syllabus: Syllabus) => {
    setEditingSyllabus(syllabus);
    setCurrentSyllabusData(syllabus);
    setSyllabusFile(null); 
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const handleDeleteSyllabus = async (syllabusId: string) => {
    if (window.confirm('Are you sure you want to delete this syllabus item?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/academics/syllabus/${syllabusId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete syllabus item');
        addToast({ type: 'success', message: 'Syllabus item deleted successfully.' });
        fetchSyllabi();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message || 'Could not delete item.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSyllabus(null);
    setSyllabusFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const classOptions = [{value: '', label: 'All Classes'}, ...classes.map(c => ({ value: c.id, label: c.name }))];
  const subjectOptionsList = [{value: '', label: 'All Subjects'}, ...[...new Set(syllabi.map(s => s.subject).filter(Boolean))].map(sub => ({value: sub, label: sub}))];


  const filteredSyllabi = syllabi.filter(s => 
    (!filterClassId || s.classId === filterClassId) &&
    (!filterSubject || s.subject.toLowerCase().includes(filterSubject.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Syllabus & Curriculum Management
        </h1>
        <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="mt-4 sm:mt-0">
          Add Syllabus Item
        </Button>
      </div>
      
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-secondary-50 rounded-lg shadow">
        <Select label="Filter by Class" options={classOptions} value={filterClassId} onChange={e => setFilterClassId(e.target.value)} />
        <Input label="Filter by Subject" placeholder="Enter subject keyword..." value={filterSubject} onChange={e => setFilterSubject(e.target.value)} />
      </div>


      {loading ? (
        <div className="text-center py-10">Loading syllabus information...</div>
      ) : filteredSyllabi.length > 0 ? (
        <div className="space-y-4">
          {filteredSyllabi.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-primary-700">{item.title}</h3>
                  <p className="text-xs text-secondary-500">
                    Class: {classes.find(c => c.id === item.classId)?.name || 'N/A'} | Subject: {item.subject}
                  </p>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(item)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label="Edit syllabus item"/>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteSyllabus(item.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label="Delete syllabus item"/>
                </div>
              </div>
              <p className="text-secondary-700 mt-2 text-sm whitespace-pre-wrap">{item.description}</p>
              {item.fileUrl && (
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                  View/Download Attached File
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Syllabus Items Found</h2>
          <p className="text-secondary-500 mt-2">
            { (filterClassId || filterSubject) ? "No items match your current filters." : "Add syllabus details for classes and subjects."}
          </p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSyllabus ? "Edit Syllabus Item" : "Add New Syllabus Item"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
          <Select label="Class" id="classIdSyllabusModal" options={classes.map(c=>({value:c.id, label:c.name}))} value={currentSyllabusData.classId || ''} onChange={e => handleInputChange('classId', e.target.value)} required />
          <Input label="Subject" id="subjectSyllabusModal" value={currentSyllabusData.subject || ''} onChange={e => handleInputChange('subject', e.target.value)} required placeholder="e.g., Mathematics, Physics" />
          <Input label="Title / Topic" id="titleSyllabusModal" value={currentSyllabusData.title || ''} onChange={e => handleInputChange('title', e.target.value)} required />
          <Input label="Description / Learning Objectives" id="descriptionSyllabusModal" type="textarea" rows={4} value={currentSyllabusData.description || ''} onChange={e => handleInputChange('description', e.target.value)} required />
          <div className="mt-4">
            <label htmlFor="syllabusFile" className="block text-sm font-medium text-secondary-700">
                Attach File (Optional PDF, DOCX etc.)
            </label>
            <input
              type="file"
              id="syllabusFile"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {syllabusFile && <p className="text-xs text-secondary-500 mt-1">Selected: {syllabusFile.name}</p>}
            {editingSyllabus && editingSyllabus.fileUrl && !syllabusFile && <p className="text-xs text-secondary-500 mt-1">Current file: <a href={editingSyllabus.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View File</a>. Upload new to replace.</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading} leftIcon={!editingSyllabus ? <UploadIcon className="w-4 h-4"/> : undefined}>
              {loading ? (editingSyllabus ? 'Saving...' : 'Adding...') : (editingSyllabus ? "Save Changes" : "Add Item")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SyllabusPage;
