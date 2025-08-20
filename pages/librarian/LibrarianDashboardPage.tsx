import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LibraryIcon, ReportIcon, PlusIcon, ArrowRightIcon } from '../../assets/icons';
import { Link } from 'react-router-dom'; // Changed import
import { LibraryBook } from '../../types';
import { useToast } from '../../hooks/useToast';
import WidgetCard from '../../components/common/WidgetCard';
import DashboardStatCard from '../../components/common/DashboardStatCard';
import Button from '../../components/common/Button';

interface LibrarianDashboardData {
    totalBooks: number;
    booksBorrowed: number;
    booksOverdue: number;
    recentlyAdded: LibraryBook[];
}

const API_URL = 'http://localhost:3001/api';

const LibrarianDashboardPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const [dashboardData, setDashboardData] = useState<LibrarianDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dashboard/librarian/${user.id}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch librarian dashboard data');
      const data: LibrarianDashboardData = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Fetch librarian dashboard error:", error);
      addToast({ type: 'error', message: 'Could not load your dashboard.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  if (!dashboardData) {
    return <div className="text-center py-10">Failed to load dashboard data. Please try again later.</div>;
  }

  const { totalBooks, booksBorrowed, booksOverdue, recentlyAdded } = dashboardData;

  const statCards = [
    {id: 'total-books', title: "Total Books", value: totalBooks, icon: LibraryIcon, bgColorClass: 'bg-gradient-to-br from-indigo-500 to-indigo-600', linkTo: '/librarian/books'},
    {id: 'books-borrowed', title: "Books Currently Borrowed", value: booksBorrowed, icon: ReportIcon, bgColorClass: 'bg-gradient-to-br from-blue-500 to-blue-600', linkTo: '/librarian/transactions'},
    {id: 'books-overdue', title: "Books Overdue", value: booksOverdue, icon: ReportIcon, bgColorClass: 'bg-gradient-to-br from-red-500 to-red-600', linkTo: '/librarian/transactions?filter=overdue'}
  ];
  
  return (
    <div className="container mx-auto space-y-6 sm:space-y-8 p-4">
      <div className="flex items-center">
        <LibraryIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mr-3 sm:mr-4" />
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800">Librarian's Desk</h1>
            {user && <p className="text-secondary-600 text-sm sm:text-base">Welcome, {user.name}!</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map(stat => <DashboardStatCard key={stat.id} {...stat} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetCard title="Quick Actions" size="medium" className="lg:col-span-1">
            <div className="space-y-3">
                <Link to="/librarian/books"> {/* Changed usage */}
                    <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<PlusIcon className="w-5 h-5"/>}>Add New Book</Button>
                </Link> {/* Changed usage */}
                <Link to="/librarian/transactions"> {/* Changed usage */}
                    <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<ReportIcon className="w-5 h-5"/>}>Issue / Return Book</Button>
                </Link> {/* Changed usage */}
                 <Link to="/librarian/books"> {/* Changed usage */}
                     <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<LibraryIcon className="w-5 h-5"/>}>Manage All Books</Button>
                </Link> {/* Changed usage */}
            </div>
        </WidgetCard>
        
        <WidgetCard title="Recently Added Books" size="large" className="lg:col-span-2">
            {recentlyAdded && recentlyAdded.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {recentlyAdded.map(book => (
                        <div key={book.id} className="border border-secondary-200 rounded-lg p-3 hover:shadow-lg transition-shadow flex flex-col items-center text-center">
                            <img
                                src={book.coverImageUrl || `https://via.placeholder.com/100x150.png?text=No+Image`}
                                alt={book.title}
                                className="w-24 h-36 object-cover rounded mb-2 shadow-md"
                            />
                            <h4 className="font-semibold text-sm text-secondary-800 truncate w-full" title={book.title}>{book.title}</h4>
                            <p className="text-xs text-secondary-500 truncate w-full" title={book.author}>{book.author}</p>
                        </div>
                    ))}
                </div>
            ) : <p className="text-secondary-500">No books added recently.</p>}
            <Link to="/librarian/books" className="block mt-4 text-right"> {/* Changed usage */}
                <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>View All Books</Button>
            </Link> {/* Changed usage */}
        </WidgetCard>
      </div>
       <p className="mt-8 text-center text-sm text-secondary-500">Managing the world of books. More features on the way!</p>
    </div>
  );
};

export default LibrarianDashboardPage;