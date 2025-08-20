
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { StudentDashboardData, WellnessLogEntry, CourseProgress, UpcomingEventOrAssignment, Award } from '../../types'; 
import { StudentIcon, AwardIcon, SyllabusIcon, ExamsIcon, HomeIcon, MoodHappyIcon, MoodOkayIcon, MoodSadIcon, CheckCircleIcon, ArrowRightIcon, UsersIcon as ForumIcon } from '../../assets/icons';
import { Link } from 'react-router-dom'; 
import { useToast } from '../../hooks/useToast';
import WidgetCard from '../../components/common/WidgetCard';
import Button from '../../components/common/Button';
import ProgressBar from '../../components/common/ProgressBar';
import DashboardStatCard from '../../components/common/DashboardStatCard';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai"; // Corrected imports


const API_URL = 'http://localhost:3001/api';

type MoodOption = 'happy' | 'okay' | 'sad';
const moodIcons: Record<MoodOption, React.ElementType> = {
    happy: MoodHappyIcon,
    okay: MoodOkayIcon,
    sad: MoodSadIcon,
};


const StudentDashboardPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const [dashboardData, setDashboardData] = useState<Omit<StudentDashboardData, 'tipOfTheDay'> | null>(null); 
  const [tipOfTheDay, setTipOfTheDay] = useState<string>("Loading tip...");
  const [loading, setLoading] = useState(true);
  const [loadingTip, setLoadingTip] = useState(true);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [moodSubmittedToday, setMoodSubmittedToday] = useState(false);

  const apiKey = typeof window !== 'undefined' ? (window as any).process?.env?.API_KEY : undefined;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("Gemini API key not found. AI features will be disabled.");
  }


  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dashboard/student/${user.id}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch student dashboard data');
      const data: Omit<StudentDashboardData, 'tipOfTheDay'> = await response.json(); 
      setDashboardData(data);
    } catch (error) {
      console.error("Fetch student dashboard error:", error);
      addToast({ type: 'error', message: 'Could not load your dashboard.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  const fetchAiTip = useCallback(async () => {
    if (!ai) {
        setTipOfTheDay("AI Tip service unavailable.");
        setLoadingTip(false);
        return;
    }
    setLoadingTip(true);
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({ // Use GenerateContentResponse
            model: 'gemini-2.5-flash-preview-04-17', // Correct Model
            contents: "Provide a short, encouraging, and educational tip for a student today.",
        });
        setTipOfTheDay(response.text); // Access text property directly
    } catch (error) {
        console.error("Error fetching AI tip:", error);
        setTipOfTheDay("Could not fetch a tip today. Keep learning!");
    } finally {
        setLoadingTip(false);
    }
  }, [ai]); // Removed addToast from dependencies as it's not directly used here

  const fetchTodaysWellness = useCallback(async () => {
    if (!user) return;
    try {
        const response = await fetch(`${API_URL}/student/${user.id}/wellness/today`, { headers: getAuthHeaders() });
        if (response.ok) {
            const data: WellnessLogEntry | null = await response.json(); 
            if (data) {
                setSelectedMood(data.mood as MoodOption);
                setMoodSubmittedToday(true);
            }
        }
    } catch (error) {
        console.error("Error fetching today's wellness:", error);
    }
  }, [user, getAuthHeaders]);

  useEffect(() => {
    fetchDashboardData();
    fetchTodaysWellness();
    fetchAiTip();
  }, [fetchDashboardData, fetchTodaysWellness, fetchAiTip]);

  const handleMoodSelect = async (mood: MoodOption) => {
    if (!user || moodSubmittedToday) return;
    setSelectedMood(mood);
    try {
        const response = await fetch(`${API_URL}/student/wellness`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ studentUserId: user.id, mood: mood })
        });
        if (!response.ok) {
            setSelectedMood(null);
            throw new Error('Failed to submit mood.');
        }
        addToast({ type: 'success', message: 'Thanks for sharing your mood!' });
        setMoodSubmittedToday(true);
    } catch (error: any) {
        addToast({ type: 'error', message: error.message || 'Could not save mood.' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  if (!dashboardData) {
    return <div className="text-center py-10">Failed to load dashboard data. Please try again later.</div>;
  }

  const { awards, courses, upcoming, points, recentGrades, notificationsCount, liveExamsCount, forumPostsCount } = dashboardData;
  const badges = dashboardData.badges || [];

  const quickStats = [
    {id: 'live-exams', title: "Live Exams", value: liveExamsCount ?? 0, icon: ExamsIcon, bgColorClass: 'bg-gradient-to-br from-purple-500 to-purple-600', linkTo: '/student/exams'},
    {id: 'forum-posts', title: "Forum Posts", value: forumPostsCount ?? 0, icon: ForumIcon, bgColorClass: 'bg-gradient-to-br from-pink-500 to-pink-600', linkTo: '/student/forum'},
    {id: 'awards-count', title: "My Awards", value: awards.length, icon: AwardIcon, bgColorClass: 'bg-gradient-to-br from-yellow-500 to-yellow-600', linkTo: '/student/awards'},
  ];


  return (
    <div className="container mx-auto space-y-6 sm:space-y-8 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start">
        <div className="flex items-center mb-4 sm:mb-0">
            <StudentIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mr-3 sm:mr-4" />
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800">My Dashboard</h1>
                {user && <p className="text-secondary-600 text-sm sm:text-base">Welcome back, {user.name}!</p>}
            </div>
        </div>
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-lg shadow-lg text-center sm:text-left">
            <p className="text-sm font-semibold">Experience Points</p>
            <p className="text-3xl font-bold">{points || 0} XP</p>
            {badges.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Badges:</p>
                    <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                        {badges.map(badge => (
                            <span key={badge} className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-semibold">{badge}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {quickStats.map(stat => <DashboardStatCard key={stat.id} {...stat} />)}
      </div>


      <WidgetCard title="How are you feeling today?" className="bg-secondary-50 dark:bg-dark-card">
        {moodSubmittedToday ? (
            <div className="flex items-center text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-700 dark:bg-opacity-20 p-4 rounded-md shadow">
                <CheckCircleIcon className="w-8 h-8 mr-3"/>
                <div>
                    <p className="font-semibold">Thanks for sharing!</p>
                    <p className="text-sm">You selected: <span className="capitalize font-medium">{selectedMood}</span></p>
                </div>
            </div>
        ) : (
            <div className="flex justify-around items-center p-2 space-x-2 sm:space-x-4">
                {(['happy', 'okay', 'sad'] as MoodOption[]).map(mood => {
                    const Icon = moodIcons[mood];
                    return (
                        <button
                            key={mood}
                            onClick={() => handleMoodSelect(mood)}
                            className={`p-3 sm:p-4 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-400 hover:shadow-lg dark:bg-secondary-700 dark:hover:bg-secondary-600
                                ${selectedMood === mood ? 'bg-primary-500 text-white scale-110 shadow-lg' : 'bg-white hover:bg-secondary-100 text-secondary-600 shadow'}`}
                            aria-label={`Select mood ${mood}`}
                        >
                            <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
                        </button>
                    );
                })}
            </div>
        )}
      </WidgetCard>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WidgetCard title="My Courses" size="medium" className="lg:col-span-2">
          {courses.length > 0 ? (
            <ul className="space-y-4">
              {courses.map(course => (
                <li key={course.id} className="p-3 bg-white dark:bg-secondary-700 rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-1">
                    <Link to={`/student/courses/${course.id}`} className="text-sm font-medium text-primary-600 dark:text-primary-300 hover:underline">{course.name}</Link> 
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">{course.progress}%</span>
                  </div>
                  <ProgressBar progress={course.progress} colorClass={course.colorClass} showPercentage />
                </li>
              ))}
            </ul>
          ) : <p className="text-secondary-500 dark:text-secondary-400">No courses enrolled yet.</p>}
           <Link to="/student/courses" className="block mt-4 text-right"> 
                <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>View All Courses</Button>
           </Link> 
        </WidgetCard>

        <WidgetCard title="Upcoming Deadlines" size="medium" className="lg:col-span-1">
            {upcoming.length > 0 ? (
                <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {upcoming.map(item => (
                        <li key={item.id} className="p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-colors shadow">
                            <p className="font-semibold text-sm text-secondary-700 dark:text-dark-text">{item.title}</p>
                            <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                Due: {new Date(item.dueDate).toLocaleDateString()} - <span className={`capitalize px-1.5 py-0.5 rounded text-xs font-medium ${item.type === 'exam' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200' : 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-200'}`}>{item.type}</span>
                            </p>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-secondary-500 dark:text-secondary-400">No upcoming deadlines. Great job!</p>}
        </WidgetCard>
        
        <WidgetCard title="Recent Grades" size="medium">
            {recentGrades.length > 0 ? (
                <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {recentGrades.map(grade => (
                         <li key={grade.id} className="flex justify-between items-center p-3 border-b border-secondary-100 dark:border-dark-border last:border-0 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-md">
                            <span className="text-sm text-secondary-700 dark:text-dark-text">{grade.examName}</span>
                            <span className={`font-bold text-sm ${ (grade.marksObtained || 0) >= 80 ? 'text-green-600 dark:text-green-400' : (grade.marksObtained || 0) >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                {grade.marksObtained !== null && grade.marksObtained !== undefined ? `${grade.marksObtained}%` : 'N/A'}
                            </span>
                        </li>
                    ))}
                </ul>
            ): <p className="text-secondary-500 dark:text-secondary-400">No recent grades posted.</p>}
             <Link to="/student/grades" className="block mt-4 text-right"> 
                <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>View All Grades</Button>
           </Link> 
        </WidgetCard>

        <WidgetCard title="Tip of the Day" size="medium" className="bg-sky-50 dark:bg-sky-700 dark:bg-opacity-30 lg:col-span-1 lg:col-start-3">
            {loadingTip ? <p className="text-sky-700 dark:text-sky-300 italic">Fetching today's tip...</p> : <p className="text-sky-700 dark:text-sky-300 italic">{tipOfTheDay}</p>}
        </WidgetCard>

      </div>
       <p className="mt-8 text-center text-sm text-secondary-500 dark:text-secondary-400">
        Your academic journey, simplified. More features coming soon!
       </p>
    </div>
  );
};

export default StudentDashboardPage;
