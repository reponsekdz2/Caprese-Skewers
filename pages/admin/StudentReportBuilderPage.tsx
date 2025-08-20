import React, { useState, useEffect, useCallback } from 'react';
import { Student, Mark, Incident, TeacherComment, Award, StudentReportData, SchoolClass, User, AttendanceRecord } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { ReportIcon, StudentIcon as PageIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const StudentReportBuilderPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [reportData, setReportData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(false); // Loading for initial student list
  const [generatingReport, setGeneratingReport] = useState(false);

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch(`${API_URL}/students`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/classes`, { headers: getAuthHeaders() })
      ]);
      if (!studentsRes.ok) throw new Error('Failed to fetch students list');
      if (!classesRes.ok) throw new Error('Failed to fetch classes list');
      
      setStudents(await studentsRes.json());
      setSchoolClasses(await classesRes.json());

    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load initial data.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleGenerateReport = async () => {
    if (!selectedStudentId) {
      addToast({ type: 'warning', message: 'Please select a student.' });
      return;
    }
    setGeneratingReport(true);
    setReportData(null); 
    try {
      const student = students.find(s => s.id === selectedStudentId);
      if (!student || !student.userId) throw new Error("Selected student or student's user ID not found.");

      // Fetch all necessary data for the report
      // This mimics a backend endpoint /api/reports/student/:studentId that compiles this data
      const [userRes, marksRes, attendanceRes, incidentsRes, commentsRes, awardsRes] = await Promise.all([
        fetch(`${API_URL}/users/${student.userId}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/student/${student.id}/marks`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/attendance/student/${student.id}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/discipline/incidents/student/${student.id}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/teacher/comments/student/${student.id}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/awards/student/${student.userId}`, { headers: getAuthHeaders() }) // Assuming awards are linked via userId
      ]);

      // Check all responses
      if(!userRes.ok) throw new Error("Failed to fetch user data for report.");
      if(!marksRes.ok) throw new Error("Failed to fetch marks for report.");
      if(!attendanceRes.ok) throw new Error("Failed to fetch attendance for report.");
      if(!incidentsRes.ok) throw new Error("Failed to fetch incidents for report.");
      if(!commentsRes.ok) throw new Error("Failed to fetch comments for report.");
      if(!awardsRes.ok) throw new Error("Failed to fetch awards for report.");

      const attendanceRecords: AttendanceRecord[] = await attendanceRes.json();
      const totalDays = attendanceRecords.length;
      const present = attendanceRecords.filter(r => r.status === 'present').length;
      const absent = attendanceRecords.filter(r => r.status === 'absent').length;
      const late = attendanceRecords.filter(r => r.status === 'late').length;
      const excused = attendanceRecords.filter(r => r.status === 'excused').length;
      const percentage = totalDays > 0 ? Math.round(((present + late + excused) / totalDays) * 100) : 0;


      const compiledReport: StudentReportData = {
        student: student,
        user: await userRes.json(),
        marks: await marksRes.json(),
        attendanceSummary: { present, absent, late, excused, totalDays, percentage },
        incidents: await incidentsRes.json(),
        teacherComments: await commentsRes.json(),
        awards: await awardsRes.json(),
      };
      
      setReportData(compiledReport);
      addToast({type: 'success', message: `Report generated for ${student.name}`});

    } catch (error: any) {
      console.error("Report generation error:", error);
      addToast({ type: 'error', message: error.message || 'Failed to generate report.' });
    } finally {
      setGeneratingReport(false);
    }
  };
  
  const studentOptions = [{value: '', label: 'Select a Student'}, ...students.map(s => ({ value: s.id, label: `${s.name} (${s.studentId}) - Grade: ${s.grade}`}))];

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Student Report Builder
        </h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <Select 
            label="Select Student"
            options={studentOptions}
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            containerClassName="flex-grow mb-0"
            disabled={loading || students.length === 0}
          />
          <Button onClick={handleGenerateReport} disabled={!selectedStudentId || generatingReport || loading} className="w-full sm:w-auto">
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {generatingReport && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Generating report...</p>
        </div>
      )}

      {reportData && (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl print-area">
          <header className="text-center border-b-2 border-primary-500 pb-4 mb-6">
            <h2 className="text-3xl font-bold text-primary-700">Student Performance Report</h2>
            <p className="text-secondary-600 text-lg">Sunshine Academy</p> {/* Placeholder */}
            <p className="text-sm text-secondary-500">Report Generated: {new Date().toLocaleDateString()}</p>
          </header>

          <section className="mb-6 p-4 border rounded-md bg-secondary-50">
            <h3 className="text-xl font-semibold text-secondary-800 mb-3 border-b pb-1">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <p><strong>Name:</strong> {reportData.student.name}</p>
              <p><strong>Student ID:</strong> {reportData.student.studentId}</p>
              <p><strong>Grade:</strong> {reportData.student.grade}</p>
              <p><strong>Class:</strong> {schoolClasses.find(sc => sc.id === reportData.student.classId)?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {reportData.user.email || 'N/A'}</p>
              <p><strong>Date of Birth:</strong> {reportData.user.dateOfBirth ? new Date(reportData.user.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="text-xl font-semibold text-secondary-800 mb-3 border-b pb-1">Academic Performance</h3>
            {reportData.marks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border rounded-md">
                  <thead className="bg-secondary-100"><tr><th className="p-2 border text-left">Exam/Subject</th><th className="p-2 border text-right">Marks (%)</th><th className="p-2 border text-left">Comments</th></tr></thead>
                  <tbody>{reportData.marks.map(m => (
                    <tr key={m.id} className="border-t">
                      <td className="p-2 border">{m.examName || 'N/A'}</td>
                      <td className="p-2 border text-right font-semibold">{m.marksObtained !== null ? `${m.marksObtained}%` : 'N/A'}</td>
                      <td className="p-2 border">{m.comments || '-'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="text-sm text-secondary-500 italic">No grades recorded for this period.</p>}
          </section>
          
          <section className="mb-6">
            <h3 className="text-xl font-semibold text-secondary-800 mb-3 border-b pb-1">Attendance Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-center">
                <div className="p-2 bg-green-50 rounded"><strong className="block text-green-700">{reportData.attendanceSummary.present}</strong> Present</div>
                <div className="p-2 bg-red-50 rounded"><strong className="block text-red-700">{reportData.attendanceSummary.absent}</strong> Absent</div>
                <div className="p-2 bg-yellow-50 rounded"><strong className="block text-yellow-700">{reportData.attendanceSummary.late}</strong> Late</div>
                <div className="p-2 bg-blue-50 rounded"><strong className="block text-blue-700">{reportData.attendanceSummary.excused}</strong> Excused</div>
            </div>
            <p className="text-right text-sm mt-2"><strong>Overall Attendance:</strong> {reportData.attendanceSummary.percentage}%</p>
          </section>

           <section className="mb-6">
            <h3 className="text-xl font-semibold text-secondary-800 mb-3 border-b pb-1">Teacher's Comments</h3>
            {reportData.teacherComments.length > 0 ? (
                reportData.teacherComments.map(tc => (
                    <div key={tc.id} className="p-3 border rounded-md mb-2 bg-blue-50">
                        <p className="text-sm text-secondary-700">{tc.comment}</p>
                        <p className="text-xs text-secondary-500 mt-1">- {tc.teacherName || 'Teacher'} ({tc.subject || 'General'}, Term: {tc.term})</p>
                    </div>
                ))
            ) : <p className="text-sm text-secondary-500 italic">No teacher comments available.</p>}
          </section>

          <section className="mb-6">
            <h3 className="text-xl font-semibold text-secondary-800 mb-3 border-b pb-1">Discipline Incidents</h3>
            {reportData.incidents.length > 0 ? (
                reportData.incidents.map(inc => (
                    <div key={inc.id} className="p-3 border rounded-md mb-2 bg-red-50">
                        <p className="text-sm text-secondary-700"><strong>{inc.type}:</strong> {inc.description}</p>
                        <p className="text-xs text-secondary-500 mt-1">Date: {new Date(inc.date).toLocaleDateString()} | Status: {inc.status}</p>
                        {inc.actionTaken && <p className="text-xs text-secondary-500">Action: {inc.actionTaken}</p>}
                    </div>
                ))
            ) : <p className="text-sm text-secondary-500 italic">No discipline incidents recorded.</p>}
          </section>
          
          <section className="mb-6">
            <h3 className="text-xl font-semibold text-secondary-800 mb-3 border-b pb-1">Awards & Achievements</h3>
            {reportData.awards && reportData.awards.length > 0 ? (
                reportData.awards.map(aw => (
                    <div key={aw.id} className="p-3 border rounded-md mb-2 bg-yellow-50">
                        <p className="text-sm text-secondary-700"><strong>{aw.name}</strong></p>
                        <p className="text-xs text-secondary-500 mt-1">{aw.description} (Awarded: {new Date(aw.dateAwarded).toLocaleDateString()})</p>
                    </div>
                ))
            ) : <p className="text-sm text-secondary-500 italic">No awards recorded.</p>}
          </section>

          <footer className="mt-8 pt-4 border-t text-center print-hide">
            <Button onClick={() => window.print()} variant="primary" leftIcon={<ReportIcon className="w-4 h-4"/>}>Print Report</Button>
          </footer>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px !important; margin: 0 !important;}
              .print-hide { display: none !important; }
              /* Add more print-specific styles if needed */
              h2, h3 { page-break-after: avoid; }
              table, section { page-break-inside: avoid; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default StudentReportBuilderPage;