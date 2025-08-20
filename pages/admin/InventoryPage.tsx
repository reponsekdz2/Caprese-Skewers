
import React, { useState, useEffect, useCallback } from 'react';
import { InventoryItem } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { InventoryIcon as PageIcon, PlusIcon, EditIcon, DeleteIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const InventoryPage: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItemData, setCurrentItemData] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    quantity: 0,
    location: '',
    supplier: '',
  });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchInventoryItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/inventory`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch inventory items');
      const data: InventoryItem[] = await response.json();
      setInventoryItems(data);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load inventory.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchInventoryItems();
  }, [fetchInventoryItems]);

  const handleInputChange = (key: keyof Partial<InventoryItem>, value: string | number) => {
    setCurrentItemData(prev => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async () => {
    if (!currentItemData.name || !currentItemData.category || currentItemData.quantity == null || Number(currentItemData.quantity) < 0) {
      addToast({ type: 'error', message: 'Item Name, Category, and a valid Quantity are required.' });
      return;
    }
    
    const payload = { ...currentItemData, quantity: Number(currentItemData.quantity) };

    setLoading(true);
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/inventory/${editingItem.id}` : `${API_URL}/inventory`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingItem ? 'update' : 'add'} item`);
      }
      addToast({ type: 'success', message: `Item ${editingItem ? 'updated' : 'added'} successfully!` });
      fetchInventoryItems();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false); // Ensure loading is set to false in finally
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setCurrentItemData({ name: '', category: '', quantity: 0, location: '', supplier: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setCurrentItemData(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/inventory/${itemId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete item');
        addToast({ type: 'success', message: 'Item deleted successfully.' });
        fetchInventoryItems();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message || 'Could not delete item.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };
  
  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Inventory Management
        </h1>
         <div className="flex gap-2 mt-4 sm:mt-0 items-end">
            <Input 
                id="inventorySearch"
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                containerClassName="mb-0"
                className="mt-0"
            />
            <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>}>
            Add Item
            </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading inventory...</div>
      ) : filteredItems.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{item.location || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{item.supplier || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(item)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label={`Edit ${item.name}`}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteItem(item.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label={`Delete ${item.name}`}>Delete</Button>
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
          <h2 className="text-xl font-semibold text-secondary-700">Inventory is Empty</h2>
          <p className="text-secondary-500 mt-2">
            {searchTerm ? "No items match your search." : "Add items to start tracking your school's inventory."}
          </p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? "Edit Inventory Item" : "Add New Inventory Item"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
          <Input label="Item Name" id="itemName" value={currentItemData.name || ''} onChange={e => handleInputChange('name', e.target.value)} required />
          <Input label="Category" id="category" value={currentItemData.category || ''} onChange={e => handleInputChange('category', e.target.value)} required placeholder="e.g., Stationery, Furniture, Lab Equipment"/>
          <Input label="Quantity" id="quantity" type="number" value={currentItemData.quantity || 0} onChange={e => handleInputChange('quantity', parseInt(e.target.value, 10))} required min="0"/>
          <Input label="Location (Optional)" id="location" value={currentItemData.location || ''} onChange={e => handleInputChange('location', e.target.value)} placeholder="e.g., Store Room A, Principal's Office"/>
          <Input label="Supplier (Optional)" id="supplier" value={currentItemData.supplier || ''} onChange={e => handleInputChange('supplier', e.target.value)} />
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (editingItem ? 'Saving...' : 'Adding...') : (editingItem ? "Save Changes" : "Add Item")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
