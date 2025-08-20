import React, { useState, useEffect, useCallback } from 'react';
import { TransportVehicle, TransportRoute, User, UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { TransportIcon as PageIcon, PlusIcon, EditIcon, DeleteIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

type ManageMode = 'vehicles' | 'routes';

const TransportPage: React.FC = () => {
  const [mode, setMode] = useState<ManageMode>('vehicles');
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVehicleData, setCurrentVehicleData] = useState<Partial<TransportVehicle>>({vehicleNumber: '', model: '', capacity: 0, driverId: ''});
  const [currentRouteData, setCurrentRouteData] = useState<Partial<TransportRoute> & { stopsString?: string }>({routeName: '', vehicleId: '', stopsString: ''});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false); // For fetching
  const [savingData, setSavingData] = useState(false); // For submitting forms

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [vehiclesRes, routesRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/transport/vehicles`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/transport/routes`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/users`, { headers: getAuthHeaders() }), 
      ]);
      if (!vehiclesRes.ok) throw new Error(`Failed to fetch vehicles: ${vehiclesRes.statusText}`);
      if (!routesRes.ok) throw new Error(`Failed to fetch routes: ${routesRes.statusText}`);
      if (!usersRes.ok) throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
      
      setVehicles(await vehiclesRes.json());
      setRoutes(await routesRes.json());
      const allUsers: User[] = await usersRes.json();
      setDrivers(allUsers.filter(u => u.role === UserRole.STAFF || u.occupation?.toLowerCase().includes('driver'))); 

    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load transport data.' });
    } finally {
      setLoadingData(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVehicleInputChange = (key: keyof Partial<TransportVehicle>, value: string | number | null) => {
    setCurrentVehicleData(prev => ({ ...prev, [key]: value }));
  };
  
  const handleRouteInputChange = (key: keyof Partial<TransportRoute> | 'stopsString', value: string | null) => {
    setCurrentRouteData(prev => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async () => {
    setSavingData(true);
    let url, payload, method;

    if (mode === 'vehicles') {
        if (!currentVehicleData.vehicleNumber || !currentVehicleData.model || currentVehicleData.capacity == null || Number(currentVehicleData.capacity) <=0) {
            addToast({ type: 'error', message: 'Vehicle Number, Model, and valid Capacity are required.' });
            setSavingData(false);
            return;
        }
        url = editingId ? `${API_URL}/transport/vehicles/${editingId}` : `${API_URL}/transport/vehicles`;
        payload = { ...currentVehicleData, capacity: Number(currentVehicleData.capacity), driverId: currentVehicleData.driverId || null };
        method = editingId ? 'PUT' : 'POST';
    } else { 
        if (!currentRouteData.routeName || !currentRouteData.stopsString) {
            addToast({ type: 'error', message: 'Route Name and Stops are required.' });
            setSavingData(false);
            return;
        }
        try {
            const stops = currentRouteData.stopsString.split('\n').map(line => {
                const parts = line.split(',');
                const name = parts[0]?.trim();
                const time = parts[1]?.trim();
                if (!name || !time || !/^\d{2}:\d{2}$/.test(time)) throw new Error("Invalid stop format. Use 'Stop Name, HH:MM' on each line.");
                return { name, time };
            }).filter(stop => stop.name && stop.time); // Filter out any empty lines from parsing
            
            if (stops.length === 0 && currentRouteData.stopsString.trim() !== '') {
                 throw new Error("No valid stops found. Please check the format.");
            }
            payload = { routeName: currentRouteData.routeName, vehicleId: currentRouteData.vehicleId || null, stops };
        } catch(e: any) {
             addToast({ type: 'error', message: e.message || 'Error parsing stops.' });
             setSavingData(false);
             return;
        }
        url = editingId ? `${API_URL}/transport/routes/${editingId}` : `${API_URL}/transport/routes`;
        method = editingId ? 'PUT' : 'POST';
    }
    
    try {
      const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to save ${mode === 'vehicles' ? 'vehicle' : 'route'}`);
      }
      addToast({ type: 'success', message: `${mode === 'vehicles' ? 'Vehicle' : 'Route'} saved successfully!` });
      fetchData();
      closeModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setSavingData(false);
    }
  };
  
  const openModal = (type: ManageMode, id: string | null = null) => {
    setMode(type);
    setEditingId(id);
    if (type === 'vehicles') {
        const vehicle = id ? vehicles.find(v => v.id === id) : null;
        setCurrentVehicleData(vehicle || { vehicleNumber: '', model: '', capacity: 0, driverId: '' });
    } else {
        const route = id ? routes.find(r => r.id === id) : null;
        setCurrentRouteData(route ? { ...route, stopsString: route.stops.map(s => `${s.name}, ${s.time}`).join('\n') } : { routeName: '', vehicleId: '', stopsString: '' });
    }
    setIsModalOpen(true);
  };
  
  const handleDelete = async (type: ManageMode, id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'vehicles' ? 'vehicle' : 'route'}?`)) return;
    setSavingData(true);
    const url = type === 'vehicles' ? `${API_URL}/transport/vehicles/${id}` : `${API_URL}/transport/routes/${id}`;
    try {
      const response = await fetch(url, { method: 'DELETE', headers: getAuthHeaders() });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message ||`Failed to delete ${type === 'vehicles' ? 'vehicle' : 'route'}`);
      }
      addToast({ type: 'success', message: `${type === 'vehicles' ? 'Vehicle' : 'Route'} deleted.`});
      fetchData();
    } catch (error:any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setSavingData(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setCurrentVehicleData({vehicleNumber: '', model: '', capacity: 0, driverId: ''});
    setCurrentRouteData({routeName: '', vehicleId: '', stopsString: ''});
  };
  
  const driverOptions = [{value: '', label: 'Unassigned'}, ...drivers.map(d => ({value: d.id, label: d.name}))];
  const vehicleOptions = [{value: '', label: 'Unassigned'}, ...vehicles.map(v => ({value: v.id, label: `${v.model} (${v.vehicleNumber})`}))];


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
          Transport Management
        </h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
            <Button onClick={() => setMode('vehicles')} variant={mode === 'vehicles' ? 'primary' : 'secondary'}>Manage Vehicles</Button>
            <Button onClick={() => setMode('routes')} variant={mode === 'routes' ? 'primary' : 'secondary'}>Manage Routes</Button>
        </div>
      </div>

      <Button onClick={() => openModal(mode)} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} className="mb-6">
        Add New {mode === 'vehicles' ? 'Vehicle' : 'Route'}
      </Button>

      {loadingData && <p className="text-center py-6 dark:text-secondary-400">Loading transport data...</p>}

      {mode === 'vehicles' && !loadingData && (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden">
            <h2 className="text-xl p-4 font-semibold text-secondary-700 dark:text-dark-text border-b dark:border-dark-border">Vehicles</h2>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-dark-border">
              <thead className="bg-secondary-50 dark:bg-secondary-700"><tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Vehicle No.</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Model</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Capacity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Driver</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-secondary-100 dark:divide-dark-border">
                {vehicles.map(v => <tr key={v.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                    <td className="px-4 py-2 text-sm dark:text-dark-text">{v.vehicleNumber}</td><td className="px-4 py-2 text-sm dark:text-secondary-300">{v.model}</td><td className="px-4 py-2 text-sm dark:text-secondary-300">{v.capacity}</td>
                    <td className="px-4 py-2 text-sm dark:text-secondary-300">{drivers.find(d=>d.id === v.driverId)?.name || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => openModal('vehicles', v.id)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label={`Edit vehicle ${v.vehicleNumber}`}/>
                        <Button size="sm" variant="danger" onClick={() => handleDelete('vehicles', v.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label={`Delete vehicle ${v.vehicleNumber}`} disabled={savingData}/>
                    </td>
                </tr>)}
              </tbody>
            </table>
            </div>
            {vehicles.length === 0 && <p className="p-4 text-center text-secondary-500 dark:text-secondary-400">No vehicles added yet.</p>}
        </div>
      )}

      {mode === 'routes' && !loadingData && (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg overflow-hidden mt-6">
             <h2 className="text-xl p-4 font-semibold text-secondary-700 dark:text-dark-text border-b dark:border-dark-border">Routes</h2>
             <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-secondary-200 dark:divide-dark-border">
              <thead className="bg-secondary-50 dark:bg-secondary-700"><tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Route Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Assigned Vehicle</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Number of Stops</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-secondary-100 dark:divide-dark-border">
                {routes.map(r => <tr key={r.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800">
                    <td className="px-4 py-2 text-sm dark:text-dark-text">{r.routeName}</td>
                    <td className="px-4 py-2 text-sm dark:text-secondary-300">{vehicles.find(v=>v.id === r.vehicleId)?.vehicleNumber || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm dark:text-secondary-300">{r.stops.length}</td>
                    <td className="px-4 py-2 text-sm space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => openModal('routes', r.id)} leftIcon={<EditIcon className="w-4 h-4"/>} aria-label={`Edit route ${r.routeName}`}/>
                        <Button size="sm" variant="danger" onClick={() => handleDelete('routes', r.id)} leftIcon={<DeleteIcon className="w-4 h-4"/>} aria-label={`Delete route ${r.routeName}`} disabled={savingData}/>
                    </td>
                </tr>)}
              </tbody>
             </table>
             </div>
             {routes.length === 0 && <p className="p-4 text-center text-secondary-500 dark:text-secondary-400">No routes added yet.</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? `Edit ${mode === 'vehicles' ? 'Vehicle' : 'Route'}` : `Add New ${mode === 'vehicles' ? 'Vehicle' : 'Route'}`} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
          {mode === 'vehicles' ? (
            <>
              <Input label="Vehicle Number/Plate" id="vehicleNumber" value={currentVehicleData.vehicleNumber || ''} onChange={e => handleVehicleInputChange('vehicleNumber', e.target.value)} required />
              <Input label="Model (e.g., Toyota Coaster)" id="model" value={currentVehicleData.model || ''} onChange={e => handleVehicleInputChange('model', e.target.value)} required />
              <Input label="Capacity (Seats)" id="capacity" type="number" value={currentVehicleData.capacity || 0} onChange={e => handleVehicleInputChange('capacity', parseInt(e.target.value,10))} required min="1"/>
              <Select label="Assign Driver (Optional)" id="driverId" options={driverOptions} value={currentVehicleData.driverId || ''} onChange={e => handleVehicleInputChange('driverId', e.target.value || null)} />
            </>
          ) : (
            <>
              <Input label="Route Name" id="routeName" value={currentRouteData.routeName || ''} onChange={e => handleRouteInputChange('routeName', e.target.value)} required />
              <Select label="Assign Vehicle (Optional)" id="routeVehicleId" options={vehicleOptions} value={currentRouteData.vehicleId || ''} onChange={e => handleRouteInputChange('vehicleId', e.target.value || null)} />
              <Input 
                label="Stops (One per line: Stop Name, HH:MM)" 
                id="stopsString" 
                type="textarea" 
                rows={5} 
                value={currentRouteData.stopsString || ''} 
                onChange={e => handleRouteInputChange('stopsString', e.target.value)} 
                placeholder={'Example:\nMain Gate, 07:00\nLibrary Stop, 07:15\nSports Complex, 07:30'} 
                required 
              />
            </>
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingData}>
              {savingData ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransportPage;