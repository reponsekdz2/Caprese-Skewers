
import React, { useState, useEffect, useCallback } from 'react';
import { TimetableSlot, UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { TimetableIcon, CalendarIcon } from '../../assets/icons';
import Button from '../../components/common/Button';

const API_URL = 'http://localhost:3001/api';

const daysOfWeek: TimetableSlot['dayOfWeek'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MyTimetablePage: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<TimetableSlot['dayOfWeek'] | 'All'>(new Date().toLocaleDateString('en-US', { weekday: 'long' }) as TimetableSlot['dayOfWeek'] || 'Monday');
  
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchTimetable = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Endpoint needs to be user-aware (student, teacher, etc.)
      // The server will use the authenticated user's ID/role to fetch the relevant timetable.
      const response = await fetch(`${API_URL}/timetable/my`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch your timetable');
      const data: TimetableSlot[] = await response.json();
      setTimetable(data);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load your timetable.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const filteredTimetable = timetable
    .filter(slot => selectedDay === 'All' || slot.dayOfWeek === selectedDay)
    .sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) {
            return daysOfWeek.indexOf(a.dayOfWeek) - daysOfWeek.indexOf(b.dayOfWeek);
        }
        return a.startTime.localeCompare(b.startTime);
    });

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <TimetableIcon className="w-8 h-8 mr-3 text-primary-600" />
          My Timetable
        </h1>
        <div className="flex space-x-1 sm:space-x-2 mt-4 sm:mt-0 overflow-x-auto pb-2">
            {['All', ...daysOfWeek].map(day => (
                 <Button
                    key={day}
                    variant={selectedDay === day ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedDay(day as TimetableSlot['dayOfWeek'] | 'All')}
                    className="flex-shrink-0 px-2 py-1 sm:px-3 sm:py-1.5"
                 >
                    {day}
                 </Button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading your timetable...</p>
        </div>
      ) : filteredTimetable.length > 0 ? (
        <div className="space-y-6">
          {(selectedDay === 'All' ? daysOfWeek : [selectedDay]).map(day => {
            const daySlots = filteredTimetable.filter(slot => slot.dayOfWeek === day);
            if (daySlots.length === 0 && selectedDay !== 'All' && selectedDay !== day) return null; 
            if (daySlots.length === 0 && selectedDay === 'All') return null;


            return (
              <div key={day}>
                {(selectedDay === 'All' || selectedDay === day) && daySlots.length > 0 && <h2 className="text-xl font-semibold text-primary-700 mb-3 border-b pb-1">{day}</h2>}
                {daySlots.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {daySlots.map(slot => (
                      <div key={slot.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                        <p className="text-lg font-semibold text-secondary-800">{slot.subject}</p>
                        <p className="text-sm text-primary-600">{slot.startTime} - {slot.endTime}</p>
                        {user?.role === UserRole.STUDENT && <p className="text-sm text-secondary-500">Teacher: {slot.teacherName || 'N/A'}</p>}
                        {(user?.role === UserRole.TEACHER || user?.role === UserRole.STAFF) && <p className="text-sm text-secondary-500">Class: {slot.className || 'N/A'}</p>}
                        {/* Add location if available */}
                      </div>
                    ))}
                  </div>
                ) : (
                  (selectedDay === day && daySlots.length === 0) && <p className="text-secondary-500 italic py-4">No classes scheduled for {day}.</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <CalendarIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Timetable Information</h2>
          <p className="text-secondary-500 mt-2">Your timetable is not available or no classes are scheduled for the selected day.</p>
        </div>
      )}
    </div>
  );
};

export default MyTimetablePage;
