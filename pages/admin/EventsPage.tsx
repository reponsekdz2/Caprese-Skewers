
import React, { useState, useEffect, useCallback } from 'react';
import { Event as SchoolEventType } from '../../types'; 
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { EventsIcon as PageIcon, PlusIcon, EditIcon, DeleteIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<SchoolEventType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEventData, setCurrentEventData] = useState<Partial<SchoolEventType>>({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    location: '',
    organizer: '',
  });
  const [editingEvent, setEditingEvent] = useState<SchoolEventType | null>(null);
  const [loading, setLoading] = useState(false);

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/communication/events`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch events');
      const data: SchoolEventType[] = await response.json();
      setEvents(data.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load events.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleInputChange = (key: keyof Partial<SchoolEventType>, value: string) => {
    setCurrentEventData(prev => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async () => {
    if (!currentEventData.title || !currentEventData.startDate || !currentEventData.endDate) {
      addToast({ type: 'error', message: 'Title, Start Date, and End Date are required.' });
      return;
    }
    if (new Date(currentEventData.startDate) > new Date(currentEventData.endDate)) {
        addToast({type: 'error', message: 'Start date cannot be after end date.'});
        return;
    }

    setLoading(true);
    const method = editingEvent ? 'PUT' : 'POST';
    const url = editingEvent ? `${API_URL}/communication/events/${editingEvent.id}` : `${API_URL}/communication/events`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(currentEventData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to ${editingEvent ? 'update' : 'create'} event`);
      }
      addToast({ type: 'success', message: `Event ${editingEvent ? 'updated' : 'created'} successfully!` });
      fetchEvents();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingEvent(null);
    const today = new Date().toISOString().split('T')[0];
    setCurrentEventData({ title: '', description: '', startDate: today, endDate: today, location: '', organizer: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (event: SchoolEventType) => {
    setEditingEvent(event);
    setCurrentEventData({
        ...event,
        startDate: new Date(event.startDate).toISOString().split('T')[0],
        endDate: new Date(event.endDate).toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/communication/events/${eventId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete event');
        addToast({ type: 'success', message: 'Event deleted successfully.' });
        fetchEvents();
      } catch (error: any) {
        addToast({ type: 'error', message: error.message || 'Could not delete event.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };
  
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate.toDateString() === endDate.toDateString()) {
        return startDate.toLocaleDateString();
    }
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          School Events Management
        </h1>
        <Button onClick={openAddModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="mt-4 sm:mt-0">
          Create New Event
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading events...</div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-xl shadow-lg p-5 flex flex-col justify-between hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105">
              <div>
                <h3 className="font-semibold text-xl text-primary-700 mb-1">{event.title}</h3>
                <p className="text-sm text-secondary-500 mb-2">
                  <span className="font-medium">Date:</span> {formatDateRange(event.startDate, event.endDate)}
                </p>
                {event.location && <p className="text-sm text-secondary-500 mb-1"><span className="font-medium">Location:</span> {event.location}</p>}
                {event.organizer && <p className="text-sm text-secondary-500 mb-3"><span className="font-medium">Organizer:</span> {event.organizer}</p>}
                <p className="text-secondary-600 text-sm mb-3 line-clamp-3" title={event.description}>{event.description}</p>
              </div>
              <div className="mt-auto flex space-x-2 pt-3 border-t border-secondary-100">
                <Button variant="ghost" size="sm" onClick={() => openEditModal(event)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label="Edit event">Edit</Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteEvent(event.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label="Delete event">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Upcoming Events</h2>
          <p className="text-secondary-500 mt-2">Create an event to get started.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingEvent ? "Edit Event" : "Create New Event"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
          <Input label="Event Title" id="eventTitle" value={currentEventData.title || ''} onChange={e => handleInputChange('title', e.target.value)} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" id="startDate" type="date" value={currentEventData.startDate || ''} onChange={e => handleInputChange('startDate', e.target.value)} required />
            <Input label="End Date" id="endDate" type="date" value={currentEventData.endDate || ''} onChange={e => handleInputChange('endDate', e.target.value)} required />
          </div>
          <Input label="Location (Optional)" id="location" value={currentEventData.location || ''} onChange={e => handleInputChange('location', e.target.value)} />
          <Input label="Organizer (Optional)" id="organizer" value={currentEventData.organizer || ''} onChange={e => handleInputChange('organizer', e.target.value)} />
          <Input label="Description" id="description" type="textarea" rows={4} value={currentEventData.description || ''} onChange={e => handleInputChange('description', e.target.value)} required />
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (editingEvent ? 'Saving...' : 'Creating...') : (editingEvent ? "Save Changes" : "Create Event")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventsPage;
