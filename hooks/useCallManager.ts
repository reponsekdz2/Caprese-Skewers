
import { useContext } from 'react';
import CallContext from '../contexts/CallContext';
import { CallContextType } from '../types';

export const useCallManager = (): CallContextType => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCallManager must be used within a CallProvider');
  }
  return context;
};