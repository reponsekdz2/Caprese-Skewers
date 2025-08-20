import React, { useState, useEffect, useCallback } from 'react';
import { SchoolSetting } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { SettingsIcon as PageIcon } from '../../assets/icons'; // EditIcon, DeleteIcon removed if not adding/deleting individual settings

const API_URL = 'http://localhost:3001/api';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SchoolSetting[]>([]);
  const [editableSettings, setEditableSettings] = useState<Record<string, string>>({}); // Store values as strings for input
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/settings`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data: SchoolSetting[] = await response.json();
      setSettings(data);
      // Initialize editableSettings with current values as strings
      const initialEditable: Record<string, string> = {};
      data.forEach(s => {
        initialEditable[s.key] = String(s.value); // Convert all to string for input
      });
      setEditableSettings(initialEditable);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load settings.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (key: string, value: string) => {
    setEditableSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAllSettings = async () => {
    setSaving(true);
    
    // Prepare payload: Convert string values back to original types if necessary,
    // or let the server handle string-to-type conversion.
    // For simplicity, sending strings and server converts based on key.
    // A more robust solution would involve metadata about setting types.
    const payload = settings.map(setting => ({
        key: setting.key,
        value: editableSettings[setting.key] // Send as string
    }));

    try {
      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload), // Send array of {key, value} objects
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to update settings`);
      }
      const responseData = await response.json();
      addToast({ type: 'success', message: responseData.message || 'Settings updated successfully!' });
      // Re-fetch or update local state from responseData.settings if needed
      setSettings(responseData.settings || settings); // Update with potentially new/processed settings from server
       const updatedEditable: Record<string, string> = {};
       (responseData.settings || settings).forEach((s: SchoolSetting) => {
        updatedEditable[s.key] = String(s.value);
      });
      setEditableSettings(updatedEditable);

    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center">
          <PageIcon className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
          System Settings
        </h1>
        <Button onClick={handleSaveAllSettings} variant="primary" disabled={saving || loading} className="mt-4 sm:mt-0">
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
      <p className="text-secondary-600 dark:text-secondary-300 mb-6">
        Manage general school settings and system preferences. Be cautious when editing these values.
      </p>

      {loading ? (
        <div className="text-center py-10 dark:text-secondary-400">Loading settings...</div>
      ) : settings.length > 0 ? (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg p-6 space-y-6">
          {settings.map(setting => (
            <div key={setting.id} className="border-b dark:border-dark-border pb-4 last:border-b-0 last:pb-0">
              <label htmlFor={`setting-${setting.key}`} className="block text-sm font-medium text-secondary-700 dark:text-secondary-200">{setting.description || setting.key}</label>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">Key: <code className="bg-secondary-100 dark:bg-secondary-700 px-1 rounded">{setting.key}</code></p>
              {typeof setting.value === 'boolean' ? (
                <select
                  id={`setting-${setting.key}`}
                  value={editableSettings[setting.key] || String(setting.value)}
                  onChange={(e) => handleInputChange(setting.key, e.target.value)}
                  className="mt-1 block w-full sm:w-1/2 p-2 border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:text-dark-text"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <Input
                  id={`setting-${setting.key}`}
                  type={typeof setting.value === 'number' ? 'number' : 'text'}
                  value={editableSettings[setting.key] || ''}
                  onChange={(e) => handleInputChange(setting.key, e.target.value)}
                  containerClassName="mb-0"
                  className="mt-1 sm:w-1/2"
                  placeholder={`Enter value for ${setting.key}`}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
         <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl shadow-md">
          <PageIcon className="w-16 h-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">No Settings Configured</h2>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2">
            System settings are not available or could not be loaded. Default settings might be in use.
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;