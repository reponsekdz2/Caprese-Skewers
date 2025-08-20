import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { CalendarDaysIcon, PlusIcon, EditIcon, DeleteIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

interface AcademicTerm {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

interface AcademicYearSetting {
  id: string;
  schoolYear: string;
  terms: AcademicTerm[];
}

const AdminAcademicYearSettingsPage: React.FC = () => {
  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  
  const [yearSetting, setYearSetting] = useState<AcademicYearSetting | null>(null);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [currentYearName, setCurrentYearName] = useState('');

  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [currentTermData, setCurrentTermData] = useState<Partial<AcademicTerm>>({ name: '', startDate: '', endDate: '', isCurrent: false });
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAcademicYearSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/academic-year`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch academic year settings.');
      const data: AcademicYearSetting = await response.json();
      setYearSetting(data);
      setCurrentYearName(data.schoolYear);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load academic year settings.' });
      // Initialize with a default structure if fetch fails to prevent full page error
      setYearSetting({ id: 'new_year_settings', schoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, terms: [] });
      setCurrentYearName(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchAcademicYearSettings();
  }, [fetchAcademicYearSettings]);

  const handleSaveYearName = async () => {
    if (!yearSetting || !currentYearName) {
      addToast({type: 'warning', message: 'School year name cannot be empty.'});
      return;
    }
    setSaving(true);
    try {
      const payload = { ...yearSetting, schoolYear: currentYearName };
      const response = await fetch(`${API_URL}/admin/academic-year`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to update school year name.');
      
      const updatedSettings = await response.json();
      setYearSetting(updatedSettings.academicYearSettings);
      setCurrentYearName(updatedSettings.academicYearSettings.schoolYear);
      addToast({type: 'success', message: 'School year updated.'});
      setIsYearModalOpen(false);
    } catch (error: any) {
      addToast({type: 'error', message: error.message || 'Failed to save school year.'});
    } finally {
      setSaving(false);
    }
  };

  const openTermModal = (term: AcademicTerm | null = null) => {
    if (term) {
      setEditingTermId(term.id);
      setCurrentTermData({ 
        ...term, 
        startDate: term.startDate ? new Date(term.startDate).toISOString().split('T')[0] : '',
        endDate: term.endDate ? new Date(term.endDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingTermId(null);
      setCurrentTermData({ name: '', startDate: '', endDate: '', isCurrent: false });
    }
    setIsTermModalOpen(true);
  };
  
  const handleSaveTerm = async () => {
    if (!yearSetting || !currentTermData.name || !currentTermData.startDate || !currentTermData.endDate) {
        addToast({type: 'warning', message: 'Term name, start date, and end date are required.'});
        return;
    }
    if (new Date(currentTermData.startDate) >= new Date(currentTermData.endDate)) {
        addToast({type: 'error', message: 'Start date must be before end date.'});
        return;
    }
    setSaving(true);
    
    let updatedTermsArray: AcademicTerm[];
    if (editingTermId) {
        updatedTermsArray = yearSetting.terms.map(t => t.id === editingTermId ? { ...currentTermData, id: editingTermId } as AcademicTerm : t);
    } else {
        const newTerm: AcademicTerm = { ...currentTermData, id: `term-${Date.now()}-${Math.random().toString(16).slice(2)}` } as AcademicTerm;
        updatedTermsArray = [...yearSetting.terms, newTerm];
    }
    
    if (currentTermData.isCurrent) {
        updatedTermsArray = updatedTermsArray.map(t => ({ ...t, isCurrent: t.id === (editingTermId || currentTermData.id) }));
    }

    const payload = { ...yearSetting, terms: updatedTermsArray };

    try {
        const response = await fetch(`${API_URL}/admin/academic-year`, {
          method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to save term details.');
        
        const updatedSettings = await response.json();
        setYearSetting(updatedSettings.academicYearSettings);
        addToast({type: 'success', message: `Term ${editingTermId ? 'updated' : 'added'}.`});
        setIsTermModalOpen(false);
    } catch (error: any) {
        addToast({type: 'error', message: error.message || 'Failed to save term.'});
    } finally {
        setSaving(false);
    }
  };

  const handleDeleteTerm = async (termIdToDelete: string) => {
    if (!yearSetting || !window.confirm("Are you sure you want to delete this term?")) return;
    setSaving(true);
    const updatedTermsArray = yearSetting.terms.filter(t => t.id !== termIdToDelete);
    const payload = { ...yearSetting, terms: updatedTermsArray };
    try {
        const response = await fetch(`${API_URL}/admin/academic-year`, {
          method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to delete term via API.');
        
        const updatedSettings = await response.json();
        setYearSetting(updatedSettings.academicYearSettings);
        addToast({type: 'success', message: 'Term deleted.'});
    } catch (error: any) {
        addToast({type: 'error', message: error.message || 'Failed to delete term.'});
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10 dark:text-secondary-400">Loading academic year settings...</div>;
  if (!yearSetting) return (
    <div className="text-center py-10 dark:text-secondary-400">
        Could not load settings. 
        <Button onClick={() => { setCurrentYearName(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`); setIsYearModalOpen(true); }}>Set Up Academic Year</Button>
    </div>
  );


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <CalendarDaysIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" />
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text">Academic Year Settings</h1>
      </div>

      <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-primary-700 dark:text-primary-300">School Year: {yearSetting.schoolYear}</h2>
            <Button onClick={() => {setCurrentYearName(yearSetting.schoolYear); setIsYearModalOpen(true);}} variant="ghost" size="sm" leftIcon={<EditIcon className="w-4 h-4"/>}>Edit Year</Button>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <Button onClick={() => openTermModal()} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>}>Add New Term</Button>
      </div>

      <div className="space-y-4">
        {yearSetting.terms.map(term => (
          <div key={term.id} className={`p-5 rounded-lg shadow-md dark:shadow-xl transition-all duration-300 ${term.isCurrent ? 'bg-green-50 dark:bg-green-700 dark:bg-opacity-30 border-l-4 border-green-500 dark:border-green-400' : 'bg-white dark:bg-dark-card hover:shadow-lg dark:hover:shadow-2xl'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`text-xl font-semibold ${term.isCurrent ? 'text-green-700 dark:text-green-300' : 'text-secondary-800 dark:text-dark-text'}`}>{term.name} {term.isCurrent && <span className="text-xs font-normal">(Current Term)</span>}</h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="space-x-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => openTermModal(term)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label={`Edit ${term.name}`}/>
                <Button variant="danger" size="sm" onClick={() => handleDeleteTerm(term.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label={`Delete ${term.name}`} disabled={saving}/>
              </div>
            </div>
          </div>
        ))}
      </div>
      {yearSetting.terms.length === 0 && <p className="text-center text-secondary-500 dark:text-secondary-400 py-6">No academic terms defined for this year.</p>}
      
      <Modal isOpen={isYearModalOpen} onClose={() => setIsYearModalOpen(false)} title="Set Academic Year">
        <Input label="School Year (e.g., 2024-2025)" value={currentYearName} onChange={e => setCurrentYearName(e.target.value)} />
        <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveYearName} variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Year'}</Button>
        </div>
      </Modal>

      <Modal isOpen={isTermModalOpen} onClose={() => setIsTermModalOpen(false)} title={editingTermId ? "Edit Academic Term" : "Add New Academic Term"} size="lg">
        <form onSubmit={e => { e.preventDefault(); handleSaveTerm(); }} className="space-y-4">
            <Input label="Term Name" id="termNameModal" value={currentTermData.name || ''} onChange={e => setCurrentTermData(prev => ({...prev, name: e.target.value}))} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Start Date" id="termStartDateModal" type="date" value={currentTermData.startDate || ''} onChange={e => setCurrentTermData(prev => ({...prev, startDate: e.target.value}))} required />
                <Input label="End Date" id="termEndDateModal" type="date" value={currentTermData.endDate || ''} onChange={e => setCurrentTermData(prev => ({...prev, endDate: e.target.value}))} required />
            </div>
            <div className="flex items-center">
                <input type="checkbox" id="isCurrentTermModal" checked={currentTermData.isCurrent || false} onChange={e => setCurrentTermData(prev => ({...prev, isCurrent: e.target.checked}))} className="h-4 w-4 text-primary-600 border-secondary-300 dark:border-secondary-600 rounded focus:ring-primary-500" />
                <label htmlFor="isCurrentTermModal" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300">Mark as Current Term</label>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsTermModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : (editingTermId ? 'Save Changes' : 'Add Term')}</Button>
            </div>
        </form>
      </Modal>

    </div>
  );
};

export default AdminAcademicYearSettingsPage;