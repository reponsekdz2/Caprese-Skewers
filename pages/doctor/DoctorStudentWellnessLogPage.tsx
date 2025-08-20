
import React, { useState, useEffect, useCallback } from 'react';
import { WellnessLogEntry, Student, User, UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PlusIcon, UsersIcon as StudentListIcon, MoodHappyIcon, MoodOkayIcon, MoodSadIcon, CalendarDaysIcon } from '../../assets/icons';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../../components/common/Modal'; // Added Modal import

const API_URL = 'http://localhost:3001/api';

type MoodOption = 'happy' | 'okay' | 'sad' | 'anxious' | 'calm';

const moodOptions: { value: MoodOption, label: string, icon: React.ElementType }[] = [
    { value: 'happy', label: 'Happy', icon: MoodHappyIcon },
    { value: 'okay', label: 'Okay', icon: MoodOkayIcon },
    { value: 'sad', label: 'Sad', icon: MoodSadIcon },
    { value: 'anxious', label: 'Anxious', icon: MoodOkayIcon },
    { value: 'calm', label: 'Calm', icon: MoodHappyIcon },
];

const MoodIconDisplay: React.FC<{ mood: MoodOption, className?: string }> = ({ mood, className = "w-6 h-6" }) => {
    const moodDetail = moodOptions.find(opt => opt.value === mood);
    // Fallback to MoodOkayIcon if mood detail is not found
    if (!moodDetail) return <MoodOkayIcon className={className} />;
    const IconComponent = moodDetail.icon;
    return <IconComponent className={className} />;
};

