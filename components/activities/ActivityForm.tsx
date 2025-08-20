
import React, { useState, useEffect } from 'react';
import { Activity, User, ActivityCategory } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { useToast } from '../../hooks/useToast';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai"; 
import { SparklesIcon } from '../../assets/icons';

interface ActivityFormProps {
  activity?: Activity | null;
  teachers: User[];
  onSave: (activityData: Partial<Activity>) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const activityCategories: ActivityCategory[] = ['Sports', 'Arts', 'Academic Clubs', 'Community Service', 'Other'];

const ActivityForm: React.FC<ActivityFormProps> = ({ activity, teachers, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<Partial<Activity>>({
    name: '',
    description: '',
    category: 'Other',
    teacherInChargeId: null,
    schedule: '',
    location: '',
    maxParticipants: null,
    isEnrollmentOpen: true,
    imageUrl: '',
  });
  const [aiDescriptionPrompt, setAiDescriptionPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const { addToast } = useToast();
  
  const apiKey = typeof window !== 'undefined' ? (window as any).process?.env?.API_KEY : undefined;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("Gemini API key for ActivityForm not found. AI features will be disabled.");
  }


  useEffect(() => {
    if (activity) {
      setFormData({
        ...activity,
        teacherInChargeId: activity.teacherInChargeId || null,
        maxParticipants: activity.maxParticipants === null ? undefined : activity.maxParticipants,
      });
    } else {
        setFormData({ name: '', description: '', category: 'Other', teacherInChargeId: null, schedule: '', location: '', maxParticipants: undefined, isEnrollmentOpen: true, imageUrl: ''});
    }
  }, [activity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: value === '' ? null : parseInt(value, 10) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value === '' && name === 'teacherInChargeId' ? null : value }));
    }
  };
  
  const handleGenerateDescription = async () => {
    if (!ai) {
        addToast({type: 'error', message: 'AI service is not available.'});
        return;
    }
    if (!aiDescriptionPrompt.trim() && !formData.name?.trim()) {
        addToast({type: 'warning', message: 'Please provide an activity name or a prompt for AI.'});
        return;
    }
    setAiGenerating(true);
    const prompt = `Generate an engaging description for a school extracurricular activity.
    Activity Name: ${formData.name || 'Unnamed Activity'}
    Category: ${formData.category}
    Prompt hints: ${aiDescriptionPrompt}
    Keep it concise (2-3 sentences) and appealing to students/parents.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
        setFormData(prev => ({...prev, description: response.text}));
        addToast({type: 'success', message: 'Description generated!'});
    } catch(error: any) {
        addToast({type: 'error', message: error.message || 'Failed to generate description.'});
    } finally {
        setAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.schedule) {
        addToast({ type: 'error', message: 'Name, Category, and Schedule are required.' });
        return;
    }
    onSave(formData);
  };

  const teacherOptions = [{value: '', label: 'Unassigned / Volunteer'}, ...teachers.map(t => ({ value: t.id, label: t.name }))];
  const categoryOptions = activityCategories.map(cat => ({ value: cat, label: cat }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-1 pr-2">
      <Input name="name" label="Activity Name" value={formData.name || ''} onChange={handleChange} required />
      
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description || ''}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 sm:text-sm text-secondary-900 dark:text-dark-text"
        />
         {ai && (
            <div className="mt-2 space-y-1">
                <Input 
                    name="aiDescriptionPrompt"
                    label="AI Prompt for Description (Optional)"
                    placeholder="e.g., 'fun soccer club for beginners', 'competitive chess team'"
                    value={aiDescriptionPrompt}
                    onChange={(e) => setAiDescriptionPrompt(e.target.value)}
                    containerClassName="mb-0"
                />
                <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={aiGenerating || !aiDescriptionPrompt.trim()} leftIcon={<SparklesIcon className="w-4 h-4"/>}>
                    {aiGenerating ? "Generating..." : "Generate with AI"}
                </Button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select name="category" label="Category" options={categoryOptions} value={formData.category || 'Other'} onChange={handleChange} required />
        <Select name="teacherInChargeId" label="Teacher in Charge (Optional)" options={teacherOptions} value={formData.teacherInChargeId || ''} onChange={handleChange} />
      </div>
      <Input name="schedule" label="Schedule (e.g., Mon & Wed, 3-4 PM)" value={formData.schedule || ''} onChange={handleChange} required />
      <Input name="location" label="Location (Optional)" value={formData.location || ''} onChange={handleChange} />
      <Input name="maxParticipants" label="Max Participants (Optional, 0 or empty for unlimited)" type="number" min="0" value={formData.maxParticipants === null || formData.maxParticipants === undefined ? '' : String(formData.maxParticipants)} onChange={handleChange} />
      <Input name="imageUrl" label="Image URL (Optional)" placeholder="https://example.com/image.png" value={formData.imageUrl || ''} onChange={handleChange} />
      
      <div className="flex items-center">
        <input type="checkbox" id="isEnrollmentOpen" name="isEnrollmentOpen" checked={formData.isEnrollmentOpen || false} onChange={handleChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
        <label htmlFor="isEnrollmentOpen" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300">Enrollment Open</label>
      </div>

      <div className="flex justify-end space-x-3 pt-3 border-t dark:border-dark-border sticky bottom-0 bg-white dark:bg-dark-card py-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : (activity ? 'Save Changes' : 'Create Activity')}
        </Button>
      </div>
    </form>
  );
};

export default ActivityForm;
