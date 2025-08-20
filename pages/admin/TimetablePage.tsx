
import React, { useState, useEffect, useCallback } from 'react';
import { TimetableSlot, SchoolClass, User, UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { TimetableIcon as PageIcon, PlusIcon, EditIcon, DeleteIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const daysOfWeek: TimetableSlot['dayOfWeek'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; 

const TimetablePage: React.FC = () => {
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlotData, setCurrentSlotData] = useState<Partial<TimetableSlot>>({
    classId: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    subject: '',
    teacherId: null,
  });
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');


  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchTimetableSlots = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/academics/timetable`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch timetable slots');
      const data: TimetableSlot[] = await response.json();
      setTimetableSlots(data);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load timetable.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  const fetchClassesAndTeachers = useCallback(async () => {
    try {
      const [classesRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/classes`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/users`, { headers: getAuthHeaders() }), 
      ]);
      if (classesRes.ok) setClasses(await classesRes.json());
      if (usersRes.ok) {
        const allUsers: User[] = await usersRes.json();
        setTeachers(allUsers.filter(u => u.role === UserRole.TEACHER || u.role === UserRole.HEAD_TEACHER));
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load classes or teachers for selection.' });
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchTimetableSlots();
    fetchClassesAndTeachers();
  }, [fetchTimetableSlots, fetchClassesAndTeachers]);

  const handleInputChange = (key: keyof Partial<TimetableSlot>, value: string | null) => {
    setCurrentSlotData(prev => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async () => {
    if (!currentSlotData.classId || !currentSlotData.dayOfWeek || !currentSlotData.startTime || !currentSlotData.endTime || !currentSlotData.subject) {
      addToast({ type: 'error', message: 'All fields except Teacher are required.' });
      return;
    }
    if (currentSlotData.startTime >= currentSlotData.endTime) {
        addToast({ type: 'error', message: 'Start time must be before end time.' });
        return;
    }

    setLoading(true);
    const method = editingSlot ? 'PUT' : 'POST';
    const url = editingSlot ? `${API_URL}/academics/timetable/${editingSlot.id}` : `${API_URL}/academics/timetable`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(currentSlotData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingSlot ? 'update' : 'add'} timetable slot`);
      }
      addToast({ type: 'success', message: `Timetable slot ${editingSlot ? 'updated' : 'added'} successfully!` });
      fetchTimetableSlots();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSlot(null);
    setCurrentSlotData({ classId: classes[0]?.id || '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', subject: '', teacherId: null });
    setIsModalOpen(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setCurrentSlotData(slot);
    setIsModalOpen(true);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (window.confirm('Are you sure you want to delete this timetable slot?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/academics/timetable/${slotId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete timetable slot');
        addToast({ type: 'success', message: 'Timetable slot deleted successfully.' });
        fetchTimetableSlots();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message || 'Could not delete slot.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlot(null);
  };
  
  const classOptions = classes.map(c => ({ value: c.id, label: c.name }));
  const teacherOptions = [{value: '', label: 'Unassigned'}, ...teachers.map(t => ({ value: t.id, label: t.name }))];
  const dayOptions = daysOfWeek.map(day => ({ value: day, label: day }));

  const filteredSlots = selectedClassFilter 
    ? timetableSlots.filter(slot => slot.classId === selectedClassFilter)
    : timetableSlots;

  const groupedSlots = filteredSlots.reduce((acc, slot) => {
    (acc[slot.dayOfWeek] = acc[slot.dayOfWeek] || []).push(slot);
    return acc;
  }, {} as Record<TimetableSlot['dayOfWeek'], TimetableSlot[]>);

  daysOfWeek.forEach(day => {
    if (groupedSlots[day]) {
        groupedSlots[day].sort((a,b) => a.startTime.localeCompare(b.startTime));
    }
  });


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Manage Timetable
        </h1>
        <div className="flex gap-2 mt-4 sm:mt-0 items-end">
            <Select 
                label="Filter by Class"
                options={[{value: '', label: 'All Classes'}, ...classOptions]}
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                containerClassName="mb-0 min-w-[200px]"
                className="mt-0"
            />
            <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>}>
                Add Slot
            </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading timetable...</div>
      ) : daysOfWeek.map(day => (
        (groupedSlots[day] && groupedSlots[day].length > 0) || (selectedClassFilter && (!groupedSlots[day] || groupedSlots[day].length === 0)) ? (
          <div key={day} className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-700 mb-3 border-b pb-2">{day}</h2>
            {groupedSlots[day] && groupedSlots[day].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedSlots[day].map(slot => (
                  <div key={slot.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                    <p className="font-bold text-lg text-secondary-800">{slot.subject}</p>
                    <p className="text-sm text-primary-600">{slot.startTime} - {slot.endTime}</p>
                    <p className="text-xs text-secondary-500">Class: {classes.find(c=>c.id === slot.classId)?.name || 'N/A'}</p>
                    <p className="text-xs text-secondary-500">Teacher: {teachers.find(t=>t.id === slot.teacherId)?.name || 'Unassigned'}</p>
                    <div className="mt-3 flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(slot)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label={`Edit slot for ${slot.subject}`}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteSlot(slot.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label={`Delete slot for ${slot.subject}`}>Del</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary-500 italic py-2">No slots scheduled for {day} for {classes.find(c => c.id === selectedClassFilter)?.name || 'this class'}.</p>
            )}
          </div>
        ) : null 
      ))}
      
      {!loading && filteredSlots.length === 0 && !selectedClassFilter && (
         <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">Timetable is Empty</h2>
          <p className="text-secondary-500 mt-2">Start by adding timetable slots for classes.</p>
        </div>
      )}
       {!loading && filteredSlots.length === 0 && selectedClassFilter && !daysOfWeek.some(day => groupedSlots[day] && groupedSlots[day].length > 0) && (
         <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Slots for Selected Class</h2>
          <p className="text-secondary-500 mt-2">This class currently has no timetable slots assigned for any day.</p>
        </div>
      )}


      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSlot ? "Edit Timetable Slot" : "Add New Timetable Slot"}>
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
          <Select label="Class" id="classId" options={classOptions} value={currentSlotData.classId || ''} onChange={e => handleInputChange('classId', e.target.value)} required />
          <Select label="Day of Week" id="dayOfWeek" options={dayOptions} value={currentSlotData.dayOfWeek || 'Monday'} onChange={e => handleInputChange('dayOfWeek', e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" id="startTime" type="time" value={currentSlotData.startTime || ''} onChange={e => handleInputChange('startTime', e.target.value)} required />
            <Input label="End Time" id="endTime" type="time" value={currentSlotData.endTime || ''} onChange={e => handleInputChange('endTime', e.target.value)} required />
          </div>
          <Input label="Subject" id="subject" value={currentSlotData.subject || ''} onChange={e => handleInputChange('subject', e.target.value)} required />
          <Select label="Teacher (Optional)" id="teacherId" options={teacherOptions} value={currentSlotData.teacherId || ''} onChange={e => handleInputChange('teacherId', e.target.value || null)} />
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (editingSlot ? 'Saving...' : 'Adding...') : (editingSlot ? "Save Changes" : "Add Slot")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimetablePage;
