
import React, { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord, UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { AttendanceIcon, CalendarIcon } from '../../assets/icons'; 
import Input from '../../components/common/Input';

const API_URL = 'http://localhost:3001/api';

const ViewAttendancePage: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(1); // First day of the current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]); // Today

  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchAttendance = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let url = `${API_URL}/attendance/my?startDate=${startDate}&endDate=${endDate}`;
      if (user.role === UserRole.PARENT && user.childUserId) {
         url = `${API_URL}/attendance/student/${user.childUserId}?startDate=${startDate}&endDate=${endDate}&isUserId=true`; 
      }

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch attendance records');
      const data: AttendanceRecord[] = await response.json();
      setAttendanceRecords(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load attendance records.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast, startDate, endDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'excused': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateSummary = () => {
    const summary = { present: 0, absent: 0, late: 0, excused: 0, total: attendanceRecords.length };
    attendanceRecords.forEach(record => {
      summary[record.status] = (summary[record.status] || 0) + 1;
    });
    return summary;
  };

  const summary = calculateSummary();
  const overallPercentage = summary.total > 0 ? ((summary.present + summary.late + summary.excused) / summary.total * 100).toFixed(1) : 'N/A';


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <AttendanceIcon className="w-8 h-8 mr-3 text-primary-600" />
          My Attendance Record
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <Input type="date" label="Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} containerClassName="mb-0" />
            <Input type="date" label="End Date" value={endDate} onChange={e => setEndDate(e.target.value)} containerClassName="mb-0" />
        </div>
      </div>

      {loading ? (
         <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading attendance...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg shadow text-center"><p className="text-2xl font-bold text-green-600">{summary.present}</p><p className="text-sm text-green-700">Present</p></div>
            <div className="bg-red-50 p-4 rounded-lg shadow text-center"><p className="text-2xl font-bold text-red-600">{summary.absent}</p><p className="text-sm text-red-700">Absent</p></div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow text-center"><p className="text-2xl font-bold text-yellow-600">{summary.late}</p><p className="text-sm text-yellow-700">Late</p></div>
            <div className="bg-blue-50 p-4 rounded-lg shadow text-center"><p className="text-2xl font-bold text-blue-600">{summary.excused}</p><p className="text-sm text-blue-700">Excused</p></div>
            <div className="bg-primary-50 p-4 rounded-lg shadow text-center"><p className="text-2xl font-bold text-primary-600">{overallPercentage}%</p><p className="text-sm text-primary-700">Overall</p></div>
          </div>

          {attendanceRecords.length > 0 ? (
            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {attendanceRecords.map(record => (
                      <tr key={record.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{record.className || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-secondary-500 max-w-md break-words">{record.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-xl shadow-md">
              <CalendarIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-secondary-700">No Attendance Records</h2>
              <p className="text-secondary-500 mt-2">No attendance records found for the selected period.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ViewAttendancePage;
