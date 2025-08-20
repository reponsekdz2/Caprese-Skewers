
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { SchoolClass, Student, Exam, Mark } from '../../types';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ReportIcon, EditIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const TeacherGradebookPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const [myClasses, setMyClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [examsForClass, setExamsForClass] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [marks, setMarks] = useState<Record<string, { studentId: string; marksObtained: string | null; comments?: string }>>({});
  
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudentsExams, setLoadingStudentsExams] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  const fetchMyClasses = useCallback(async () => {
    if (!user) return;
    setLoadingClasses(true);
    try {
      const response = await fetch(`${API_URL}/classes?teacherId=${user.id}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error("Failed to fetch your classes.");
      const data: SchoolClass[] = await response.json();
      setMyClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      } else if (data.length === 0) {
        setSelectedClassId(''); // Clear selection if no classes
      }
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || "Could not load your classes." });
      setMyClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, [user, getAuthHeaders, addToast, selectedClassId]);

  const fetchStudentsAndExamsForClass = useCallback(async () => {
    if (!selectedClassId) {
      setStudentsInClass([]);
      setExamsForClass([]);
      setMarks({});
      setSelectedExamId('');
      return;
    }
    setLoadingStudentsExams(true);
    try {
      const [studentsRes, examsRes] = await Promise.all([
        fetch(`${API_URL}/students?classId=${selectedClassId}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/academics/exams?classId=${selectedClassId}`, { headers: getAuthHeaders() })
      ]);

      if (!studentsRes.ok) throw new Error("Failed to fetch students for selected class.");
      const studentsData: Student[] = await studentsRes.json();
      setStudentsInClass(studentsData);

      if (!examsRes.ok) throw new Error("Failed to fetch exams for selected class.");
      const examsData: Exam[] = await examsRes.json();
      setExamsForClass(examsData);
      
      if (examsData.length > 0) {
        setSelectedExamId(prevExamId => examsData.find(e => e.id === prevExamId) ? prevExamId : examsData[0].id);
      } else {
        setSelectedExamId('');
        setMarks({}); // No exams, so clear marks
      }

    } catch (error: any) {
      addToast({ type: 'error', message: error.message || "Could not load students or exams."});
      setStudentsInClass([]);
      setExamsForClass([]);
      setSelectedExamId('');
      setMarks({});
    } finally {
      setLoadingStudentsExams(false);
    }
  }, [selectedClassId, getAuthHeaders, addToast]);

  const fetchMarksForExam = useCallback(async () => {
    const initialMarksState: Record<string, { studentId: string; marksObtained: string | null; comments?: string }> = {};
    studentsInClass.forEach(student => {
        initialMarksState[student.id] = { studentId: student.id, marksObtained: null, comments: '' };
    });

    if (!selectedExamId || studentsInClass.length === 0) {
        setMarks(initialMarksState);
        return;
    }
    setLoadingStudentsExams(true); // Reuse loading state
    try {
      const response = await fetch(`${API_URL}/academics/exams/${selectedExamId}/marks`, { headers: getAuthHeaders() });
      if (!response.ok && response.status !== 404) { // 404 might mean no marks recorded yet, which is fine
          throw new Error("Failed to fetch marks for the selected exam.");
      }
      const existingMarksData: Mark[] = response.ok ? await response.json() : [];
      
      const marksMap = { ...initialMarksState }; // Start with initial state for all students in class
      existingMarksData.forEach(mark => {
        if (marksMap[mark.studentId]) { // Ensure student is still in the current class context
          marksMap[mark.studentId] = { 
            ...marksMap[mark.studentId], 
            ...mark, // Spread existing mark data
            marksObtained: mark.marksObtained !== null && mark.marksObtained !== undefined ? String(mark.marksObtained) : null 
          };
        }
      });
      setMarks(marksMap);

    } catch (error: any) {
      addToast({ type: 'error', message: error.message || "Could not load marks."});
      setMarks(initialMarksState); // Reset to initial state on error
    } finally { // Added closing brace for catch block
      setLoadingStudentsExams(false);
    }
  }, [selectedExamId, studentsInClass, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchMyClasses();
  }, [fetchMyClasses]);

  useEffect(() => {
    fetchStudentsAndExamsForClass();
  }, [selectedClassId, fetchStudentsAndExamsForClass]);

  useEffect(() => {
    // This effect now correctly depends on studentsInClass to ensure marks are initialized/fetched for the right set of students.
    fetchMarksForExam();
  }, [selectedExamId, studentsInClass, fetchMarksForExam]);

  const handleMarkChange = (studentId: string, value: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { studentId, comments: '' }), marksObtained: value }
    }));
  };

  const handleCommentChange = (studentId: string, value: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { studentId, marksObtained: null }), comments: value }
    }));
  };

  const handleSaveMarks = async () => {
    if (!selectedExamId || Object.keys(marks).length === 0) {
      addToast({ type: 'warning', message: "Please select an exam and enter marks." });
      return;
    }
    const currentExam = examsForClass.find(e => e.id === selectedExamId);
    if (!currentExam) {
        addToast({type: 'error', message: "Selected exam details not found."});
        return;
    }

    setSavingMarks(true);
    const marksPayload = Object.values(marks).map(markInput => {
      let marksObtainedNum: number | null = null;
      if (markInput.marksObtained !== null && String(markInput.marksObtained).trim() !== '') {
        marksObtainedNum = parseFloat(String(markInput.marksObtained));
        if (isNaN(marksObtainedNum)) {
            marksObtainedNum = null; 
        } else {
            marksObtainedNum = Math.max(0, Math.min(marksObtainedNum, currentExam.maxMarks));
        }
      }
      return { studentId: markInput.studentId, marksObtained: marksObtainedNum, comments: markInput.comments };
    });

    try {
      const response = await fetch(`${API_URL}/academics/marks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ examId: selectedExamId, studentMarks: marksPayload }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to save marks.");
      }
      addToast({ type: 'success', message: "Marks saved successfully!" });
      fetchMarksForExam(); // Re-fetch marks
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setSavingMarks(false);
    }
  };

  const classOptions = myClasses.map(c => ({ value: c.id, label: `${c.name} ${c.subject ? `(${c.subject})` : ''}` }));
  const examOptions = examsForClass.map(e => ({ value: e.id, label: `${e.name} (Max: ${e.maxMarks})`}));

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <ReportIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" />
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text">My Gradebook</h1>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white dark:bg-dark-card rounded-lg shadow-md">
        <Select
          label="Select Class"
          options={classOptions.length > 0 ? classOptions : [{value: '', label: 'No classes found'}]}
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          disabled={loadingClasses || myClasses.length === 0}
          containerClassName="mb-0"
        />
        <Select
          label="Select Exam"
          options={examOptions.length > 0 ? examOptions : [{value: '', label: 'No exams for this class'}]}
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          disabled={loadingStudentsExams || !selectedClassId || examsForClass.length === 0}
          containerClassName="mb-0"
        />
      </div>

      {(loadingStudentsExams && selectedClassId) ? (
        <p className="text-center py-8 dark:text-secondary-400">Loading student and exam data...</p>
      ) : !selectedClassId ? (
        <p className="text-center py-8 dark:text-secondary-400">Please select a class to manage grades.</p>
      ) : !selectedExamId ? (
        <p className="text-center py-8 dark:text-secondary-400">Please select an exam, or create one for this class via Exams Management.</p>
      ) : studentsInClass.length === 0 ? (
         <p className="text-center py-8 dark:text-secondary-400">No students found in the selected class.</p>
      ) : (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-dark-border">
              <thead className="bg-secondary-50 dark:bg-secondary-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Marks Obtained</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Comments</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-secondary-200 dark:divide-dark-border">
                {studentsInClass.map(student => (
                  <tr key={student.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-dark-text">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{student.studentId}</td>
                    <td className="px-6 py-4">
                      <Input
                        type="number"
                        value={marks[student.id]?.marksObtained === null || marks[student.id]?.marksObtained === undefined ? '' : String(marks[student.id]?.marksObtained)}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        placeholder="N/A"
                        min="0"
                        max={examsForClass.find(e=>e.id === selectedExamId)?.maxMarks || 100}
                        className="w-24 mt-0 mb-0"
                        containerClassName="mb-0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        type="text"
                        value={marks[student.id]?.comments || ''}
                        onChange={(e) => handleCommentChange(student.id, e.target.value)}
                        placeholder="Optional comments"
                        className="w-full mt-0 mb-0"
                        containerClassName="mb-0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 text-right bg-secondary-50 dark:bg-secondary-700 border-t dark:border-dark-border">
            <Button onClick={handleSaveMarks} disabled={savingMarks || !selectedExamId || studentsInClass.length === 0}>
              {savingMarks ? 'Saving...' : 'Save All Marks'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherGradebookPage;
