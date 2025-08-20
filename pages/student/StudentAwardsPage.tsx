import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Award } from '../../types';
import { AwardIcon, HomeIcon, StudentIcon as PageStudentIcon } from '../../assets/icons';
import { useToast } from '../../hooks/useToast';
import { Link } from 'react-router-dom'; // Changed import
import Button from '../../components/common/Button';


const API_URL = 'http://localhost:3001/api';

const AwardCard: React.FC<{ award: Award }> = ({ award }) => {
    let DisplayIcon = AwardIcon;

    return (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6 flex flex-col items-center text-center transform transition-all hover:shadow-2xl dark:hover:shadow-primary-500/30 hover:scale-105 animate-slideInUp">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-700 dark:bg-opacity-40 rounded-full mb-4">
                <DisplayIcon className="w-12 h-12 text-yellow-600 dark:text-yellow-300" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-800 dark:text-dark-text mb-1">{award.name}</h3>
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-2">Awarded on: {new Date(award.dateAwarded).toLocaleDateString()}</p>
            <p className="text-secondary-600 dark:text-secondary-300 text-sm flex-grow">{award.description}</p>
            {award.awardedBy && <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-3">Presented by: {award.awardedBy}</p>}
        </div>
    );
};

const StudentAwardsPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchAwards = useCallback(async () => {
    if (!user || user.role !== 'Student') {
        addToast({ type: 'error', message: 'Not authorized or student details not found.' });
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
      // Server uses the authenticated user's ID (user.id) if role is Student
      const response = await fetch(`${API_URL}/awards/student/${user.id}`, { headers: getAuthHeaders() });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch awards. Server returned non-JSON response.' }));
        throw new Error(errorData.message || 'Failed to fetch awards.');
      }
      const data: Award[] = await response.json();
      setAwards(data.sort((a,b) => new Date(b.dateAwarded).getTime() - new Date(a.dateAwarded).getTime()));
    } catch (error: any) {
      console.error('Failed to fetch awards:', error);
      addToast({ type: 'error', message: error.message || 'Could not load your awards.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchAwards();
  }, [fetchAwards]);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <div className="flex items-center mb-4 sm:mb-0">
            <AwardIcon className="w-10 h-10 text-primary-600 dark:text-primary-400 mr-3" />
            <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text">My Awards & Achievements</h1>
        </div>
        <Link to="/student/dashboard"> {/* Changed usage */}
            <Button variant="secondary" size="sm" leftIcon={<HomeIcon className="w-4 h-4"/>}>
                Back to Dashboard
            </Button>
        </Link> {/* Changed usage */}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500 dark:border-primary-400"></div>
          <p className="ml-4 text-secondary-600 dark:text-secondary-400">Loading your awards...</p>
        </div>
      ) : awards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {awards.map((award) => (
            <AwardCard key={award.id} award={award} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl shadow-md">
          <PageStudentIcon className="w-16 h-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">No Awards Yet!</h2>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2">Keep up the great work! Your achievements will be recognized here.</p>
        </div>
      )}
    </div>
  );
};

export default StudentAwardsPage;