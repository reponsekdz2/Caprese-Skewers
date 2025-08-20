
import React, { useState, useEffect, useCallback } from 'react';
import { TeacherComment, Student, SchoolClass } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PlusIcon, EditIcon, DeleteIcon, ReportIcon as PageIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const TeacherCommentsPage: React.FC = () => {
  const [comments, setComments] = useState<TeacherComment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCommentData, setCurrentCommentData] = useState<Partial<TeacherComment>>({
    studentId: '',
    classId: '',
    subject: '',
    comment: '',
    term: '', 
  });
  const [editingComment, setEditingComment] = useState<TeacherComment | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');

  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchComments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/teacher/comments/teacher/${user.id}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data: TeacherComment[] = await response.json();
      setComments(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load comments.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  const fetchStudentsAndClasses = useCallback(async () => {
    if (!user) return;
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch(`${API_URL}/students`, { headers: getAuthHeaders() }), 
        fetch(`${API_URL}/classes?teacherId=${user.id}`, { headers: getAuthHeaders() })
      ]);
      if (studentsRes.ok) {
        const allStudents: Student[] = await studentsRes.json();
        // Filter students based on classes taught by the teacher
        const teacherClassIds = (await classesRes.clone().json()).map((c: SchoolClass) => c.id);
        setStudents(allStudents.filter(s => s.classId && teacherClassIds.includes(s.classId)));
      }
      if (classesRes.ok) setClasses(await classesRes.json());
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load students or classes for selection.' });
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchComments();
    fetchStudentsAndClasses();
  }, [fetchComments, fetchStudentsAndClasses]);

  const handleInputChange = (key: keyof Partial<TeacherComment>, value: string) => {
    setCurrentCommentData((prev) => ({ ...prev, [key]: value }));
    if (key === 'classId') {
      // Reset student if class changes, as students are filtered by class
      setCurrentCommentData(prev => ({...prev, studentId: ''}));
    }
  };

  const handleFormSubmit = async () => {
    if (!currentCommentData.studentId || !currentCommentData.comment || !currentCommentData.term) {
      addToast({ type: 'error', message: 'Student, Comment, and Term are required.' });
      return;
    }
    setLoading(true);
    const method = editingComment ? 'PUT' : 'POST';
    const url = editingComment ? `${API_URL}/teacher/comments/${editingComment.id}` : `${API_URL}/teacher/comments`;
    
    const payload = { ...currentCommentData, teacherId: user?.id, date: new Date().toISOString() };

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingComment ? 'update' : 'add'} comment`);
      }
      addToast({ type: 'success', message: `Comment ${editingComment ? 'updated' : 'added'} successfully!` });
      fetchComments();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingComment(null);
    setCurrentCommentData({ studentId: '', classId: selectedClassFilter || (classes.length > 0 ? classes[0].id : ''), subject: '', comment: '', term: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (comment: TeacherComment) => {
    setEditingComment(comment);
    setCurrentCommentData(comment);
    setIsModalOpen(true);
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/teacher/comments/${commentId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete comment');
        addToast({ type: 'success', message: 'Comment deleted successfully.' });
        fetchComments();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message || 'Could not delete comment.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingComment(null);
  };

  const studentsForModal = currentCommentData.classId 
    ? students.filter(s => s.classId === currentCommentData.classId)
    : [];
  const studentOptions = studentsForModal.map(s => ({ value: s.id, label: `${s.name} (${s.studentId})` }));

  const classOptionsForFilter = [{value: '', label: 'All My Classes'}, ...classes.map(c => ({ value: c.id, label: c.name }))];
  const classOptionsForModal = classes.map(c => ({value: c.id, label: c.name}));

  const filteredComments = selectedClassFilter 
    ? comments.filter(c => c.classId === selectedClassFilter)
    : comments;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Student Comments
        </h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Select
            label="Filter by Class"
            options={classOptionsForFilter}
            value={selectedClassFilter}
            onChange={e => setSelectedClassFilter(e.target.value)}
            containerClassName="mb-0 sm:w-60"
          />
          <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="self-end">
            Add Comment
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading comments...</div>
      ) : filteredComments.length > 0 ? (
        <div className="space-y-4">
          {filteredComments.map(comment => (
            <div key={comment.id} className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg text-primary-700">
                    {students.find(s => s.id === comment.studentId)?.name || 'Unknown Student'}
                  </p>
                  <p className="text-xs text-secondary-500">
                    Class: {classes.find(c => c.id === comment.classId)?.name || 'N/A'} | 
                    Subject: {comment.subject || 'General'} | 
                    Term: {comment.term} | 
                    Date: {new Date(comment.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(comment)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label="Edit comment"/>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(comment.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label="Delete comment"/>
                </div>
              </div>
              <p className="text-secondary-700 mt-2 whitespace-pre-wrap">{comment.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Comments Yet</h2>
          <p className="text-secondary-500 mt-2">Start adding comments to provide feedback on student progress. Select a class to filter comments or view all.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingComment ? "Edit Comment" : "Add New Comment"}>
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
          <Select label="Class" id="classIdModal" options={classOptionsForModal} value={currentCommentData.classId || ''} onChange={e => handleInputChange('classId', e.target.value)} required />
          <Select label="Student" id="studentIdModal" options={studentOptions} value={currentCommentData.studentId || ''} onChange={e => handleInputChange('studentId', e.target.value)} required disabled={!currentCommentData.classId || studentOptions.length === 0} />
          <Input label="Subject (Optional)" id="subjectModal" value={currentCommentData.subject || ''} onChange={(e) => handleInputChange('subject', e.target.value)} />
          <Input label="Term (e.g., Term 1 2024, Mid-Year)" id="termModal" value={currentCommentData.term || ''} onChange={(e) => handleInputChange('term', e.target.value)} required />
          <Input label="Comment" id="commentModal" type="textarea" rows={4} value={currentCommentData.comment || ''} onChange={(e) => handleInputChange('comment', e.target.value)} required />
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (editingComment ? 'Saving...' : 'Adding...') : (editingComment ? "Save Changes" : "Add Comment")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherCommentsPage;
