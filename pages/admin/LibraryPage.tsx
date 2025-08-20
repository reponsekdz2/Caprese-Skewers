
import React, { useState, useEffect, useCallback } from 'react';
import { LibraryBook } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { PlusIcon, EditIcon, DeleteIcon, LibraryIcon as PageIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const LibraryPage: React.FC = () => {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBookData, setCurrentBookData] = useState<Partial<LibraryBook>>({
    title: '',
    author: '',
    isbn: '',
    quantity: 1,
  });
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/library/books`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch books');
      const data: LibraryBook[] = await response.json();
      setBooks(data);
    } catch (error) {
      console.error("Fetch books error:", error);
      addToast({ type: 'error', message: 'Failed to load books.' });
    } finally {
      setLoading(false);
    }
  }, [addToast, getAuthHeaders]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleInputChange = (key: keyof Partial<LibraryBook>, value: string | number) => {
    setCurrentBookData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async () => {
    if (!currentBookData.title || !currentBookData.author || !currentBookData.isbn || currentBookData.quantity == null) {
      addToast({ type: 'error', message: 'Please fill all required book fields.' });
      return;
    }
    const method = editingBook ? 'PUT' : 'POST';
    const url = editingBook ? `${API_URL}/library/books/${editingBook.id}` : `${API_URL}/library/books`;
    
    setLoading(true);
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(currentBookData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingBook ? 'update' : 'add'} book`);
      }
      addToast({ type: 'success', message: `Book ${editingBook ? 'updated' : 'added'} successfully!` });
      fetchBooks();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
        setLoading(false);
    }
  };

  const openAddBookModal = () => {
    setEditingBook(null);
    setCurrentBookData({ title: '', author: '', isbn: '', quantity: 1 });
    setIsModalOpen(true);
  };

  const openEditBookModal = (book: LibraryBook) => {
    setEditingBook(book);
    setCurrentBookData({ 
        title: book.title, 
        author: book.author, 
        isbn: book.isbn, 
        quantity: book.quantity 
    });
    setIsModalOpen(true);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/library/books/${bookId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to delete book');
        }
        addToast({ type: 'success', message: 'Book deleted successfully.' });
        fetchBooks();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message });
      } finally {
          setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center"><PageIcon className="w-8 h-8 mr-2 text-primary-600" />Library Management</h1>
        <Button onClick={openAddBookModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>}>
          Add Book
        </Button>
      </div>

      {loading && books.length === 0 ? <p>Loading books...</p> : (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">ISBN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Total Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Available Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{book.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{book.author}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{book.isbn}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{book.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{book.availableQuantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button onClick={() => openEditBookModal(book)} variant="ghost" size="sm" leftIcon={<EditIcon className="w-4 h-4"/>}>Edit</Button>
                      <Button onClick={() => handleDeleteBook(book.id)} variant="danger" size="sm" leftIcon={<DeleteIcon className="w-4 h-4"/>}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {books.length === 0 && !loading && <p className="text-center text-secondary-500 py-8">No books found. Click "Add Book" to create one.</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingBook ? "Edit Book" : "Add New Book"}>
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
          <Input label="Title" id="bookTitle" value={currentBookData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} required />
          <Input label="Author" id="bookAuthor" value={currentBookData.author || ''} onChange={(e) => handleInputChange('author', e.target.value)} required />
          <Input label="ISBN" id="bookIsbn" value={currentBookData.isbn || ''} onChange={(e) => handleInputChange('isbn', e.target.value)} required disabled={!!editingBook /* ISBN might be non-editable */} />
          <Input label="Quantity" id="bookQuantity" type="number" value={currentBookData.quantity || ''} onChange={(e) => handleInputChange('quantity', parseInt(e.target.value, 10))} required min="0"/>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (editingBook ? 'Saving...' : 'Adding...') : (editingBook ? "Save Changes" : "Add Book")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LibraryPage;
