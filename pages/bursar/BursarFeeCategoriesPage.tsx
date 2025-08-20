
import React, { useState, useEffect, useCallback } from 'react';
import { FeeCategory } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { PlusIcon, EditIcon, DeleteIcon, FinanceIcon as PageIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const BursarFeeCategoriesPage: React.FC = () => {
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategoryData, setCurrentCategoryData] = useState<Partial<FeeCategory>>({
    name: '',
    description: '',
  });
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchFeeCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/finance/fee-categories`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch fee categories');
      const data: FeeCategory[] = await response.json();
      setFeeCategories(data);
    } catch (error) {
      console.error("Fetch fee categories error:", error);
      addToast({ type: 'error', message: 'Failed to load fee categories.' });
    } finally {
      setLoading(false);
    }
  }, [addToast, getAuthHeaders]);

  useEffect(() => {
    fetchFeeCategories();
  }, [fetchFeeCategories]);

  const handleInputChange = (key: keyof Partial<FeeCategory>, value: string) => {
    setCurrentCategoryData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async () => {
    if (!currentCategoryData.name) {
      addToast({ type: 'error', message: 'Fee category name is required.' });
      return;
    }
    
    setLoading(true);
    const method = editingCategory ? 'PUT' : 'POST';
    const url = editingCategory ? `${API_URL}/finance/fee-categories/${editingCategory.id}` : `${API_URL}/finance/fee-categories`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(currentCategoryData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingCategory ? 'update' : 'add'} fee category`);
      }
      addToast({ type: 'success', message: `Fee category ${editingCategory ? 'updated' : 'added'} successfully!` });
      fetchFeeCategories();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setCurrentCategoryData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (category: FeeCategory) => {
    setEditingCategory(category);
    setCurrentCategoryData(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this fee category? This might affect existing fee structures.')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/finance/fee-categories/${categoryId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to delete fee category');
        }
        addToast({ type: 'success', message: 'Fee category deleted successfully.' });
        fetchFeeCategories();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message });
      } finally {
          setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center"><PageIcon className="w-8 h-8 mr-2 text-primary-600" />Manage Fee Categories</h1>
        <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto">
          Add New Category
        </Button>
      </div>

      {loading && feeCategories.length === 0 ? <p className="text-center py-8">Loading fee categories...</p> : (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Category Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {feeCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{cat.name}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-500 max-w-md break-words" title={cat.description}>{cat.description || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button onClick={() => openEditModal(cat)} variant="ghost" size="sm" leftIcon={<EditIcon className="w-4 h-4"/>}>Edit</Button>
                      <Button onClick={() => handleDelete(cat.id)} variant="danger" size="sm" leftIcon={<DeleteIcon className="w-4 h-4"/>}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {feeCategories.length === 0 && !loading && <p className="text-center text-secondary-500 py-8">No fee categories defined yet.</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCategory ? "Edit Fee Category" : "Add New Fee Category"}>
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
          <Input label="Category Name" id="categoryName" value={currentCategoryData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} required />
          <Input label="Description (Optional)" id="categoryDescription" type="textarea" value={currentCategoryData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} />
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (editingCategory ? 'Saving...' : 'Adding...') : (editingCategory ? "Save Changes" : "Add Category")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BursarFeeCategoriesPage;
