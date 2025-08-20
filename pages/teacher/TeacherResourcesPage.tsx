
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TeacherResource, SchoolClass, TeacherResourceModalState } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PlusIcon, EditIcon, DeleteIcon, SyllabusIcon, UploadIcon, CheckCircleIcon, CloseIcon, SparklesIcon } from '../../assets/icons'; 
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_URL = 'http://localhost:3001/api';

const TeacherResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<TeacherResource[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResourceData, setCurrentResourceData] = useState<TeacherResourceModalState>({
    title: '',
    type: 'exercise',
    classId: '',
    subject: '',
    description: '',
    isLiveExam: false,
    examDurationMinutes: 60,
    aiPrompt: '',
    aiGeneratedContent: '',
  });
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [editingResource, setEditingResource] = useState<TeacherResource | null>(null);
  const [loading, setLoading] = useState(false);
  // Removed isAiModalOpen as AI helper is now part of the main modal
  const [aiLoading, setAiLoading] = useState(false);
  
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiKey = typeof window !== 'undefined' ? (window as any).process?.env?.API_KEY : undefined;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("Gemini API key not found. AI features will be disabled.");
  }


  const fetchResources = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/teacher/resources?teacherId=${user.id}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch resources');
      const data: TeacherResource[] = await response.json();
      setResources(data);
    } catch (error) {
      console.error("Fetch resources error:", error);
      addToast({ type: 'error', message: 'Failed to load your resources.' });
    } finally {
      setLoading(false);
    }
  }, [user, addToast, getAuthHeaders]);

  const fetchClasses = useCallback(async () => {
    if (!user || (user.role !== 'Teacher' && user.role !== 'Head Teacher' && user.role !== 'Admin')) return;
    try {
      const response = await fetch(`${API_URL}/classes`, { headers: getAuthHeaders() }); 
      if (!response.ok) throw new Error('Failed to fetch classes');
      const data: SchoolClass[] = await response.json();
      setClasses(data);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load classes for selection.' });
    }
  }, [user, addToast, getAuthHeaders]);


  useEffect(() => {
    fetchResources();
    fetchClasses();
  }, [fetchResources, fetchClasses]);

  const handleInputChange = (key: keyof TeacherResourceModalState, value: string | boolean | number) => {
    setCurrentResourceData((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setResourceFile(event.target.files[0]);
    } else {
      setResourceFile(null);
    }
  };

  const handleToggleLiveExam = async (resource: TeacherResource) => {
    setLoading(true);
    const updatedStatus = !resource.isLiveExam;
    try {
        const response = await fetch(`${API_URL}/teacher/resources/${resource.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(), 
            body: JSON.stringify({ isLiveExam: updatedStatus }), 
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to update exam status.');
        }
        addToast({type: 'success', message: `Exam paper status updated to ${updatedStatus ? 'Live' : 'Not Live'}.`});
        fetchResources(); 
    } catch (error: any) {
        addToast({type: 'error', message: error.message});
    } finally {
        setLoading(false);
    }
  };


  const handleFormSubmit = async () => {
    if (!currentResourceData.title || !currentResourceData.type) {
      addToast({ type: 'error', message: 'Title and type are required.' });
      return;
    }
    if (!editingResource && !resourceFile) {
        addToast({ type: 'error', message: 'A file is required for new resources.' });
        return;
    }

    const formData = new FormData();
    formData.append('title', currentResourceData.title);
    formData.append('type', currentResourceData.type as string);
    if (currentResourceData.classId) formData.append('classId', currentResourceData.classId);
    if (currentResourceData.subject) formData.append('subject', currentResourceData.subject);
    if (currentResourceData.description) formData.append('description', currentResourceData.description);
    if (currentResourceData.type === 'exam_paper') {
        formData.append('isLiveExam', String(currentResourceData.isLiveExam || false));
        formData.append('examDurationMinutes', String(currentResourceData.examDurationMinutes || 60));
    }
    if (resourceFile) {
      formData.append('resourceFile', resourceFile);
    }
    
    setLoading(true);
    const method = editingResource ? 'PUT' : 'POST';
    const url = editingResource ? `${API_URL}/teacher/resources/${editingResource.id}` : `${API_URL}/teacher/resources`;
    
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
        throw new Error(errData.message || `Failed to ${editingResource ? 'update' : 'upload'} resource`);
      }
      addToast({ type: 'success', message: `Resource ${editingResource ? 'updated' : 'uploaded'} successfully!` });
      fetchResources();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingResource(null);
    setCurrentResourceData({ title: '', type: 'exercise', classId: '', subject: '', description: '', isLiveExam: false, examDurationMinutes: 60, aiPrompt: '', aiGeneratedContent: '' });
    setResourceFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const openEditModal = (resource: TeacherResource) => {
    setEditingResource(resource);
    setCurrentResourceData({ 
        title: resource.title, 
        type: resource.type, 
        classId: resource.classId || '', 
        subject: resource.subject || '',
        description: resource.description || '',
        isLiveExam: resource.isLiveExam || false,
        examDurationMinutes: resource.examDurationMinutes || 60,
        aiPrompt: '',
        aiGeneratedContent: '',
    });
    setResourceFile(null); 
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const handleDelete = async (resourceId: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/teacher/resources/${resourceId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to delete resource');
        }
        addToast({ type: 'success', message: 'Resource deleted successfully.' });
        fetchResources();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message });
      } finally {
          setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
    setResourceFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCurrentResourceData(prev => ({ ...prev, aiPrompt: '', aiGeneratedContent: '' }));
  };
  
  const resourceTypeOptions = [
    { value: 'exercise', label: 'Exercise / Worksheet' },
    { value: 'syllabus', label: 'Syllabus Document' },
    { value: 'book_chapter', label: 'Book / Chapter PDF' },
    { value: 'exam_paper', label: 'Exam Paper / Quiz' },
    { value: 'other', label: 'Other Material' },
  ];

  const classOptions = [{value: '', label: 'General (No specific class)'}, ...classes.map(c => ({ value: c.id, label: `${c.name} ${c.subject ? `(${c.subject})` : ''}`}))];

  const handleAiGenerate = async () => {
    if (!ai) {
        addToast({ type: 'error', message: 'AI service is not available. API Key might be missing.' });
        return;
    }
    if (!currentResourceData.aiPrompt) {
        addToast({ type: 'warning', message: 'Please enter a prompt for the AI.' });
        return;
    }
    setAiLoading(true);
    setCurrentResourceData(prev => ({ ...prev, aiGeneratedContent: 'Generating...' }));
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: currentResourceData.aiPrompt,
        });
        const text = response.text;
        setCurrentResourceData(prev => ({ ...prev, aiGeneratedContent: text }));
    } catch (error: any) {
        console.error("AI content generation error:", error);
        addToast({ type: 'error', message: error.message || 'Failed to generate AI content.' });
        setCurrentResourceData(prev => ({ ...prev, aiGeneratedContent: 'Error generating content.' }));
    } finally {
        setAiLoading(false);
    }
  };

  const handleInsertAiContent = () => {
    if (currentResourceData.aiGeneratedContent && currentResourceData.aiGeneratedContent !== 'Generating...' && currentResourceData.aiGeneratedContent !== 'Error generating content.') {
        setCurrentResourceData(prev => ({
            ...prev,
            description: (prev.description ? prev.description + "\n\n" : "") + "--- AI Generated Content ---\n" + prev.aiGeneratedContent
        }));
        addToast({type: 'success', message: 'AI content inserted into description.'});
        // Clear AI prompt and generated content after insertion to avoid re-inserting on next save
        setCurrentResourceData(prev => ({ ...prev, aiPrompt: '', aiGeneratedContent: '' }));
    } else {
        addToast({type: 'warning', message: 'No valid AI content to insert.'});
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center"><SyllabusIcon className="w-8 h-8 mr-2 text-primary-600 dark:text-primary-400" />My Uploaded Resources</h1>
        <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto">
          Upload New Resource
        </Button>
      </div>

      {loading && resources.length === 0 ? <p className="text-center py-8 dark:text-secondary-400">Loading your resources...</p> : (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-dark-border">
              <thead className="bg-secondary-50 dark:bg-secondary-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Live Exam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-secondary-200 dark:divide-dark-border">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-dark-text">{res.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400 capitalize">{res.type.replace('_', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{res.className || 'General'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{res.subject || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400 truncate max-w-xs" title={res.fileName}>
                        <a href={res.fileUrl || `data:${res.mimeType};base64,${res.fileData}`} download={res.fileName} className="text-primary-600 dark:text-primary-400 hover:underline">
                            {res.fileName}
                        </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{new Date(res.uploadDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                      {res.type === 'exam_paper' ? (
                        <button 
                            onClick={() => handleToggleLiveExam(res)}
                            className={`p-1.5 rounded-full transition-colors duration-200 ${res.isLiveExam ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'}`}
                            title={res.isLiveExam ? 'Mark as Not Live' : 'Mark as Live'}
                            disabled={loading}
                        >
                            {res.isLiveExam ? <CheckCircleIcon className="w-5 h-5 text-white" /> : <CloseIcon className="w-5 h-5 text-secondary-700 dark:text-secondary-200" />}
                        </button>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                      <Button onClick={() => openEditModal(res)} variant="ghost" size="sm" leftIcon={<EditIcon className="w-4 h-4"/>}>Edit</Button>
                      <Button onClick={() => handleDelete(res.id)} variant="danger" size="sm" leftIcon={<DeleteIcon className="w-4 h-4"/>}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resources.length === 0 && !loading && <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">No resources uploaded yet.</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingResource ? "Edit Resource" : "Upload New Resource"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
          <Input label="Title" id="resTitle" value={currentResourceData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} required />
          <Select label="Type" id="resType" options={resourceTypeOptions} value={currentResourceData.type || 'exercise'} onChange={(e) => handleInputChange('type', e.target.value)} required />
          <Select label="Class (Optional)" id="resClassId" options={classOptions} value={currentResourceData.classId || ''} onChange={(e) => handleInputChange('classId', e.target.value)} />
          <Input label="Subject (Optional)" id="resSubject" value={currentResourceData.subject || ''} onChange={(e) => handleInputChange('subject', e.target.value)} />
          
          <div className="mb-4">
            <label htmlFor="resDescription" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Description (Optional)</label>
            <textarea
                id="resDescription"
                value={currentResourceData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 sm:text-sm text-secondary-900 dark:text-dark-text"
            />
          </div>
          
          {currentResourceData.type === 'exam_paper' && (
            <>
              <div className="mt-4">
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Make Exam Live for Students?</label>
                <label htmlFor="isLiveExamToggle" className="flex items-center cursor-pointer mt-1">
                    <div className="relative">
                        <input type="checkbox" id="isLiveExamToggle" className="sr-only" 
                               checked={currentResourceData.isLiveExam || false} 
                               onChange={(e) => handleInputChange('isLiveExam', e.target.checked)} />
                        <div className={`block w-10 h-6 rounded-full ${currentResourceData.isLiveExam ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${currentResourceData.isLiveExam ? 'transform translate-x-full' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm text-secondary-600 dark:text-secondary-300">{currentResourceData.isLiveExam ? 'Live' : 'Not Live'}</div>
                </label>
              </div>
              <Input 
                label="Exam Duration (Minutes)" 
                id="examDuration" 
                type="number" 
                value={currentResourceData.examDurationMinutes || 60} 
                onChange={(e) => handleInputChange('examDurationMinutes', parseInt(e.target.value, 10))} 
                min="1"
              />
            </>
          )}

            {/* AI Content Helper Section */}
            {ai && (
                <div className="mt-6 pt-4 border-t border-secondary-200 dark:border-dark-border">
                    <h3 className="text-md font-semibold text-secondary-700 dark:text-dark-text mb-2 flex items-center">
                        <SparklesIcon className="w-5 h-5 mr-2 text-yellow-500" />
                        AI Content Helper
                    </h3>
                    <Input
                        label="AI Prompt (e.g., 'Create 3 quiz questions about photosynthesis for Grade 10')"
                        id="aiPrompt"
                        type="textarea"
                        rows={2}
                        value={currentResourceData.aiPrompt || ''}
                        onChange={(e) => handleInputChange('aiPrompt', e.target.value)}
                        placeholder="Describe the content you want to generate..."
                        containerClassName="mb-2"
                    />
                    <Button type="button" variant="ghost" onClick={handleAiGenerate} disabled={aiLoading || !currentResourceData.aiPrompt} className="w-full mb-2">
                        {aiLoading ? 'Generating with AI...' : 'Generate with AI'}
                    </Button>
                    {currentResourceData.aiGeneratedContent && (
                        <div className="mt-2">
                            <label htmlFor="aiGeneratedContentDisplay" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">AI Generated Content:</label>
                            <textarea
                                id="aiGeneratedContentDisplay"
                                value={currentResourceData.aiGeneratedContent}
                                readOnly
                                rows={5}
                                className="mt-1 block w-full px-3 py-2 bg-secondary-50 dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm text-sm text-secondary-700 dark:text-secondary-200"
                            />
                            <Button type="button" variant="secondary" size="sm" onClick={handleInsertAiContent} className="mt-2" disabled={aiLoading}>
                                Insert into Description
                            </Button>
                        </div>
                    )}
                </div>
            )}


          <div className="mt-4">
            <label htmlFor="resourceFile" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {editingResource ? "Replace File (Optional)" : "Resource File"}
            </label>
            <input
              type="file"
              id="resourceFile"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-secondary-500 dark:text-secondary-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-700 file:text-primary-700 dark:file:text-primary-100 hover:file:bg-primary-100 dark:hover:file:bg-primary-600"
              required={!editingResource}
            />
            {resourceFile && <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">Selected: {resourceFile.name}</p>}
             {editingResource && !resourceFile && <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">Current file: {editingResource.fileName}. To replace, choose a new file.</p>}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading || aiLoading} leftIcon={!editingResource ? <UploadIcon className="w-5 h-5"/> : undefined}>
                {loading ? (editingResource ? 'Saving...' : 'Uploading...') : (editingResource ? "Save Changes" : "Upload Resource")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherResourcesPage;

