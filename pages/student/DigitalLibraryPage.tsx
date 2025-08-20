
import React, { useState, useEffect, useCallback } from 'react';
import { TeacherResource } from '../../types'; 
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/common/Input';
import { LibraryIcon, DownloadIcon, EyeIcon, SyllabusIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const DigitalLibraryPage: React.FC = () => {
  const [resources, setResources] = useState<TeacherResource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const { user, getAuthHeaders } = useAuth(); // Added user
  const { addToast } = useToast();

  const fetchDigitalResources = useCallback(async () => {
    if (!user) { // Ensure user is available before fetching
        setLoading(false);
        addToast({type: 'error', message: 'Please log in to access the library.'});
        return;
    }
    setLoading(true);
    try {
      // Using the new student-specific endpoint
      const response = await fetch(`${API_URL}/student/digital-library`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch digital library resources');
      const data: TeacherResource[] = await response.json();
      // Sort by upload date, newest first
      setResources(data.sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load digital library.' });
      setResources([]); // Clear resources on error
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]); // Added user dependency

  useEffect(() => {
    fetchDigitalResources();
  }, [fetchDigitalResources]);

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resource.subject && resource.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (resource.type && resource.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (resource.className && resource.className.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const getFileIconByMimeType = (mimeType?: string): React.ReactNode => {
    if (!mimeType) return <SyllabusIcon className="w-10 h-10 text-secondary-500 dark:text-secondary-400" />;
    if (mimeType.includes('pdf')) return <span className="text-3xl font-bold text-red-500">PDF</span>;
    if (mimeType.includes('word')) return <span className="text-3xl font-bold text-blue-500">DOC</span>;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <span className="text-3xl font-bold text-orange-500">PPT</span>;
    if (mimeType.startsWith('image/')) return <EyeIcon className="w-10 h-10 text-green-500" />;
    return <SyllabusIcon className="w-10 h-10 text-secondary-500 dark:text-secondary-400" />;
  };


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center">
          <LibraryIcon className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
          Digital Library
        </h1>
        <Input
          id="searchLibrary"
          type="text"
          placeholder="Search by title, subject, class..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          containerClassName="mt-4 sm:mt-0 sm:w-72 mb-0"
          className="mt-0"
        />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Loading resources...</p>
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredResources.map(resource => (
            <div key={resource.id} className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-5 flex flex-col justify-between hover:shadow-xl dark:hover:shadow-primary-500/30 transition-all duration-300 transform hover:scale-105 animate-fadeIn">
              <div>
                <div className="flex items-center justify-center w-20 h-20 bg-primary-50 dark:bg-secondary-700 rounded-lg mb-4 mx-auto shadow-inner">
                    {getFileIconByMimeType(resource.mimeType)}
                </div>
                <h3 className="text-md font-semibold text-primary-700 dark:text-primary-300 mb-1 text-center truncate h-12" title={resource.title}>{resource.title}</h3>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center mb-1">
                    Type: <span className="capitalize font-medium">{resource.type.replace('_', ' ')}</span>
                </p>
                {resource.subject && <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center mb-1">Subject: {resource.subject}</p>}
                {resource.className && <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center mb-2">Class: {resource.className}</p>}
                
                {resource.description && <p className="text-xs text-secondary-600 dark:text-secondary-300 mb-3 text-center line-clamp-2" title={resource.description}>{resource.description}</p>}
                <p className="text-xs text-secondary-400 dark:text-secondary-500 text-center">By: {resource.teacherName || 'School Admin'} | {new Date(resource.uploadDate).toLocaleDateString()}</p>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <a 
                    href={resource.fileUrl || `data:${resource.mimeType};base64,${resource.fileData}`} 
                    download={resource.fileName}
                    className="flex-1 py-2 px-3 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors flex items-center justify-center font-medium shadow hover:shadow-md"
                    title={`Download ${resource.fileName}`}
                 >
                    <DownloadIcon className="w-4 h-4 mr-1.5"/> Download
                </a>
                 <a 
                    href={resource.fileUrl || `data:${resource.mimeType};base64,${resource.fileData}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center font-medium shadow hover:shadow-md"
                    title={`View ${resource.fileName}`}
                 >
                    <EyeIcon className="w-4 h-4 mr-1.5"/> View
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
         <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl shadow-md">
          <LibraryIcon className="w-16 h-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">No Digital Resources Found</h2>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2">
            {searchTerm ? "No resources match your search term." : "The digital library is currently empty or resources are being updated by teachers."}
          </p>
        </div>
      )}
    </div>
  );
};

export default DigitalLibraryPage;
