
import React, { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord, Student, SchoolClass } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input'; 
import { AttendanceIcon as PageIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

const AttendancePage: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: AttendanceStatus; remarks?: string }>>({}); 
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false); // General loading for classes
  const [loadingStudents, setLoadingStudents] = useState(false); // For students and their attendance
  const [submitting, setSubmitting] = useState(false);


  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchClasses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Admins see all classes, Teachers see their assigned classes
      const endpoint = user.role === 'Admin' ? `${API_URL}/classes` : `${API_URL}/classes?teacherId=${user.id}`;
      const response = await fetch(endpoint, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch classes');
      const data: SchoolClass[] = await response.json();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id); 
      }
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load classes.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast, selectedClassId]);
  
  const fetchStudentsAndAttendance = useCallback(async (classId: string, date: string) => {
    if (!classId || !date) {
      setStudentsInClass([]);
      setAttendanceData({});
      return;
    }
    setLoadingStudents(true);
    try {
      const studentsResponse = await fetch(`${API_URL}/students?classId=${classId}`, { headers: getAuthHeaders() });
      if (!studentsResponse.ok) throw new Error('Failed to fetch students for the class');
      const studentsData: Student[] = await studentsResponse.json();
      setStudentsInClass(studentsData);

      // Fetch existing attendance for these students on the selected date
      const attendanceResponse = await fetch(`${API_URL}/attendance/class/${classId}/date/${date}`, { headers: getAuthHeaders() });
      let existingRecords: AttendanceRecord[] = [];
      if (attendanceResponse.ok) {
        existingRecords = await attendanceResponse.json();
      } else {
        console.warn(`Could not fetch existing attendance for ${classId} on ${date}. Defaulting to 'present'.`);
      }
      
      const initialData: Record<string, { status: AttendanceStatus; remarks?: string }> = {};
      studentsData.forEach(student => {
          const existing = existingRecords.find(r => r.studentId === student.id);
          initialData[student.id] = { status: existing?.status || 'present', remarks: existing?.remarks || '' };
      });
      setAttendanceData(initialData);

    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load students or attendance.' });
      setStudentsInClass([]);
      setAttendanceData({});
    } finally {
      setLoadingStudents(false);
    }
  }, [getAuthHeaders, addToast]);


  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      fetchStudentsAndAttendance(selectedClassId, selectedDate);
    }
  }, [selectedClassId, selectedDate, fetchStudentsAndAttendance]);


  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: { ...prev[studentId], remarks } }));
  };
  
  const markAll = (status: AttendanceStatus) => {
    const newAttendanceData = { ...attendanceData };
    studentsInClass.forEach(student => {
        newAttendanceData[student.id] = { ...newAttendanceData[student.id], status, remarks: newAttendanceData[student.id]?.remarks || '' };
    });
    setAttendanceData(newAttendanceData);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClassId || !selectedDate || Object.keys(attendanceData).length === 0) {
      addToast({ type: 'warning', message: 'Please select a class, date, and mark attendance.' });
      return;
    }
    setSubmitting(true);
    const recordsToSubmit = Object.entries(attendanceData).map(([studentId, data]) => ({
      studentId,
      date: selectedDate,
      status: data.status,
      classId: selectedClassId,
      remarks: data.remarks || '',
    }));

    try {
      const response = await fetch(`${API_URL}/attendance/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(recordsToSubmit),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to save attendance.');
      }
      addToast({ type: 'success', message: 'Attendance saved successfully!' });
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
    }
  };
  
  const classOptions = classes.map(c => ({ value: c.id, label: c.name }));
  const statusOptions: { value: AttendanceStatus, label: string }[] = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'excused', label: 'Excused' },
  ];


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Record Attendance
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
          <Select label="Class" options={classOptions} value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} containerClassName="mb-0 min-w-[150px]" />
          <Input type="date" label="Date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} containerClassName="mb-0" />
        </div>
      </div>

      {loading && <p className="text-center">Loading classes...</p>}
      
      {selectedClassId && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => markAll('present')} variant="ghost" className="border border-green-500 text-green-600 hover:bg-green-50">Mark All Present</Button>
            <Button size="sm" onClick={() => markAll('absent')} variant="ghost" className="border border-red-500 text-red-600 hover:bg-red-50">Mark All Absent</Button>
          </div>
          {loadingStudents ? <p className="text-center py-6">Loading students...</p> : (
            studentsInClass.length > 0 ? (
              <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {studentsInClass.map(student => (
                        <tr key={student.id} className="hover:bg-secondary-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{student.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{student.studentId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Select 
                                options={statusOptions} 
                                value={attendanceData[student.id]?.status || 'present'} 
                                onChange={e => handleAttendanceChange(student.id, e.target.value as AttendanceStatus)}
                                className="mt-0 w-32" 
                                containerClassName="mb-0"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Input 
                                type="text" 
                                value={attendanceData[student.id]?.remarks || ''}
                                onChange={e => handleRemarksChange(student.id, e.target.value)}
                                placeholder="Optional remarks"
                                className="mt-0 w-full"
                                containerClassName="mb-0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-center py-6 text-secondary-600">No students found in this class. Please add students via Student Management.</p>
            )
          )}
          {studentsInClass.length > 0 && (
            <div className="mt-6 text-right">
              <Button onClick={handleSubmitAttendance} disabled={loadingStudents || submitting} variant="primary">
                {submitting ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendancePage;
