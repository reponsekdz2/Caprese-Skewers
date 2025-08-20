
import React, { useState, useEffect, useCallback } from 'react';
import { DisciplineRule, SchoolClass } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PlusIcon, EditIcon, DeleteIcon, UsersIcon as PageIcon } from '../../assets/icons'; // Placeholder icon
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const DisciplinarianRulesPage: React.FC = () => {
  const [rules, setRules] = useState<DisciplineRule[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRuleData, setCurrentRuleData] = useState<Partial<DisciplineRule>>({
    ruleName: '',
    description: '',
    severityLevel: 'low',
    applicableToClassId: null,
    consequence: '',
  });
  const [editingRule, setEditingRule] = useState<DisciplineRule | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/discipline/rules`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch discipline rules');
      const data: DisciplineRule[] = await response.json();
      setRules(data);
    } catch (error) {
      console.error("Fetch rules error:", error);
      addToast({ type: 'error', message: 'Failed to load discipline rules.' });
    } finally {
      setLoading(false);
    }
  }, [addToast, getAuthHeaders]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/classes`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch classes');
      const data: SchoolClass[] = await response.json();
      setClasses(data);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load classes for rule assignment.' });
    }
  }, [addToast, getAuthHeaders]);


  useEffect(() => {
    fetchRules();
    fetchClasses();
  }, [fetchRules, fetchClasses]);

  const handleInputChange = (key: keyof Partial<DisciplineRule>, value: string | null) => {
    setCurrentRuleData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async () => {
    if (!currentRuleData.ruleName || !currentRuleData.description || !currentRuleData.severityLevel) {
      addToast({ type: 'error', message: 'Rule Name, Description, and Severity are required.' });
      return;
    }
    
    const payload = {
        ...currentRuleData,
        applicableToClassId: currentRuleData.applicableToClassId === '' ? null : currentRuleData.applicableToClassId,
    };

    setLoading(true);
    const method = editingRule ? 'PUT' : 'POST';
    const url = editingRule ? `${API_URL}/discipline/rules/${editingRule.id}` : `${API_URL}/discipline/rules`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingRule ? 'update' : 'add'} rule`);
      }
      addToast({ type: 'success', message: `Discipline rule ${editingRule ? 'updated' : 'added'} successfully!` });
      fetchRules();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingRule(null);
    setCurrentRuleData({ ruleName: '', description: '', severityLevel: 'low', applicableToClassId: null, consequence: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (rule: DisciplineRule) => {
    setEditingRule(rule);
    setCurrentRuleData(rule);
    setIsModalOpen(true);
  };

  const handleDelete = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule? This may affect existing incident records if they refer to it.')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/discipline/rules/${ruleId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to delete rule');
        }
        addToast({ type: 'success', message: 'Rule deleted successfully.' });
        fetchRules();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message });
      } finally {
          setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };
  
  const severityOptions = [
    { value: 'warning', label: 'Warning' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const classOptions = [{ value: '', label: 'School-Wide (All Classes)'}, ...classes.map(c => ({value: c.id, label: c.name}))];

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center"><PageIcon className="w-8 h-8 mr-2 text-primary-600" />Manage Discipline Rules</h1>
        <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto">
          Add New Rule
        </Button>
      </div>

      {loading && rules.length === 0 ? <p className="text-center py-8">Loading discipline rules...</p> : (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Rule Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Applicable To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Consequence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{rule.ruleName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 capitalize">{rule.severityLevel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{classes.find(c=>c.id === rule.applicableToClassId)?.name || 'School-Wide'}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-500 max-w-md break-words" title={rule.description}>{rule.description}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-500 max-w-sm break-words" title={rule.consequence}>{rule.consequence || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button onClick={() => openEditModal(rule)} variant="ghost" size="sm" leftIcon={<EditIcon className="w-4 h-4"/>}>Edit</Button>
                      <Button onClick={() => handleDelete(rule.id)} variant="danger" size="sm" leftIcon={<DeleteIcon className="w-4 h-4"/>}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rules.length === 0 && !loading && <p className="text-center text-secondary-500 py-8">No discipline rules defined yet.</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRule ? "Edit Discipline Rule" : "Add New Discipline Rule"}>
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
          <Input label="Rule Name" id="ruleName" value={currentRuleData.ruleName || ''} onChange={(e) => handleInputChange('ruleName', e.target.value)} required />
          <Select label="Severity Level" id="severityLevel" options={severityOptions} value={currentRuleData.severityLevel || 'low'} onChange={(e) => handleInputChange('severityLevel', e.target.value)} required />
          <Select label="Applicable To Class (Optional)" id="applicableToClassId" options={classOptions} value={currentRuleData.applicableToClassId || ''} onChange={(e) => handleInputChange('applicableToClassId', e.target.value || null)} />
          <Input label="Description" id="description" type="textarea" value={currentRuleData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} required />
          <Input label="Suggested Consequence (Optional)" id="consequence" type="textarea" value={currentRuleData.consequence || ''} onChange={(e) => handleInputChange('consequence', e.target.value)} />
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (editingRule ? 'Saving...' : 'Adding...') : (editingRule ? "Save Changes" : "Add Rule")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DisciplinarianRulesPage;
