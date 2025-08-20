
import React, { useState, useEffect, useCallback } from 'react';
import { Meeting } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/common/Input';
import { ClipboardCheckIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const MeetingAttendanceReportPage: React.FC = () => {
  const [reportData, setReportData] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterTeacherName, setFilterTeacherName] = useState('');
  const [filterParentName, setFilterParentName] = useState('');
  const [filterAttendance, setFilterAttendance] = useState<'all' | 'attended' | 'not_attended'>('all');

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchMeetingReport = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, filters would be query params to the API
      const response = await fetch(`${API_URL}/meetings/attendance-report`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch meeting attendance report');
      const data: Meeting[] = await response.json();
      setReportData(data);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load report.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchMeetingReport();
  }, [fetchMeetingReport]);

  const filteredReportData = reportData.filter(meeting => {
    const meetingDate = new Date(meeting.proposedDate);
    const startDate = filterDateStart ? new Date(filterDateStart) : null;
    const endDate = filterDateEnd ? new Date(filterDateEnd) : null;

    if (startDate && meetingDate < startDate) return false;
    if (endDate) {
        const nextDayOfEndDate = new Date(endDate); // To include meetings on the end date
        nextDayOfEndDate.setDate(endDate.getDate() + 1);
        if (meetingDate >= nextDayOfEndDate) return false;
    }
    if (filterTeacherName && !meeting.teacherName?.toLowerCase().includes(filterTeacherName.toLowerCase())) return false;
    if (filterParentName && !meeting.parentName?.toLowerCase().includes(filterParentName.toLowerCase())) return false;
    if (filterAttendance === 'attended' && !meeting.attendedByParent) return false;
    if (filterAttendance === 'not_attended' && meeting.attendedByParent) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <ClipboardCheckIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" />
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text">Meeting Attendance Report</h1>
      </div>

      <div className="bg-white dark:bg-dark-card shadow-md rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input type="date" label="Start Date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} containerClassName="mb-0" />
        <Input type="date" label="End Date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} containerClassName="mb-0" />
        <Input label="Filter by Teacher" placeholder="Teacher name..." value={filterTeacherName} onChange={e => setFilterTeacherName(e.target.value)} containerClassName="mb-0" />
        <Input label="Filter by Parent" placeholder="Parent name..." value={filterParentName} onChange={e => setFilterParentName(e.target.value)} containerClassName="mb-0" />
        <div>
            <label htmlFor="filterAttendance" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Attendance Status</label>
            <select id="filterAttendance" value={filterAttendance} onChange={e => setFilterAttendance(e.target.value as any)} className="mt-1 block w-full p-2 border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:text-dark-text">
                <option value="all">All</option>
                <option value="attended">Attended</option>
                <option value="not_attended">Not Attended</option>
            </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div><p className="mt-2 dark:text-secondary-400">Loading report...</p></div>
      ) : filteredReportData.length > 0 ? (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-dark-border">
              <thead className="bg-secondary-50 dark:bg-secondary-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Parent</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Teacher</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Student</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Attended</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Attended Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Teacher Notes</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Child Visit</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-secondary-200 dark:divide-dark-border">
                {filteredReportData.map(m => (
                  <tr key={m.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                    <td className="px-4 py-2 text-sm whitespace-nowrap dark:text-secondary-300">{new Date(m.proposedDate).toLocaleDateString()} {m.proposedTime}</td>
                    <td className="px-4 py-2 text-sm dark:text-dark-text">{m.parentName}</td>
                    <td className="px-4 py-2 text-sm dark:text-dark-text">{m.teacherName}</td>
                    <td className="px-4 py-2 text-sm dark:text-dark-text">{m.studentName || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.attendedByParent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {m.attendedByParent ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap dark:text-secondary-300">{m.parentAttendedTime ? new Date(m.parentAttendedTime).toLocaleString() : 'N/A'}</td>
                    <td className="px-4 py-2 text-sm whitespace-pre-wrap max-w-xs dark:text-secondary-300" title={m.notesByTeacher}>{m.notesByTeacher || '-'}</td>
                    <td className="px-4 py-2 text-sm whitespace-pre-wrap max-w-xs dark:text-secondary-300" title={m.childVisitDetails}>{m.childVisitDetails || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-center py-10 dark:text-secondary-400">No meeting records match the current filters.</p>
      )}
    </div>
  );
};

export default MeetingAttendanceReportPage;
