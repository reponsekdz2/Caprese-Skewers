
import React, { useState, useEffect, useCallback } from 'react';
import { Incident, DisciplineRule } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { UsersIcon as PageIcon, HomeIcon } from '../../assets/icons'; // Using UsersIcon as a placeholder
import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';


const API_URL = 'http://localhost:3001/api';

const ParentChildDisciplinePage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [rules, setRules] = useState<DisciplineRule[]>([]); // To display rule names
  const [loading, setLoading] = useState(true);
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchChildIncidentsAndRules = useCallback(async () => {
    if (!user || !user.childUserId) { // Parent must have a child linked
        addToast({type: 'error', message: 'Child information not found.'});
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const [incidentsRes, rulesRes] = await Promise.all([
        fetch(`${API_URL}/parent/child/${user.childUserId}/incidents`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/discipline/rules`, { headers: getAuthHeaders() }) // Fetch all rules to map names
      ]);

      if (!incidentsRes.ok) throw new Error('Failed to fetch child discipline records.');
      const incidentsData: Incident[] = await incidentsRes.json();
      setIncidents(incidentsData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      if (rulesRes.ok) {
        const rulesData: DisciplineRule[] = await rulesRes.json();
        setRules(rulesData);
      } else {
        console.warn("Could not fetch discipline rules, rule names may not be displayed.");
      }

    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load discipline records.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchChildIncidentsAndRules();
  }, [fetchChildIncidentsAndRules]);

  const getRuleName = (ruleId?: string | null) => {
    if (!ruleId) return 'N/A';
    return rules.find(r => r.id === ruleId)?.ruleName || 'Unknown Rule';
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600" />
          Child's Discipline Record
        </h1>
        <Link to="/parent/dashboard">
            <Button variant="secondary" size="sm" leftIcon={<HomeIcon className="w-4 h-4"/>}>
                Back to Dashboard
            </Button>
        </Link>
      </div>

      {loading ? (
         <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading discipline records...</p>
        </div>
      ) : incidents.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Incident Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Rule Broken</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Action Taken</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(incident.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700">{incident.type}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-600 max-w-md break-words" title={incident.description}>{incident.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{getRuleName(incident.ruleId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            incident.status === 'Open' ? 'bg-red-100 text-red-800' :
                            incident.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                            incident.status === 'Resolved' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800' // Closed
                        }`}>
                            {incident.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-secondary-500 max-w-xs break-words" title={incident.actionTaken || undefined}>{incident.actionTaken || 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">No Discipline Incidents Found</h2>
          <p className="text-secondary-500 mt-2">Your child has a clean discipline record. Great job!</p>
        </div>
      )}
    </div>
  );
};

export default ParentChildDisciplinePage;
