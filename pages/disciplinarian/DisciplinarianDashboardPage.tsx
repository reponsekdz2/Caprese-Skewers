import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DisciplinarianIcon, ReportIcon, UsersIcon, PlusIcon, ArrowRightIcon, UsersIcon as DisciplineRulesIcon } from '../../assets/icons';
import { Link, useNavigate } from 'react-router-dom'; // Changed import
import { useToast } from '../../hooks/useToast';
import WidgetCard from '../../components/common/WidgetCard';
import DashboardStatCard from '../../components/common/DashboardStatCard';
import Button from '../../components/common/Button';

interface DisciplinarianDashboardData {
    openIncidentCases: number;
    incidentsThisWeek: number;
    incidentTypeBreakdown: { type: string, count: number, color: string }[];
    recentIncidents: { id: string, description: string, date: string, studentName: string }[];
}


const API_URL = 'http://localhost:3001/api';

const DisciplinarianDashboardPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate(); // Changed usage
  const [dashboardData, setDashboardData] = useState<DisciplinarianDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if(!user) return;
    setLoading(true);
    try {
        const response = await fetch (`${API_URL}/dashboard/disciplinarian/${user.id}`, { headers: getAuthHeaders() });
        if(!response.ok) throw new Error('Failed to fetch Disciplinarian dashboard data');
        const data: DisciplinarianDashboardData = await response.json();
        setDashboardData(data);
    } catch (error) {
        console.error("Fetch Disciplinarian dashboard error:", error);
        addToast({ type: 'error', message: 'Could not load dashboard data.'});
    } finally {
        setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  if (!dashboardData) {
    return <div className="text-center py-10">Failed to load dashboard data. Please try again later.</div>;
  }
  
  const { openIncidentCases, incidentsThisWeek, incidentTypeBreakdown, recentIncidents } = dashboardData;

  const statCards = [
    {id: 'open-cases', title: "Open Incident Cases", value: openIncidentCases, icon: ReportIcon, bgColorClass: 'bg-gradient-to-br from-red-500 to-red-600', linkTo: '/disciplinarian/incidents?status=open'},
    {id: 'incidents-week', title: "Incidents This Week", value: incidentsThisWeek, icon: ReportIcon, bgColorClass: 'bg-gradient-to-br from-orange-500 to-orange-600', linkTo: '/disciplinarian/incidents?filter=thisweek'},
    {id: 'discipline-rules', title: "Manage Discipline Rules", value: "View/Edit", icon: DisciplineRulesIcon, bgColorClass: 'bg-gradient-to-br from-blue-500 to-blue-600', linkTo: '/disciplinarian/rules'}
  ];

  return (
    <div className="container mx-auto space-y-6 sm:space-y-8 p-4">
      <div className="flex items-center">
        <DisciplinarianIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mr-3 sm:mr-4" />
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800">Dean's Office</h1>
            {user && <p className="text-secondary-600 text-sm sm:text-base">Welcome, {user.name}!</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map(stat => <DashboardStatCard key={stat.id} {...stat} />)}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetCard title="Incident Type Breakdown" size="large" className="lg:col-span-2">
            <div className="flex flex-wrap gap-3">
                {incidentTypeBreakdown.map(item => (
                    <div key={item.type} className={`p-4 rounded-lg text-white ${item.color} flex-grow text-center shadow-md hover:shadow-lg transition-shadow`}>
                        <p className="font-semibold text-lg">{item.type}</p>
                        <p className="text-2xl font-bold">{item.count}</p>
                    </div>
                ))}
            </div>
             <p className="text-sm text-secondary-500 mt-4">Distribution of reported incident categories.</p>
        </WidgetCard>

        <WidgetCard title="Quick Actions" size="medium" className="lg:col-span-1">
            <div className="space-y-3">
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<PlusIcon className="w-5 h-5"/>} onClick={() => navigate('/disciplinarian/incidents')}>Log/View Incidents</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<DisciplineRulesIcon className="w-5 h-5"/>} onClick={() => navigate('/disciplinarian/rules')}>Manage Discipline Rules</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<UsersIcon className="w-5 h-5"/>} onClick={() => navigate('/disciplinarian/conduct')}>View Student Conduct Records</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<ReportIcon className="w-5 h-5"/>} onClick={() => addToast({type: 'info', message: 'Generating conduct reports (WIP)'})}>Generate Conduct Report</Button>
            </div>
        </WidgetCard>
      </div>

      <WidgetCard title="Recent Incidents Log">
         {recentIncidents.length > 0 ? (
            <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {recentIncidents.map(incident => (
                    <li key={incident.id} className="p-3 border-b border-secondary-100 last:border-b-0 hover:bg-secondary-50 rounded-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium text-secondary-700">{incident.description}</p>
                                <p className="text-xs text-secondary-500">Student: {incident.studentName}</p>
                            </div>
                            <p className="text-xs text-secondary-500 flex-shrink-0 ml-2">Date: {new Date(incident.date).toLocaleDateString()}</p>
                        </div>
                    </li>
                ))}
            </ul>
         ) : <p className="text-secondary-500">No recent incidents logged.</p>}
         <Link to="/disciplinarian/incidents" className="block mt-3 text-right"> {/* Changed usage */}
            <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>View All Incidents</Button>
         </Link> {/* Changed usage */}
      </WidgetCard>

      <p className="mt-8 text-center text-sm text-secondary-500">Promoting a positive and safe learning environment.</p>
    </div>
  );
};

export default DisciplinarianDashboardPage;