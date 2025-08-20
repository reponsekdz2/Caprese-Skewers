
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { LeaderboardEntry } from '../../types';
import Button from '../../components/common/Button';
import { LeaderboardIcon, TrophyIcon, UsersIcon as DefaultAvatarIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const LeaderboardPage: React.FC = () => {
  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'overall' | 'weekly'>('overall'); // Mock filter state

  const fetchLeaderboardData = useCallback(async () => {
    setLoading(true);
    try {
      // const response = await fetch(`${API_URL}/leaderboard?filter=${filter}`, { headers: getAuthHeaders() });
      // For now, ignoring filter as server doesn't implement it yet
      const response = await fetch(`${API_URL}/leaderboard`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch leaderboard data.');
      const data: LeaderboardEntry[] = await response.json();
      setLeaderboard(data);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load leaderboard.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast, filter]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900 border-yellow-500';
    if (rank === 2) return 'bg-gray-300 text-gray-800 border-gray-400';
    if (rank === 3) return 'bg-orange-400 text-orange-900 border-orange-500'; // Bronze
    return 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 border-secondary-200 dark:border-secondary-600';
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center">
          <LeaderboardIcon className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
          Student Leaderboard
        </h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button variant={filter === 'overall' ? 'primary' : 'secondary'} onClick={() => setFilter('overall')}>Overall</Button>
          <Button variant={filter === 'weekly' ? 'primary' : 'secondary'} onClick={() => setFilter('weekly')} disabled>This Week (WIP)</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Loading leaderboard...</p>
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden">
          <ul className="divide-y divide-secondary-200 dark:divide-dark-border">
            {leaderboard.map((entry, index) => (
              <li key={entry.studentId} className={`p-4 flex items-center space-x-4 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors duration-150 ${index < 3 ? 'border-l-4 ' + getRankColor(entry.rank).split(' ')[2] : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 ${getRankColor(entry.rank)}`}>
                  {entry.rank}
                </div>
                {entry.studentAvatar ? (
                  <img src={entry.studentAvatar} alt={entry.studentName} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                ) : (
                  <span className="w-12 h-12 rounded-full bg-secondary-200 dark:bg-secondary-600 flex items-center justify-center text-secondary-500 dark:text-secondary-300">
                    <DefaultAvatarIcon className="w-6 h-6" />
                  </span>
                )}
                <div className="flex-1">
                  <p className="text-md font-semibold text-secondary-800 dark:text-dark-text">{entry.studentName}</p>
                  {entry.badges && entry.badges.length > 0 && (
                     <div className="flex flex-wrap gap-1 mt-1">
                        {entry.badges.map(badge => (
                            <span key={badge} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{badge}</span>
                        ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{entry.points} XP</p>
                    {entry.rank <= 3 && <TrophyIcon className={`w-6 h-6 inline-block ml-2 ${getRankColor(entry.rank).split(' ')[1]}`} />}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl shadow-md">
          <LeaderboardIcon className="w-16 h-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">Leaderboard is Empty</h2>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2">No student data available to display on the leaderboard yet.</p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
