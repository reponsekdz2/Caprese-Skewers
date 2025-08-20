
import React, { useState, useEffect, useCallback } from 'react';
import { Exam, Mark, Student, SchoolClass } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select'; // Assuming Select component exists
import { PlusIcon, EditIcon, DeleteIcon, ExamsIcon as PageIcon, GraduationCapIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const API_URL = 'http://localhost:3001/api';

const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]); // For filtering exams by class or assigning to a class
  
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  
  const [currentExamData, setCurrentExamData] = useState<Partial<Exam>>({ name: '', date: '', maxMarks: 100, classId: null, subject: '' });
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  
  const [selectedExamForMarks, setSelectedExamForMarks] = useState<Exam | null>(null);
  const [studentMarks, setStudentMarks] = useState<Record<string, { studentId: string; marksObtained: string | null; comments?: string }>>({});

  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false); // For marks modal
  const [loadingMarks, setLoadingMarks] = useState(false); // For fetching marks
  const [saving, setSaving] = useState(false); // For submitting exam or marks

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchExamsAndClasses = useCallback(async () => {
    setLoadingExams(true);
    try {
      const [examsResponse, classesResponse] = await Promise.all([
        fetch(`${API_URL}/academics/exams`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/classes`, { headers: getAuthHeaders() }) // Fetch all classes for admin/teacher
      ]);

      if (!examsResponse.ok) throw new Error('Failed to fetch exams');
      const examsData: Exam[] = await examsResponse.json();
      setExams(examsData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      if (!classesResponse.ok) throw new Error('Failed to fetch classes');
      const classesData: SchoolClass[] = await classesResponse.json();
      setClasses(classesData);

    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Failed to load exams or classes.' });
    } finally {
      setLoadingExams(false);
    }
  }, [addToast, getAuthHeaders]);

  useEffect(() => {
    fetchExamsAndClasses();
  }, [fetchExamsAndClasses]);

  const fetchStudentsForClass = useCallback(async (classId: string | null) => {
    if (!classId) {
        setStudents([]); // If no class selected (e.g. for general exam), no specific students to list by default.
        return;
    }
    setLoadingStudents(true);
    try {
        const response = await fetch(`${API_URL}/students?classId=${classId}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch students for the class.');
        const data: Student[] = await response.json();
        setStudents(data);
    } catch (error: any) {
        addToast({ type: 'error', message: error.message });
        setStudents([]);
    } finally {
        setLoadingStudents(false);
    }
  }, [getAuthHeaders, addToast]);


  const handleExamInputChange = (key: keyof Partial<Exam>, value: string | number | null) => {
    setCurrentExamData((prev) => ({ ...prev, [key]: value }));
    if (key === 'classId' && value) { // If class is selected for the exam, fetch its students for marks modal
        fetchStudentsForClass(value as string | null);
    } else if (key === 'classId' && !value) {
        setStudents([]); // Clear students if class is unselected
    }
  };

  const handleExamFormSubmit = async () => {
    if (!currentExamData.name || !currentExamData.date || currentExamData.maxMarks == null || Number(currentExamData.maxMarks) < 0) {
      addToast({ type: 'error', message: 'Please fill all exam fields with valid data (Max Marks >= 0).' });
      return;
    }
    setSaving(true);
    const method = editingExam ? 'PUT' : 'POST';
    const url = editingExam ? `${API_URL}/academics/exams/${editingExam.id}` : `${API_URL}/academics/exams`;
    try {
      const payload = { ...currentExamData, maxMarks: Number(currentExamData.maxMarks), classId: currentExamData.classId || null };
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingExam ? 'update' : 'add'} exam`);
      }
      addToast({ type: 'success', message: `Exam ${editingExam ? 'updated' : 'added'} successfully!` });
      fetchExamsAndClasses(); // Re-fetch exams
      closeExamModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const openAddExamModal = () => {
    setEditingExam(null);
    setCurrentExamData({ name: '', date: new Date().toISOString().split('T')[0], maxMarks: 100, classId: null, subject: '' });
    setStudents([]); // Clear students when adding a new exam
    setIsExamModalOpen(true);
  };

  const openEditExamModal = (exam: Exam) => {
    setEditingExam(exam);
    setCurrentExamData({ name: exam.name, date: exam.date, maxMarks: exam.maxMarks, classId: exam.classId || null, subject: exam.subject || '' });
    if (exam.classId) fetchStudentsForClass(exam.classId); // Fetch students for the class if it's set
    else setStudents([]);
    setIsExamModalOpen(true);
  };

  const handleDeleteExam = async (examId: string) => {
    if (window.confirm('Are you sure you want to delete this exam and all its associated marks? This action cannot be undone.')) {
      setSaving(true);
      try {
        const response = await fetch(`${API_URL}/academics/exams/${examId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to delete exam');
        }
        addToast({ type: 'success', message: 'Exam deleted successfully.' });
        fetchExamsAndClasses(); // Re-fetch exams
      } catch (error: any) {
        addToast({ type: 'error', message: error.message });
      } finally {
        setSaving(false);
      }
    }
  };

  const closeExamModal = () => {
    setIsExamModalOpen(false);
    setEditingExam(null);
  };

  // Marks Management
  const openMarksModal = async (exam: Exam) => {
    setSelectedExamForMarks(exam);
    setIsMarksModalOpen(true);
    setLoadingMarks(true);
    setStudentMarks({}); 

    // Fetch students for the class if classId is present, otherwise, all students for a general exam (or prompt admin)
    if (exam.classId) {
        await fetchStudentsForClass(exam.classId);
    } else {
        // For general exams, or if students weren't pre-fetched.
        // This might load all students if not handled carefully, or show a message.
        // For this version, we'll rely on students being fetched if a classId was associated with the exam.
        // If no classId on exam, we'll use the currently loaded 'students' list if any, or prompt.
        if (students.length === 0) { // Fetch all students if no class context and students list is empty
            setLoadingStudents(true);
            try {
                const studentsResponse = await fetch(`${API_URL}/students`, { headers: getAuthHeaders() });
                if (studentsResponse.ok) setStudents(await studentsResponse.json());
            } catch (e) { addToast({type: 'error', message: 'Failed to load students list.'}); }
            finally { setLoadingStudents(false); }
        }
    }

    try {
      const response = await fetch(`${API_URL}/academics/exams/${exam.id}/marks`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch marks for this exam.');
      const existingMarks: Mark[] = await response.json();
      const marksMap: Record<string, { studentId: string; marksObtained: string | null; comments?: string }> = {};
      // Initialize for all students fetched for the class (or all if general exam)
      const studentsToConsider = exam.classId ? students.filter(s => s.classId === exam.classId) : students;

      studentsToConsider.forEach(student => {
        const existingMark = existingMarks.find(mark => mark.studentId === student.id);
        marksMap[student.id] = { 
            studentId: student.id, 
            marksObtained: existingMark && existingMark.marksObtained !== null ? String(existingMark.marksObtained) : null, 
            comments: existingMark?.comments || '' 
        };
      });
      setStudentMarks(marksMap);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoadingMarks(false);
    }
  };

  const handleMarkChange = (studentId: string, value: string) => {
    setStudentMarks(prev => ({ 
        ...prev, 
        [studentId]: { ...(prev[studentId] || { studentId: studentId, comments:''}), marksObtained: value } 
    }));
  };

  const handleCommentChange = (studentId: string, value: string) => {
    setStudentMarks(prev => ({ 
        ...prev, 
        [studentId]: { ...(prev[studentId] || { studentId: studentId, marksObtained: null }), comments: value } 
    }));
  };

  const handleMarksFormSubmit = async () => {
    if (!selectedExamForMarks) return;
    setSaving(true);
    const marksPayload = Object.values(studentMarks)
      .map(({ studentId, marksObtained, comments }) => {
        let marksValue: number | null = null;
        if (marksObtained !== null && String(marksObtained).trim() !== '') {
            marksValue = parseFloat(String(marksObtained));
            if (isNaN(marksValue)) {
                 marksValue = null; // Invalid input
            } else {
                marksValue = Math.max(0, Math.min(marksValue, selectedExamForMarks.maxMarks));
            }
        }
        return { studentId, marksObtained: marksValue, comments };
      });
      
    try {
      const response = await fetch(`${API_URL}/academics/marks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ examId: selectedExamForMarks.id, studentMarks: marksPayload }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to save marks.');
      }
      addToast({ type: 'success', message: 'Marks saved successfully!' });
      // Optionally re-fetch marks for the current exam if needed, or assume success
      // fetchMarksForExam(); // From TeacherGradebookPage logic
      closeMarksModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
        setSaving(false);
    }
  };

  const closeMarksModal = () => {
    setIsMarksModalOpen(false);
    setSelectedExamForMarks(null);
    setStudentMarks({});
  };
  
  const classOptions = [{ value: '', label: 'General (No specific class)' }, ...classes.map(c => ({value: c.id, label: c.name}))];


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center"><PageIcon className="w-8 h-8 mr-2 text-primary-600 dark:text-primary-400" />Exams & Marks (Admin)</h1>
        <Button onClick={openAddExamModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>}>
          Add Exam
        </Button>
      </div>

      {loadingExams ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div> : (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-dark-border">
              <thead className="bg-secondary-50 dark:bg-secondary-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Exam Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Max Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-secondary-200 dark:divide-dark-border">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-dark-text">{exam.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{new Date(exam.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{classes.find(c=>c.id === exam.classId)?.name || 'General'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{exam.subject || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{exam.maxMarks}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                      <Button onClick={() => openMarksModal(exam)} variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Manage Marks</Button>
                      <Button onClick={() => openEditExamModal(exam)} variant="ghost" size="sm" leftIcon={<EditIcon className="w-4 h-4"/>}/>
                      <Button onClick={() => handleDeleteExam(exam.id)} variant="danger" size="sm" leftIcon={<DeleteIcon className="w-4 h-4"/>}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {exams.length === 0 && !loadingExams && <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">No exams found.</p>}
        </div>
      )}

      <Modal isOpen={isExamModalOpen} onClose={closeExamModal} title={editingExam ? "Edit Exam" : "Add New Exam"}>
        <form onSubmit={(e) => { e.preventDefault(); handleExamFormSubmit(); }} className="space-y-4">
          <Input label="Exam Name" id="examName" value={currentExamData.name || ''} onChange={(e) => handleExamInputChange('name', e.target.value)} required />
          <Input label="Date" id="examDate" type="date" value={currentExamData.date || ''} onChange={(e) => handleExamInputChange('date', e.target.value)} required />
          <Select label="Class (Optional)" id="examClassId" options={classOptions} value={currentExamData.classId || ''} onChange={(e) => handleExamInputChange('classId', e.target.value || null)} />
          <Input label="Subject (Optional)" id="examSubject" value={currentExamData.subject || ''} onChange={(e) => handleExamInputChange('subject', e.target.value)} />
          <Input label="Maximum Marks" id="maxMarks" type="number" value={String(currentExamData.maxMarks || '')} onChange={(e) => handleExamInputChange('maxMarks', e.target.value ? parseInt(e.target.value, 10) : null)} required min="0"/>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeExamModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? (editingExam ? 'Saving...' : 'Adding...') : (editingExam ? "Save Changes" : "Add Exam")}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isMarksModalOpen} onClose={closeMarksModal} title={`Manage Marks for ${selectedExamForMarks?.name || ''}`} size="xl">
        {(loadingStudents || loadingMarks) && !Object.keys(studentMarks).length ? <div className="text-center py-10 dark:text-secondary-400">Loading students and marks...</div> : (
          <form onSubmit={(e) => { e.preventDefault(); handleMarksFormSubmit(); }}>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              {students.length > 0 ? (
                <table className="min-w-full divide-y divide-secondary-200 dark:divide-dark-border">
                    <thead className="bg-secondary-50 dark:bg-secondary-700 sticky top-0 z-10">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Student Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Student ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Marks (Max: {selectedExamForMarks?.maxMarks})</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">Comments</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-card divide-y divide-secondary-200 dark:divide-dark-border">
                    {students.map(student => (
                        <tr key={student.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-secondary-700 dark:text-dark-text">{student.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">{student.studentId}</td>
                        <td className="px-4 py-2">
                            <Input
                            id={`mark-${student.id}`} type="number" placeholder="N/A"
                            value={studentMarks[student.id]?.marksObtained === null || studentMarks[student.id]?.marksObtained === undefined ? '' : String(studentMarks[student.id]?.marksObtained)}
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            min="0" max={selectedExamForMarks?.maxMarks}
                            className="w-24 mt-0 mb-0" containerClassName="mb-0"
                            />
                        </td>
                        <td className="px-4 py-2">
                            <Input
                            id={`comment-${student.id}`} type="text" placeholder="Optional comment"
                            value={studentMarks[student.id]?.comments || ''}
                            onChange={(e) => handleCommentChange(student.id, e.target.value)}
                            className="w-full mt-0 mb-0" containerClassName="mb-0"
                            />
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              ) : (
                <p className="text-center text-secondary-500 dark:text-secondary-400 py-4">No students found for this exam's class, or an error occurred loading students.</p>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t dark:border-dark-border">
              <Button type="button" variant="secondary" onClick={closeMarksModal}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving || students.length === 0}>
                {saving ? 'Saving...' : 'Save Marks'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ExamsPage;
