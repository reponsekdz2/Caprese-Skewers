
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Notice as NoticeType, UserRole } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PlusIcon, EditIcon, DeleteIcon, NoticeIcon as PageIcon, SparklesIcon, UploadIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { GoogleGenAI, GenerateImagesResponse } from "@google/genai";

const API_URL = 'http://localhost:3001/api';

// Form state can include aiImagePrompt for the input field
interface NoticeFormData extends Partial<Omit<NoticeType, 'imageUrl'>> {
    aiImagePrompt?: string;
    imageUrl?: string | null; // Keep imageUrl for consistency with NoticeType
}


const NoticeBoardPage: React.FC = () => {
  const [notices, setNotices] = useState<NoticeType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNoticeData, setCurrentNoticeData] = useState<NoticeFormData>({
    title: '',
    content: '',
    publishDate: new Date().toISOString().split('T')[0],
    audience: 'all',
    aiImagePrompt: '',
    imageUrl: null,
  });
  
  const [noticeImageFile, setNoticeImageFile] = useState<File | null>(null); 
  const [imagePreviewForModal, setImagePreviewForModal] = useState<string | null>(null); // For modal's <img src>
  const [aiGeneratedBase64, setAiGeneratedBase64] = useState<string | null>(null); // For new AI image base64

  const noticeImageInputRef = useRef<HTMLInputElement>(null);
  const [editingNotice, setEditingNotice] = useState<NoticeType | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiImageLoading, setAiImageLoading] = useState(false);

  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const apiKey = typeof window !== 'undefined' ? (window as any).process?.env?.API_KEY : undefined;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("Gemini API key not found. AI features will be disabled.");
  }


  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/communication/notices`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch notices');
      
      const rawData: any[] = await response.json(); 
      const processedNotices: NoticeType[] = rawData.map(n => {
          let processedAudience: 'all' | UserRole[];
          if (Array.isArray(n.audience)) {
              processedAudience = n.audience
                  .map((aud: string) => aud as UserRole) 
                  .filter((aud: UserRole) => Object.values(UserRole).includes(aud)); 
          } else if (n.audience === 'all') {
              processedAudience = 'all';
          } else {
              console.warn(`Unexpected audience format for notice ${n.id}:`, n.audience);
              processedAudience = 'all'; 
          }
          return { ...n, audience: processedAudience, imageUrl: n.generatedImageUrl }; // Map server's generatedImageUrl to imageUrl
      });

      setNotices(processedNotices.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()));
    } catch (error) {
      console.error("Fetch notices error:", error);
      addToast({ type: 'error', message: 'Failed to load notices.' });
    } finally {
      setLoading(false);
    }
  }, [addToast, getAuthHeaders]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleInputChange = (key: keyof NoticeFormData, value: string | UserRole[] | 'all' | 'specific_users') => {
    setCurrentNoticeData((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleAudienceChange = (value: string) => { 
    const roleValueOrAll = value as UserRole | 'all' | 'specific_users'; // Added 'specific_users'
    const currentAudienceIsArray = Array.isArray(currentNoticeData.audience);

    if (roleValueOrAll === 'all' || roleValueOrAll === 'specific_users') {
        handleInputChange('audience', roleValueOrAll);
    } else { 
        const roleValue = roleValueOrAll as UserRole; 
        let newAudienceArray: UserRole[];

        if (currentAudienceIsArray) { 
            const currentArray = currentNoticeData.audience as UserRole[];
            if (currentArray.includes(roleValue)) {
                newAudienceArray = currentArray.filter(r => r !== roleValue);
            } else {
                newAudienceArray = [...currentArray, roleValue]; 
            }
        } else { 
            newAudienceArray = [roleValue]; 
        }
        
        if (newAudienceArray.length === 0) {
             handleInputChange('audience', 'all');
        } else {
            handleInputChange('audience', newAudienceArray);
        }
    }
};

 const handleNoticeImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        setNoticeImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreviewForModal(reader.result as string);
        };
        reader.readAsDataURL(file);
        setAiGeneratedBase64(null); // File upload overrides AI generation
    } else {
        setNoticeImageFile(null);
        setImagePreviewForModal(editingNotice?.imageUrl || null); // Revert to original image if file selection cancelled
    }
  };


  const handleFormSubmit = async () => {
    if (!currentNoticeData.title || !currentNoticeData.content) {
      addToast({ type: 'error', message: 'Title and content are required.' });
      return;
    }
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', currentNoticeData.title);
    formDataToSend.append('content', currentNoticeData.content);
    formDataToSend.append('publishDate', currentNoticeData.publishDate || new Date().toISOString().split('T')[0]);
    if (currentNoticeData.expiryDate) formDataToSend.append('expiryDate', currentNoticeData.expiryDate);
    
    if (Array.isArray(currentNoticeData.audience)) {
        currentNoticeData.audience.forEach(role => formDataToSend.append('audienceRoles[]', role));
        formDataToSend.append('audienceType', 'specific_roles');
    } else {
        formDataToSend.append('audienceType', currentNoticeData.audience as string); // 'all'
    }

    if (noticeImageFile) {
        formDataToSend.append('noticeImageFile', noticeImageFile);
    } else if (aiGeneratedBase64) {
        formDataToSend.append('generatedImageData', aiGeneratedBase64); // Send base64 for server processing
    } else if (!imagePreviewForModal && editingNotice?.imageUrl) { // Image was cleared in edit mode
        formDataToSend.append('removeExistingImage', 'true');
    }


    setLoading(true);
    const method = editingNotice ? 'PUT' : 'POST';
    const url = editingNotice ? `${API_URL}/communication/notices/${editingNotice.id}` : `${API_URL}/communication/notices`;
    
    try {
      const headers = { ...getAuthHeaders() };
      delete headers['Content-Type']; 

      const response = await fetch(url, {
        method,
        headers,
        body: formDataToSend,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingNotice ? 'update' : 'add'} notice`);
      }
      addToast({ type: 'success', message: `Notice ${editingNotice ? 'updated' : 'added'} successfully!` });
      fetchNotices();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingNotice(null);
    setCurrentNoticeData({ title: '', content: '', publishDate: new Date().toISOString().split('T')[0], audience: 'all', aiImagePrompt: '', imageUrl: null });
    setNoticeImageFile(null);
    setImagePreviewForModal(null);
    setAiGeneratedBase64(null);
    if (noticeImageInputRef.current) noticeImageInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const openEditModal = (notice: NoticeType) => {
    setEditingNotice(notice);
    setCurrentNoticeData({...notice, aiImagePrompt: ''}); // Initialize form with notice data
    setNoticeImageFile(null);
    setImagePreviewForModal(notice.imageUrl || null); // Set preview to existing image URL
    setAiGeneratedBase64(null);
    if (noticeImageInputRef.current) noticeImageInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const handleDelete = async (noticeId: string) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/communication/notices/${noticeId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to delete notice');
        }
        addToast({ type: 'success', message: 'Notice deleted successfully.' });
        fetchNotices();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message });
      } finally {
          setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNotice(null);
    setNoticeImageFile(null);
    setImagePreviewForModal(null);
    setAiGeneratedBase64(null);
    setCurrentNoticeData(prev => ({ ...prev, aiImagePrompt: ''}));
    if (noticeImageInputRef.current) noticeImageInputRef.current.value = "";
  };
  
  const audienceOptions = [
    { value: 'all', label: 'All Users' },
    ...Object.values(UserRole).map(role => ({ value: role, label: role })),
    // { value: 'specific_users', label: 'Specific Users' }, // This is handled implicitly by multi-select roles
  ];

  const handleGenerateImage = async () => {
    if (!ai) {
        addToast({ type: 'error', message: 'AI image generation service not available. API Key might be missing.' });
        return;
    }
    const promptForAI = currentNoticeData.aiImagePrompt || currentNoticeData.title;
    if (!promptForAI) {
        addToast({ type: 'warning', message: 'Please enter a title or an image prompt.'});
        return;
    }
    setAiImageLoading(true);
    setImagePreviewForModal(null); 
    setAiGeneratedBase64(null);
    setNoticeImageFile(null);
    if (noticeImageInputRef.current) noticeImageInputRef.current.value = "";

    try {
        const response: GenerateImagesResponse = await ai.models.generateImages({ 
            model: 'imagen-3.0-generate-002',
            prompt: promptForAI,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });
        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            setImagePreviewForModal(`data:image/jpeg;base64,${base64ImageBytes}`);
            setAiGeneratedBase64(base64ImageBytes);
            addToast({type: 'success', message: 'Image generated successfully!'});
        } else {
            throw new Error("No image generated or invalid response.");
        }
    } catch (error: any) {
        console.error("AI Image generation error:", error);
        addToast({type: 'error', message: error.message || 'Failed to generate image.'});
    } finally {
        setAiImageLoading(false);
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center"><PageIcon className="w-8 h-8 mr-2 text-primary-600 dark:text-primary-400" />Notice Board</h1>
        <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto">
          Create New Notice
        </Button>
      </div>

      {loading && notices.length === 0 ? <p className="text-center py-8 dark:text-secondary-400">Loading notices...</p> : (
        <div className="space-y-6">
          {notices.length > 0 ? notices.map((notice) => (
            <div key={notice.id} className="bg-white dark:bg-dark-card shadow-lg rounded-xl p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-primary-700 dark:text-primary-300 mb-1">{notice.title}</h2>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">
                    Published: {new Date(notice.publishDate).toLocaleDateString()} by {notice.authorName || 'Admin'}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">
                    Audience: <span className="capitalize font-medium">{Array.isArray(notice.audience) ? notice.audience.join(', ') : notice.audience}</span>
                  </p>
                </div>
                <div className="flex space-x-2 mt-2 sm:mt-0">
                  <Button onClick={() => openEditModal(notice)} variant="ghost" size="sm" leftIcon={<EditIcon className="w-4 h-4"/>}>Edit</Button>
                  <Button onClick={() => handleDelete(notice.id)} variant="danger" size="sm" leftIcon={<DeleteIcon className="w-4 h-4"/>}>Delete</Button>
                </div>
              </div>
              {notice.imageUrl && (
                <img 
                    src={notice.imageUrl} 
                    alt={notice.title} 
                    className="my-3 rounded-md max-h-60 w-auto object-contain shadow"
                />
              )}
              <p className="text-secondary-700 dark:text-dark-text whitespace-pre-wrap mt-2">{notice.content}</p>
            </div>
          )) : (
             <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl shadow-md">
                <PageIcon className="w-16 h-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">No Notices Yet</h2>
                <p className="text-secondary-500 dark:text-secondary-400 mt-2">Create a notice to inform students, teachers, and parents.</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingNotice ? "Edit Notice" : "Create New Notice"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
          <Input label="Title" id="noticeTitle" value={currentNoticeData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} required />
          <Input label="Publish Date" id="publishDate" type="date" value={currentNoticeData.publishDate || ''} onChange={(e) => handleInputChange('publishDate', e.target.value)} required />
          <Input label="Expiry Date (Optional)" id="expiryDate" type="date" value={currentNoticeData.expiryDate || ''} onChange={(e) => handleInputChange('expiryDate', e.target.value)} />
          
          <div className="my-4">
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Target Audience</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {audienceOptions.map(opt => (
                    <Button 
                        key={opt.value}
                        type="button"
                        variant={
                            (Array.isArray(currentNoticeData.audience) && currentNoticeData.audience.includes(opt.value as UserRole)) || 
                            currentNoticeData.audience === opt.value ? 'primary' : 'secondary'
                        }
                        onClick={() => handleAudienceChange(opt.value as string)}
                        className="w-full text-xs sm:text-sm"
                    >
                        {opt.label}
                    </Button>
                ))}
            </div>
          </div>
          
          <Input label="Content" id="noticeContent" type="textarea" rows={5} value={currentNoticeData.content || ''} onChange={(e) => handleInputChange('content', e.target.value)} required />
          
          <div className="mt-4">
            <label htmlFor="noticeImageFile" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Upload Image for Notice (Optional)
            </label>
            <Input
              id="noticeImageFile"
              type="file"
              accept="image/*"
              ref={noticeImageInputRef}
              onChange={handleNoticeImageFileChange}
              containerClassName="mb-0"
              className="mt-1"
            />
            {imagePreviewForModal && (
                <div className="mt-3">
                    <img src={imagePreviewForModal} alt="Notice Preview" className="max-h-48 w-auto rounded-md shadow"/>
                    { noticeImageFile && <p className="text-xs text-green-600">New file selected: {noticeImageFile.name}</p> }
                    { !noticeImageFile && editingNotice?.imageUrl && imagePreviewForModal === editingNotice.imageUrl && <p className="text-xs text-secondary-500">Current image. Upload new to replace or clear below.</p> }
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setNoticeImageFile(null); setImagePreviewForModal(null); setAiGeneratedBase64(null); if(noticeImageInputRef.current) noticeImageInputRef.current.value = "";}} className="mt-1 text-xs">Clear Image</Button>
                </div>
            )}
          </div>


          {ai && (
            <div className="mt-6 pt-4 border-t border-secondary-200 dark:border-dark-border">
                <h3 className="text-md font-semibold text-secondary-700 dark:text-dark-text mb-2 flex items-center">
                    <SparklesIcon className="w-5 h-5 mr-2 text-yellow-500" />
                    Or Generate Image with AI (Optional)
                </h3>
                <Input 
                    label="Describe the image you want (or use notice title)" 
                    id="aiImagePrompt" 
                    value={currentNoticeData.aiImagePrompt || ''} 
                    onChange={(e) => handleInputChange('aiImagePrompt', e.target.value)}
                    placeholder="e.g., 'A colorful banner for school sports day'"
                />
                <Button type="button" variant="ghost" onClick={handleGenerateImage} disabled={aiImageLoading || (!currentNoticeData.aiImagePrompt?.trim() && !currentNoticeData.title?.trim())} leftIcon={<SparklesIcon className="w-4 h-4"/>} className="mt-2">
                    {aiImageLoading ? 'Generating Image...' : 'Generate Image with AI'}
                </Button>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading || aiImageLoading}>
                {loading ? (editingNotice ? 'Saving...' : 'Publishing...') : (editingNotice ? "Save Changes" : "Publish Notice")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NoticeBoardPage;
