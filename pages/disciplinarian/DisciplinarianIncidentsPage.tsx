
import React, { useState, useEffect, useCallback } from 'react';
import { Incident, Student, DisciplineRule } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PlusIcon, EditIcon, DeleteIcon, ReportIcon as PageIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const DisciplinarianIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rules, setRules] = useState<DisciplineRule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIncidentData, setCurrentIncidentData] = useState<Partial<Incident>>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: '',
    status: 'Open',
    ruleId: null,
    actionTaken: '',
  });
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/discipline/incidents`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch incidents');
      const data: Incident[] = await response.json();
      setIncidents(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Fetch incidents error:", error);
      addToast({ type: 'error', message: 'Failed to load incidents.' });
    } finally {
      setLoading(false);
    }
  }, [addToast, getAuthHeaders]);
  
  const fetchStudentsAndRules = useCallback(async () => {
    try {
      const [studentsRes, rulesRes] = await Promise.all([
        fetch(`${API_URL}/students`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/discipline/rules`, { headers: getAuthHeaders() })
      ]);
      if (!studentsRes.ok) throw new Error('Failed to fetch students');
      if (!rulesRes.ok) throw new Error('Failed to fetch discipline rules');
      
      const studentsData: Student[] = await studentsRes.json();
      const rulesData: DisciplineRule[] = await rulesRes.json();
      setStudents(studentsData);
      setRules(rulesData);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load supporting data (students/rules).' });
    }
  }, [addToast, getAuthHeaders]);


  useEffect(() => {
    fetchIncidents();
    fetchStudentsAndRules();
  }, [fetchIncidents, fetchStudentsAndRules]);

  const handleInputChange = (key: keyof Partial<Incident>, value: string | null) => {
    setCurrentIncidentData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async () => {
    if (!currentIncidentData.studentId || !currentIncidentData.date || !currentIncidentData.description || !currentIncidentData.type || !currentIncidentData.status) {
      addToast({ type: 'error', message: 'Student, Date, Description, Type, and Status are required.' });
      return;
    }
    
    const payload = {
        ...currentIncidentData,
        ruleId: currentIncidentData.ruleId === '' ? null : currentIncidentData.ruleId,
        reportedBy: user?.name || 'System', // Current user reports it
    };

    setLoading(true);
    const method = editingIncident ? 'PUT' : 'POST';
    const url = editingIncident ? `${API_URL}/discipline/incidents/${editingIncident.id}` : `${API_URL}/discipline/incidents`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingIncident ? 'update' : 'log'} incident`);
      }
      addToast({ type: 'success', message: `Incident ${editingIncident ? 'updated' : 'logged'} successfully!` });
      fetchIncidents();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingIncident(null);
    setCurrentIncidentData({ studentId: '', date: new Date().toISOString().split('T')[0], description: '', type: '', status: 'Open', ruleId: null, actionTaken: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (incident: Incident) => {
    setEditingIncident(incident);
    setCurrentIncidentData(incident);
    setIsModalOpen(true);
  };

  const handleDelete = async (incidentId: string) => {
    if (window.confirm('Are you sure you want to delete this incident record?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/discipline/incidents/${incidentId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to delete incident');
        }
        addToast({ type: 'success', message: 'Incident deleted successfully.' });
        fetchIncidents();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message });
      } finally {
          setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIncident(null);
  };
  
  const studentOptions = students.map(s => ({ value: s.id, label: `${s.name} (${s.studentId})` }));
  const ruleOptions = [{value: '', label: 'N/A (No Specific Rule)'}, ...rules.map(r => ({ value: r.id, label: r.ruleName }))];
  const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'Under Review', label: 'Under Review' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' },
  ];
  const typeOptions = [ // Example types, can be made dynamic or configurable
    { value: 'Bullying', label: 'Bullying' },
    { value: 'Skipping Class', label: 'Skipping Class' },
    { value: 'Uniform Violation', label: 'Uniform Violation' },
    { value: 'Disrespect', label: 'Disrespect to Staff/Student' },
    { value: 'Vandalism', label: 'Vandalism' },
    { value: 'Other', label: 'Other' },
  ];


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center"><PageIcon className="w-8 h-8 mr-2 text-primary-600" />Student Incident Log</h1>
        <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto">
          Log New Incident
        </Button>
      </div>

      {loading && incidents.length === 0 ? <p className="text-center py-8">Loading incidents...</p> : (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Rule Broken</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Action Taken</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(inc.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{inc.studentName || students.find(s=>s.id === inc.studentId)?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{inc.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            inc.status === 'Open' ? 'bg-red-100 text-red-800' :
                            inc.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                            inc.status === 'Resolved' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800' // Closed
                        }`}>
                            {inc.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-500 max-w-sm break-words" title={inc.description}>{inc.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{rules.find(r=>r.id === inc.ruleId)?.ruleName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-500 max-w-xs break-words" title={inc.actionTaken}>{inc.actionTaken || 'Pending'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button onClick={() => openEditModal(inc)} variant="ghost" size="sm" leftIcon={<EditIcon className="w-4 h-4"/>}>Edit</Button>
                      <Button onClick={() => handleDelete(inc.id)} variant="danger" size="sm" leftIcon={<DeleteIcon className="w-4 h-4"/>}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {incidents.length === 0 && !loading && <p className="text-center text-secondary-500 py-8">No incidents logged yet.</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingIncident ? "Edit Incident Record" : "Log New Incident"}>
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
          <Select label="Student" id="studentId" options={studentOptions} value={currentIncidentData.studentId || ''} onChange={(e) => handleInputChange('studentId', e.target.value)} required />
          <Input label="Date of Incident" id="date" type="date" value={currentIncidentData.date || ''} onChange={(e) => handleInputChange('date', e.target.value)} required />
          <Select label="Type of Incident" id="type" options={typeOptions} value={currentIncidentData.type || ''} onChange={(e) => handleInputChange('type', e.target.value)} required />
          <Input label="Description of Incident" id="description" type="textarea" value={currentIncidentData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} required />
          <Select label="Rule Broken (Optional)" id="ruleId" options={ruleOptions} value={currentIncidentData.ruleId || ''} onChange={(e) => handleInputChange('ruleId', e.target.value || null)} />
          <Input label="Action Taken (Optional)" id="actionTaken" type="textarea" value={currentIncidentData.actionTaken || ''} onChange={(e) => handleInputChange('actionTaken', e.target.value)} />
          <Select label="Status" id="status" options={statusOptions} value={currentIncidentData.status || 'Open'} onChange={(e) => handleInputChange('status', e.target.value)} required />
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (editingIncident ? 'Saving...' : 'Logging...') : (editingIncident ? "Save Changes" : "Log Incident")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DisciplinarianIncidentsPage;
