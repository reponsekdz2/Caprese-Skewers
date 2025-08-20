
import React, { useState, useEffect, useCallback } from 'react';
import { FeeStructure, FeeCategory, SchoolClass } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PlusIcon, EditIcon, DeleteIcon, SettingsIcon as PageIcon } from '../../assets/icons'; // Using SettingsIcon as placeholder
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const BursarFeeStructuresPage: React.FC = () => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStructureData, setCurrentStructureData] = useState<Partial<FeeStructure>>({
    name: '',
    feeCategoryId: '',
    classId: null, // Explicitly null for "Global"
    amount: 0,
    frequency: 'monthly',
    dueDate: '',
  });
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchFeeStructures = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/finance/fee-structures`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch fee structures');
      const data: FeeStructure[] = await response.json();
      setFeeStructures(data);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load fee structures.' });
    } finally {
      setLoading(false);
    }
  }, [addToast, getAuthHeaders]);

  const fetchSupportingData = useCallback(async () => {
    try {
      const [catRes, classRes] = await Promise.all([
        fetch(`${API_URL}/finance/fee-categories`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/classes`, { headers: getAuthHeaders() }),
      ]);
      if (!catRes.ok) throw new Error('Failed to fetch fee categories');
      if (!classRes.ok) throw new Error('Failed to fetch classes');
      
      const catData: FeeCategory[] = await catRes.json();
      const classData: SchoolClass[] = await classRes.json();
      setFeeCategories(catData);
      setSchoolClasses(classData);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load categories or classes for selection.' });
    }
  }, [addToast, getAuthHeaders]);

  useEffect(() => {
    fetchFeeStructures();
    fetchSupportingData();
  }, [fetchFeeStructures, fetchSupportingData]);

  const handleInputChange = (key: keyof Partial<FeeStructure>, value: string | number | null) => {
    setCurrentStructureData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async () => {
    if (!currentStructureData.name || !currentStructureData.feeCategoryId || currentStructureData.amount == null || currentStructureData.amount <= 0) {
      addToast({ type: 'error', message: 'Structure Name, Fee Category, and a valid Amount are required.' });
      return;
    }
    
    const payload = {
        ...currentStructureData,
        classId: currentStructureData.classId === '' ? null : currentStructureData.classId, // Ensure null if empty string selected
        amount: Number(currentStructureData.amount),
    };

    setLoading(true);
    const method = editingStructure ? 'PUT' : 'POST';
    const url = editingStructure ? `${API_URL}/finance/fee-structures/${editingStructure.id}` : `${API_URL}/finance/fee-structures`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingStructure ? 'update' : 'add'} fee structure`);
      }
      addToast({ type: 'success', message: `Fee structure ${editingStructure ? 'updated' : 'added'} successfully!` });
      fetchFeeStructures();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingStructure(null);
    setCurrentStructureData({ name: '', feeCategoryId: feeCategories[0]?.id || '', classId: null, amount: 0, frequency: 'monthly', dueDate: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setCurrentStructureData(structure);
    setIsModalOpen(true);
  };

  const handleDelete = async (structureId: string) => {
    if (window.confirm('Are you sure you want to delete this fee structure? This could affect student billing.')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/finance/fee-structures/${structureId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to delete fee structure');
        }
        addToast({ type: 'success', message: 'Fee structure deleted successfully.' });
        fetchFeeStructures();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message });
      } finally {
          setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStructure(null);
  };
  
  const categoryOptions = feeCategories.map(cat => ({ value: cat.id, label: cat.name }));
  const classOptions = [{value: '', label: 'Global (All Classes)'}, ...schoolClasses.map(cls => ({ value: cls.id, label: cls.name }))];
  const frequencyOptions = [
    { value: 'one-time', label: 'One-Time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'termly', label: 'Termly (Quarterly)' },
    { value: 'annually', label: 'Annually' },
  ];

  const getCategoryName = (id?: string) => feeCategories.find(cat => cat.id === id)?.name || 'N/A';
  const getClassName = (id?: string | null) => schoolClasses.find(cls => cls.id === id)?.name || 'Global';


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center"><PageIcon className="w-8 h-8 mr-2 text-primary-600" />Manage Fee Structures</h1>
        <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto">
          Add New Structure
        </Button>
      </div>

      {loading && feeStructures.length === 0 ? <p className="text-center py-8">Loading fee structures...</p> : (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Structure Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Fee Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Applicable Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {feeStructures.map((fs) => (
                  <tr key={fs.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{fs.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{getCategoryName(fs.feeCategoryId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{getClassName(fs.classId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">${fs.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 capitalize">{fs.frequency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{fs.dueDate ? new Date(fs.dueDate).toLocaleDateString() : 'Varies'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button onClick={() => openEditModal(fs)} variant="ghost" size="sm" leftIcon={<EditIcon className="w-4 h-4"/>}>Edit</Button>
                      <Button onClick={() => handleDelete(fs.id)} variant="danger" size="sm" leftIcon={<DeleteIcon className="w-4 h-4"/>}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {feeStructures.length === 0 && !loading && <p className="text-center text-secondary-500 py-8">No fee structures defined yet.</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingStructure ? "Edit Fee Structure" : "Add New Fee Structure"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
          <Input label="Structure Name (e.g., Grade 10 Term 1)" id="structureName" value={currentStructureData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} required />
          <Select label="Fee Category" id="feeCategoryId" options={categoryOptions} value={currentStructureData.feeCategoryId || ''} onChange={(e) => handleInputChange('feeCategoryId', e.target.value)} required />
          <Select label="Applicable Class" id="classId" options={classOptions} value={currentStructureData.classId || ''} onChange={(e) => handleInputChange('classId', e.target.value || null)} />
          <Input label="Amount ($)" id="amount" type="number" value={currentStructureData.amount || 0} onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))} required min="0.01" step="0.01"/>
          <Select label="Frequency" id="frequency" options={frequencyOptions} value={currentStructureData.frequency || 'monthly'} onChange={(e) => handleInputChange('frequency', e.target.value)} required />
          <Input label="Due Date (Optional - e.g., for one-time payments)" id="dueDate" type="date" value={currentStructureData.dueDate || ''} onChange={(e) => handleInputChange('dueDate', e.target.value)} />
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (editingStructure ? 'Saving...' : 'Adding...') : (editingStructure ? "Save Changes" : "Add Structure")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BursarFeeStructuresPage;
