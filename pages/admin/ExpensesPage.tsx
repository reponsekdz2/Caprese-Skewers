
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Expense } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { ReportIcon as PageIcon, PlusIcon, EditIcon, DeleteIcon, UploadIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExpenseData, setCurrentExpenseData] = useState<Partial<Expense>>({
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    vendor: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/finance/expenses`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data: Expense[] = await response.json();
      setExpenses(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load expenses.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleInputChange = (key: keyof Partial<Expense>, value: string | number) => {
    setCurrentExpenseData(prev => ({ ...prev, [key]: value }));
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setReceiptFile(event.target.files[0]);
    } else {
      setReceiptFile(null);
    }
  };

  const handleFormSubmit = async () => {
    if (!currentExpenseData.category || !currentExpenseData.description || currentExpenseData.amount == null || Number(currentExpenseData.amount) <= 0 || !currentExpenseData.date) {
      addToast({ type: 'error', message: 'Category, Description, valid Amount, and Date are required.' });
      return;
    }
    
    const formData = new FormData();
    formData.append('category', currentExpenseData.category);
    formData.append('description', currentExpenseData.description);
    formData.append('amount', String(Number(currentExpenseData.amount)));
    formData.append('date', currentExpenseData.date);
    if(currentExpenseData.vendor) formData.append('vendor', currentExpenseData.vendor);
    if (receiptFile) {
        formData.append('receiptFile', receiptFile);
    }


    setLoading(true);
    const method = editingExpense ? 'PUT' : 'POST';
    const url = editingExpense ? `${API_URL}/finance/expenses/${editingExpense.id}` : `${API_URL}/finance/expenses`;
    
    try {
      const headers = {...getAuthHeaders()}; // Clone to avoid modifying original from useAuth
      delete headers['Content-Type']; // Let browser set Content-Type for FormData
      
      const response = await fetch(url, {
        method,
        headers,
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingExpense ? 'update' : 'add'} expense`);
      }
      addToast({ type: 'success', message: `Expense ${editingExpense ? 'updated' : 'added'} successfully!` });
      fetchExpenses();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setCurrentExpenseData({ category: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0], vendor: '' });
    setReceiptFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setCurrentExpenseData(expense);
    setReceiptFile(null); 
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/finance/expenses/${expenseId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete expense');
        addToast({ type: 'success', message: 'Expense deleted successfully.' });
        fetchExpenses();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message || 'Could not delete expense.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setReceiptFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const filteredExpenses = expenses.filter(exp => 
    (!filterCategory || exp.category.toLowerCase().includes(filterCategory.toLowerCase()))
  );
  
  const uniqueCategories = [...new Set(expenses.map(exp => exp.category))];
  const categoryOptionsForFilter = [{value: '', label: 'All Categories'}, ...uniqueCategories.map(cat => ({value: cat, label: cat}))];
  // Example categories for modal, could be dynamic from existing data or predefined
  const categoryOptionsForModal = [
    {value: 'Utilities', label: 'Utilities'}, {value: 'Supplies', label: 'Supplies'},
    {value: 'Maintenance', label: 'Maintenance'}, {value: 'Salaries', label: 'Salaries'},
    {value: 'Events', label: 'Events'}, {value: 'Other', label: 'Other'},
  ];


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Expense Management
        </h1>
        <div className="flex gap-2 mt-4 sm:mt-0 items-end">
            <Select
                label="Filter by Category"
                options={categoryOptionsForFilter}
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                containerClassName="mb-0 min-w-[200px]"
                className="mt-0"
            />
            <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>}>
                Add Expense
            </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading expenses...</div>
      ) : filteredExpenses.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Receipt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{expense.category}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm font-medium text-secondary-900 max-w-sm break-words" title={expense.description}>{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">${expense.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{expense.vendor || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {expense.receiptUrl ? <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a> : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(expense)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label={`Edit ${expense.description}`}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteExpense(expense.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label={`Delete ${expense.description}`}>Delete</Button>
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
          <h2 className="text-xl font-semibold text-secondary-700">No Expenses Logged</h2>
          <p className="text-secondary-500 mt-2">
            {filterCategory ? "No expenses match the selected category." : "Start by adding expense records."}
          </p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingExpense ? "Edit Expense" : "Add New Expense"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
          <Input label="Date of Expense" id="expenseDate" type="date" value={currentExpenseData.date || ''} onChange={e => handleInputChange('date', e.target.value)} required />
          <Select label="Category" id="category" options={categoryOptionsForModal} value={currentExpenseData.category || ''} onChange={e => handleInputChange('category', e.target.value)} required />
          <Input label="Description" id="description" type="textarea" rows={3} value={currentExpenseData.description || ''} onChange={e => handleInputChange('description', e.target.value)} required />
          <Input label="Amount ($)" id="amount" type="number" value={currentExpenseData.amount || 0} onChange={e => handleInputChange('amount', parseFloat(e.target.value))} required min="0.01" step="0.01"/>
          <Input label="Vendor/Payee (Optional)" id="vendor" value={currentExpenseData.vendor || ''} onChange={e => handleInputChange('vendor', e.target.value)} />
          <div className="mt-4">
            <label htmlFor="receiptFile" className="block text-sm font-medium text-secondary-700">
                Upload Receipt (Optional)
            </label>
            <input
              type="file"
              id="receiptFile"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="mt-1 block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {receiptFile && <p className="text-xs text-secondary-500 mt-1">Selected: {receiptFile.name}</p>}
            {editingExpense && editingExpense.receiptUrl && !receiptFile && <p className="text-xs text-secondary-500 mt-1">Current receipt: <a href={editingExpense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Receipt</a>. Upload new to replace.</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading} leftIcon={<UploadIcon className="w-4 h-4"/>}>
              {loading ? (editingExpense ? 'Saving...' : 'Adding...') : (editingExpense ? "Save Changes" : "Add Expense")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