const DoctorStudentWellnessLogPage: React.FC = () => {
    const { studentId: studentIdFromParams } = useParams<{ studentId?: string }>();
    const navigate = useNavigate();

    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>(studentIdFromParams || '');
    const [wellnessLogs, setWellnessLogs] = useState<WellnessLogEntry[]>([]);

    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [newLogData, setNewLogData] = useState<{ mood: MoodOption; notes: string }>({
        mood: 'okay',
        notes: '',
    });

    const [loadingStudents, setLoadingStudents] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [submittingLog, setSubmittingLog] = useState(false);

    const { user: doctorUser, getAuthHeaders } = useAuth();
    const { addToast } = useToast();

    /**
     * Fetches the list of students (users with role STUDENT) from the API.
     * Uses useCallback for memoization to prevent unnecessary re-renders.
     */
    const fetchStudents = useCallback(async () => {
        setLoadingStudents(true);
        try {
            const response = await fetch(`${API_URL}/users?role=${UserRole.STUDENT}`, { headers: getAuthHeaders() });
            if (!response.ok) {
                throw new Error('Failed to fetch student list');
            }
            const data: User[] = await response.json();
            setStudents(data);
        } catch (error: any) {
            console.error("Error fetching students:", error);
            addToast({ type: 'error', message: error.message || 'Could not load students.' });
        } finally {
            setLoadingStudents(false);
        }
    }, [getAuthHeaders, addToast]);

    /**
     * Fetches wellness logs for a specific student from the API.
     * Uses useCallback for memoization.
     * @param studentUserIdToFetch The ID of the student whose wellness logs are to be fetched.
     */
    const fetchWellnessLogs = useCallback(async (studentUserIdToFetch: string) => {
        if (!studentUserIdToFetch) {
            setWellnessLogs([]); // Clear logs if no student is selected
            return;
        }
        setLoadingLogs(true);
        try {
            const response = await fetch(`${API_URL}/student/${studentUserIdToFetch}/wellness-logs`, { headers: getAuthHeaders() });
            if (!response.ok) {
                throw new Error('Failed to fetch wellness logs for the selected student.');
            }
            const data: WellnessLogEntry[] = await response.json();
            // Sort logs by entryDate in descending order (most recent first)
            const sortedData = data.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
            setWellnessLogs(sortedData);
        } catch (error: any) {
            console.error("Error fetching wellness logs:", error);
            addToast({ type: 'error', message: error.message || 'Could not load wellness logs.' });
            setWellnessLogs([]); // Clear logs on error
        } finally {
            setLoadingLogs(false);
        }
    }, [getAuthHeaders, addToast]);

    // Effect to fetch students on component mount
    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Effect to fetch wellness logs when selectedStudentId changes or on initial load with studentIdFromParams
    useEffect(() => {
        if (selectedStudentId) {
            fetchWellnessLogs(selectedStudentId);
            // Update URL if studentId in params doesn't match selectedStudentId
            if (studentIdFromParams && selectedStudentId !== studentIdFromParams) {
                navigate(`/doctor/wellness-logs/${selectedStudentId}`, { replace: true });
            } else if (!studentIdFromParams && selectedStudentId) {
                // If no studentId in params but a student is selected, update URL
                navigate(`/doctor/wellness-logs/${selectedStudentId}`, { replace: true });
            }
        } else if (!studentIdFromParams) {
            // Clear logs if no student is selected and no studentId in params
            setWellnessLogs([]);
        }
    }, [selectedStudentId, fetchWellnessLogs, studentIdFromParams, navigate]); // Added navigate to dependencies

    /**
     * Handles the change event for the student selection dropdown.
     * Updates the selected student ID state.
     * @param e The change event from the select element.
     */
    const handleStudentSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStudentId = e.target.value;
        setSelectedStudentId(newStudentId);
    };

    /**
     * Opens the modal for adding a new wellness log entry.
     * Displays a warning if no student is selected.
     */
    const openLogModal = () => {
        if (!selectedStudentId) {
            addToast({ type: 'warning', message: 'Please select a student first.' });
            return;
        }
        setNewLogData({ mood: 'okay', notes: '' }); // Reset form
        setIsLogModalOpen(true);
    };

    /**
     * Handles the submission of a new wellness log entry.
     * Sends a POST request to the API.
     */
    const handleLogSubmit = async () => {
        if (!selectedStudentId || !newLogData.mood) {
            addToast({ type: 'error', message: 'Student and mood are required.' });
            return;
        }
        setSubmittingLog(true);
        try {
            const payload = {
                studentUserId: selectedStudentId,
                mood: newLogData.mood,
                notes: newLogData.notes,
            };
            const response = await fetch(`${API_URL}/doctor/wellness-log`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json', // Ensure Content-Type is set for POST
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to submit wellness log.');
            }
            addToast({ type: 'success', message: 'Wellness log submitted successfully!' });
            fetchWellnessLogs(selectedStudentId); // Refresh logs after successful submission
            setIsLogModalOpen(false); // Close modal
        } catch (error: any) {
            console.error("Error submitting wellness log:", error);
            addToast({ type: 'error', message: error.message });
        } finally {
            setSubmittingLog(false);
        }
    };

    // Options for the student selection dropdown.
    // Enhanced label to show both name and a truncated ID for clarity.
    const studentOptions = [
        { value: '', label: 'Select a Student...' },
        ...students.map(s => ({
            value: s.id,
            // Construct label carefully to avoid syntax issues.
            label: s.name + ' (ID: ' + (s.studentDetailsId || s.id.substring(0, 6)) + ')'
        }))
    ];

    return (
        <div className="container mx-auto p-4 sm:p-6">
            {/* Page Header and Add Log Button */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center">
                    <StudentListIcon className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
                    Student Wellness Log Management
                </h1>
                <Button onClick={openLogModal} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="mt-4 sm:mt-0" disabled={!selectedStudentId}>
                    Add New Log Entry
                </Button>
            </div>

            {/* Student Selection Dropdown */}
            <div className="mb-6 bg-white dark:bg-dark-card p-4 rounded-lg shadow-md">
                <Select
                    label="Select Student"
                    id="selectStudentForWellness"
                    options={studentOptions}
                    value={selectedStudentId}
                    onChange={handleStudentSelectChange}
                    disabled={loadingStudents}
                    containerClassName="mb-0"
                />
            </div>

            {/* Conditional Rendering for Log Display */}
            {loadingLogs ? (
                // Loading state
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-2 dark:text-secondary-400">Loading wellness logs...</p>
                </div>
            ) : selectedStudentId && wellnessLogs.length === 0 && !loadingLogs ? (
                // No logs found for selected student
                <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl shadow-md">
                    <CalendarDaysIcon className="w-16 h-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">No Wellness Logs Found</h2>
                    <p className="text-secondary-500 dark:text-secondary-400 mt-2">This student has no wellness logs recorded yet.</p>
                </div>
            ) : !selectedStudentId && !loadingStudents ? (
                // Prompt to select a student
                <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl shadow-md">
                    <StudentListIcon className="w-16 h-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">Please Select a Student</h2>
                    <p className="text-secondary-500 dark:text-secondary-400 mt-2">Choose a student from the dropdown above to view or add wellness logs.</p>
                </div>
            ) : wellnessLogs.length > 0 && (
                // Display wellness logs
                <div className="space-y-4">
                    {wellnessLogs.map(log => (
                        <div key={log.id} className="bg-white dark:bg-dark-card rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                    {/* Mood Icon Display */}
                                    <MoodIconDisplay mood={log.mood} className={`w-8 h-8 mr-3 ${log.mood === 'happy' || log.mood === 'calm' ? 'text-green-500' : log.mood === 'okay' ? 'text-yellow-500' : 'text-red-500'}`} />
                                    <div>
                                        <p className="text-lg font-semibold text-primary-700 dark:text-primary-300 capitalize">{log.mood}</p>
                                        <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                            Logged: {new Date(log.entryDate).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                    By: {log.loggedByDoctorName || log.studentName || 'Student Self-log'}
                                </p>
                            </div>
                            {log.notes && <p className="text-sm text-secondary-700 dark:text-secondary-200 mt-2 whitespace-pre-wrap">{log.notes}</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Wellness Log Modal */}
            <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title={`Add Wellness Log for ${students.find(s=>s.id === selectedStudentId)?.name || 'Student'}`}>
                <form onSubmit={e => { e.preventDefault(); handleLogSubmit(); }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Select Mood</label>
                        <div className="flex flex-wrap gap-2">
                            {moodOptions.map(opt => {
                                const Icon = opt.icon;
                                return (
                                    <Button
                                        type="button"
                                        key={opt.value}
                                        onClick={() => setNewLogData(prev => ({ ...prev, mood: opt.value }))}
                                        variant={newLogData.mood === opt.value ? 'primary' : 'secondary'}
                                        className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all ${newLogData.mood === opt.value ? 'ring-2 ring-offset-1 ring-primary-500 dark:ring-primary-400' : ''}`}
                                        aria-pressed={newLogData.mood === opt.value}
                                    >
                                        <Icon className={`w-5 h-5 mr-2 ${newLogData.mood === opt.value ? 'text-white' : opt.value === 'happy' || opt.value === 'calm' ? 'text-green-500' : opt.value === 'okay' ? 'text-yellow-500' : 'text-red-500'}`} />
                                        {opt.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                    <Input
                        label="Notes (Optional)"
                        id="logNotes"
                        type="textarea"
                        rows={4}
                        value={newLogData.notes}
                        onChange={e => setNewLogData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any specific observations or details..."
                    />
                    <div className="flex justify-end space-x-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={submittingLog}>
                            {submittingLog ? 'Submitting...' : 'Submit Log'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DoctorStudentWellnessLogPage;
