import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FinanceIcon, UsersIcon, ReportIcon, SettingsIcon, PayrollIcon, ArrowRightIcon } from '../../assets/icons';
import { useNavigate } from 'react-router-dom'; // Changed import
import { useToast } from '../../hooks/useToast';
import WidgetCard from '../../components/common/WidgetCard';
import DashboardStatCard from '../../components/common/DashboardStatCard';
import Button from '../../components/common/Button';

const API_URL = 'http://localhost:3001/api';

interface FinanceDashboardData {
    totalFeesDue: number;
    totalFeesCollectedYTD: number;
    totalExpensesYTD: number;
    pendingPayrollCount: number;
    pendingFeeStructures?: number; // Make optional if not always available
}

const FinancePage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate(); // Changed usage
  const [dashboardData, setDashboardData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFinanceDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/finance/admin-dashboard`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch finance dashboard data');
      const data: FinanceDashboardData = await response.json();
      setDashboardData(data);
    } catch (error: any) {
      console.error("Fetch finance dashboard error:", error);
      addToast({ type: 'error', message: error.message || 'Could not load finance overview.' });
      setDashboardData({ totalFeesDue: 0, totalFeesCollectedYTD: 0, totalExpensesYTD: 0, pendingPayrollCount: 0, pendingFeeStructures: 0 });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchFinanceDashboardData();
  }, [fetchFinanceDashboardData]);
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div>;
  }

  if (!dashboardData) {
    return <div className="text-center py-10">Failed to load finance dashboard data. Please try again later.</div>;
  }
  
  const statCards = [
    {id: 'fees-due', title: "Total Outstanding Fees", value: formatCurrency(dashboardData.totalFeesDue), icon: FinanceIcon, bgColorClass: 'bg-gradient-to-br from-red-500 to-red-600', linkTo: '/admin/finance/student-fees'},
    {id: 'fees-collected', title: "Fees Collected (YTD)", value: formatCurrency(dashboardData.totalFeesCollectedYTD), icon: FinanceIcon, bgColorClass: 'bg-gradient-to-br from-green-500 to-green-600', linkTo: '/admin/finance/student-fees'},
    {id: 'expenses-ytd', title: "Expenses (YTD)", value: formatCurrency(dashboardData.totalExpensesYTD), icon: ReportIcon, bgColorClass: 'bg-gradient-to-br from-orange-500 to-orange-600', linkTo: '/admin/finance/expenses'},
    {id: 'payroll-link', title: "Manage Payroll", value: `${dashboardData.pendingPayrollCount} Pending`, icon: PayrollIcon, bgColorClass: 'bg-gradient-to-br from-purple-500 to-purple-600', linkTo: '/admin/finance/payroll'},
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center">
        <FinanceIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mr-3 sm:mr-4" />
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800">Finance Overview</h1>
            {user && <p className="text-secondary-600 text-sm sm:text-base">Welcome, {user.name}! Key financial metrics and actions.</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map(stat => <DashboardStatCard key={stat.id} {...stat} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WidgetCard title="Fee Management Tools" className="lg:col-span-1">
          <ul className="space-y-3">
            <li><Button variant="ghost" className="w-full justify-start" onClick={()=>navigate('/admin/finance/student-fees')} leftIcon={<UsersIcon className="w-5 h-5"/>}>View Student Fee Details</Button></li>
            <li><Button variant="ghost" className="w-full justify-start" onClick={()=>navigate('/admin/finance/fee-categories')} leftIcon={<SettingsIcon className="w-5 h-5"/>}>Manage Fee Categories</Button></li>
            <li><Button variant="ghost" className="w-full justify-start" onClick={()=>navigate('/admin/finance/fee-structures')} leftIcon={<SettingsIcon className="w-5 h-5"/>}>Manage Fee Structures</Button></li>
          </ul>
        </WidgetCard>

        <WidgetCard title="Expense & Payroll" className="lg:col-span-1">
           <ul className="space-y-3">
            <li><Button variant="ghost" className="w-full justify-start" onClick={()=>navigate('/admin/finance/expenses')} leftIcon={<ReportIcon className="w-5 h-5"/>}>Track School Expenses</Button></li>
            <li><Button variant="ghost" className="w-full justify-start" onClick={()=>navigate('/admin/finance/payroll')} leftIcon={<PayrollIcon className="w-5 h-5"/>}>Manage Staff Payroll</Button></li>
          </ul>
        </WidgetCard>
        
        <WidgetCard title="Financial Reports (Coming Soon)" className="lg:col-span-1">
            <p className="text-secondary-500">Detailed financial reports and analytics will be available here.</p>
            <div className="mt-4">
                <Button variant="primary" disabled>Generate Income Statement</Button>
            </div>
        </WidgetCard>
      </div>
      <p className="mt-8 text-center text-sm text-secondary-500">Financial oversight and management hub.</p>
    </div>
  );
};

export default FinancePage;