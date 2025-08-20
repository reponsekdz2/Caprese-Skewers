
import React, { useState, useEffect, useCallback } from 'react';
import { PayrollEntry, User, UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PayrollIcon as PageIcon, PlusIcon, EditIcon, DeleteIcon, CheckCircleIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const PayrollPage: React.FC = () => {
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEntryData, setCurrentEntryData] = useState<Partial<PayrollEntry>>({
    userId: '',
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, 
    grossSalary: 0,
    deductions: 0,
    status: 'pending',
  });
  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchPayrollEntries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/finance/payroll`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch payroll entries');
      const data: PayrollEntry[] = await response.json();
      setPayrollEntries(data.sort((a,b) => new Date(b.month + '-01').getTime() - new Date(a.month + '-01').getTime() || a.userId.localeCompare(b.userId) ));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load payroll data.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);
  
  const fetchStaffUsers = useCallback(async () => {
    try {
        const response = await fetch(`${API_URL}/users`, {headers: getAuthHeaders()});
        if (!response.ok) throw new Error('Failed to fetch staff users');
        const allUsers: User[] = await response.json();
        setStaffUsers(allUsers.filter(u => u.role !== UserRole.STUDENT && u.role !== UserRole.PARENT));
    } catch (error) {
        addToast({ type: 'error', message: 'Failed to load staff list.' });
    }
  }, [getAuthHeaders, addToast]);


  useEffect(() => {
    fetchPayrollEntries();
    fetchStaffUsers();
  }, [fetchPayrollEntries, fetchStaffUsers]);

  const handleInputChange = (key: keyof Partial<PayrollEntry>, value: string | number) => {
    setCurrentEntryData(prev => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async () => {
    if (!currentEntryData.userId || !currentEntryData.month || currentEntryData.grossSalary == null || Number(currentEntryData.grossSalary) <= 0) {
      addToast({ type: 'error', message: 'Staff Member, Month, and a valid Gross Salary are required.' });
      return;
    }
    
    const netSalary = (Number(currentEntryData.grossSalary) || 0) - (Number(currentEntryData.deductions) || 0);
    const payload = { ...currentEntryData, grossSalary: Number(currentEntryData.grossSalary), deductions: Number(currentEntryData.deductions) || 0, netSalary };
    if (payload.status === 'paid' && !payload.paymentDate) {
        payload.paymentDate = new Date().toISOString().split('T')[0];
    }


    setLoading(true);
    const method = editingEntry ? 'PUT' : 'POST';
    const url = editingEntry ? `${API_URL}/finance/payroll/${editingEntry.id}` : `${API_URL}/finance/payroll`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingEntry ? 'update' : 'add'} payroll entry`);
      }
      addToast({ type: 'success', message: `Payroll entry ${editingEntry ? 'updated' : 'added'} successfully!` });
      fetchPayrollEntries();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingEntry(null);
    setCurrentEntryData({ userId: '', month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, grossSalary: 0, deductions: 0, status: 'pending' });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: PayrollEntry) => {
    setEditingEntry(entry);
    setCurrentEntryData(entry);
    setIsModalOpen(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this payroll entry?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/finance/payroll/${entryId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete payroll entry');
        addToast({ type: 'success', message: 'Payroll entry deleted successfully.' });
        fetchPayrollEntries();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message || 'Could not delete entry.' });
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleMarkAsPaid = async (entry: PayrollEntry) => {
    if (entry.status === 'paid') {
        addToast({type: 'info', message: 'This entry is already marked as paid.'});
        return;
    }
    if (window.confirm(`Mark payroll for ${staffUsers.find(u=>u.id === entry.userId)?.name} for ${entry.month} as PAID?`)) {
        setLoading(true);
         const payload = { ...entry, status: 'paid', paymentDate: new Date().toISOString().split('T')[0] };
        try {
            const response = await fetch(`${API_URL}/finance/payroll/${entry.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.message || 'Failed to mark as paid.');
            }
            addToast({type: 'success', message: 'Payroll marked as paid.'});
            fetchPayrollEntries();
        } catch (error: any) {
            addToast({type: 'error', message: error.message});
        } finally {
            setLoading(false);
        }
    }
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };
  
  const staffOptions = staffUsers.map(s => ({ value: s.id, label: `${s.name} (${s.role})`}));
  const statusOptionsForFilter = [
    {value: '', label: 'All Statuses'},
    {value: 'pending', label: 'Pending'},
    {value: 'paid', label: 'Paid'},
  ];
  const statusOptionsForModal = [ {value: 'pending', label: 'Pending'}, {value: 'paid', label: 'Paid'} ];


  const filteredEntries = payrollEntries.filter(entry => 
    (!filterStatus || entry.status === filterStatus)
  );
  
  const getStaffName = (userId: string) => staffUsers.find(u => u.id === userId)?.name || 'Unknown Staff';


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Staff Payroll Management
        </h1>
        <div className="flex gap-2 mt-4 sm:mt-0 items-end">
            <Select
                label="Filter by Status"
                options={statusOptionsForFilter}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                containerClassName="mb-0 min-w-[180px]"
                className="mt-0"
            />
            <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>}>
                Add Payroll Entry
            </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading payroll entries...</div>
      ) : filteredEntries.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Gross Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Net Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Payment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{getStaffName(entry.userId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{entry.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">${entry.grossSalary.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">${entry.deductions.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${entry.netSalary.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {entry.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{entry.paymentDate ? new Date(entry.paymentDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(entry)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label="Edit payroll entry">Edit</Button>
                      {entry.status === 'pending' && 
                        <Button variant="ghost" size="sm" onClick={() => handleMarkAsPaid(entry)} leftIcon={<CheckCircleIcon className="w-4 h-4 text-green-600"/>} title="Mark as Paid" aria-label="Mark payroll as paid">Pay</Button>
                      }
                      <Button variant="danger" size="sm" onClick={() => handleDeleteEntry(entry.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label="Delete payroll entry">Del</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
         <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Payroll Entries Found</h2>
          <p className="text-secondary-500 mt-2">
             {filterStatus ? "No entries match the selected status." : "Start by adding payroll entries for staff."}
          </p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingEntry ? "Edit Payroll Entry" : "Add New Payroll Entry"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
          <Select label="Staff Member" id="payrollUserId" options={staffOptions} value={currentEntryData.userId || ''} onChange={e => handleInputChange('userId', e.target.value)} required />
          <Input label="Month (YYYY-MM)" id="payrollMonth" type="month" value={currentEntryData.month || ''} onChange={e => handleInputChange('month', e.target.value)} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Gross Salary ($)" id="grossSalary" type="number" value={currentEntryData.grossSalary || 0} onChange={e => handleInputChange('grossSalary', parseFloat(e.target.value))} required min="0" step="0.01"/>
            <Input label="Deductions ($)" id="deductions" type="number" value={currentEntryData.deductions || 0} onChange={e => handleInputChange('deductions', parseFloat(e.target.value))} min="0" step="0.01"/>
          </div>
          <Select label="Status" id="payrollStatus" options={statusOptionsForModal} value={currentEntryData.status || 'pending'} onChange={e => handleInputChange('status', e.target.value)} />
          {currentEntryData.status === 'paid' && (
            <Input label="Payment Date" id="paymentDate" type="date" value={currentEntryData.paymentDate || new Date().toISOString().split('T')[0]} onChange={e => handleInputChange('paymentDate', e.target.value)} />
          )}
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (editingEntry ? 'Saving...' : 'Adding...') : (editingEntry ? "Save Changes" : "Add Entry")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PayrollPage;
