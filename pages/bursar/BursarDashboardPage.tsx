import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { BursarIcon, FinanceIcon, PayrollIcon, ReportIcon, ArrowRightIcon, UsersIcon, SettingsIcon } from '../../assets/icons';
import { useNavigate, Link } from 'react-router-dom'; // Changed import
import { useToast } from '../../hooks/useToast';
import WidgetCard from '../../components/common/WidgetCard';
import DashboardStatCard from '../../components/common/DashboardStatCard';
import Button from '../../components/common/Button';

interface BursarDashboardData {
    feesCollectedThisMonth: number;
    expensesThisMonth: number;
    pendingPayrollCount: number;
    financialSummary: { totalRevenueYTD: number; totalExpenditureYTD: number };
}

const API_URL = 'http://localhost:3001/api';

const BursarDashboardPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate(); // Changed usage
  const [dashboardData, setDashboardData] = useState<BursarDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dashboard/bursar/${user.id}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch bursar dashboard data');
      const data: BursarDashboardData = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Fetch bursar dashboard error:", error);
      addToast({ type: 'error', message: 'Could not load your dashboard.' });
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
  
  const { feesCollectedThisMonth, expensesThisMonth, pendingPayrollCount, financialSummary } = dashboardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const statCards = [
    {id: 'fees-collected', title: "Fees Collected (Month)", value: formatCurrency(feesCollectedThisMonth), icon: FinanceIcon, bgColorClass: 'bg-gradient-to-br from-green-500 to-green-600', linkTo: '/bursar/fees'},
    {id: 'expenses-month', title: "Expenses (Month)", value: formatCurrency(expensesThisMonth), icon: ReportIcon, bgColorClass: 'bg-gradient-to-br from-red-500 to-red-600', linkTo: '/bursar/expenses'},
    {id: 'pending-payroll', title: "Pending Payrolls", value: pendingPayrollCount, icon: PayrollIcon, bgColorClass: 'bg-gradient-to-br from-yellow-500 to-yellow-600', linkTo: '/admin/finance/payroll'},
    {id: 'all-student-fees', title: "All Student Fees", value: "View", icon: UsersIcon, bgColorClass: 'bg-gradient-to-br from-blue-500 to-blue-600', linkTo: '/bursar/student-fees'}
  ];

  return (
    <div className="container mx-auto space-y-6 sm:space-y-8 p-4">
      <div className="flex items-center">
        <BursarIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 mr-3 sm:mr-4" />
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800">Finance Office Dashboard</h1>
            {user && <p className="text-secondary-600 text-sm sm:text-base">Welcome, {user.name} ({user.role})!</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map(stat => <DashboardStatCard key={stat.id} {...stat} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetCard title="Year-to-Date Financial Summary" size="large" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg shadow">
                    <p className="text-sm text-green-700 font-medium">Total Revenue (YTD)</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.totalRevenueYTD)}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg shadow">
                    <p className="text-sm text-red-700 font-medium">Total Expenditure (YTD)</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.totalExpenditureYTD)}</p>
                </div>
                 <div className="p-4 bg-blue-50 rounded-lg shadow">
                    <p className="text-sm text-blue-700 font-medium">Net Position (YTD)</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(financialSummary.totalRevenueYTD - financialSummary.totalExpenditureYTD)}</p>
                </div>
            </div>
            <div className="mt-6 text-sm text-secondary-500">
                <p>This summary reflects the overall financial health of the institution for the current academic year.</p>
                <div className="mt-4">
                    <h4 className="text-xs font-semibold text-secondary-600 mb-1">Income vs Expense (Visual Placeholder)</h4>
                    <div className="flex items-end space-x-2 h-24">
                        <div className="bg-green-400 w-1/2 rounded-t-sm" style={{height: `${(financialSummary.totalRevenueYTD / (financialSummary.totalRevenueYTD + financialSummary.totalExpenditureYTD || 1)) * 100}%` }} title="Revenue"></div>
                        <div className="bg-red-400 w-1/2 rounded-t-sm" style={{height: `${(financialSummary.totalExpenditureYTD / (financialSummary.totalRevenueYTD + financialSummary.totalExpenditureYTD || 1)) * 100}%`}} title="Expenditure"></div>
                    </div>
                </div>
            </div>
             <Link to="/bursar/reports" className="block mt-4 text-right"> {/* Changed usage */}
                <Button variant="ghost" size="sm" rightIcon={<ArrowRightIcon className="w-4 h-4"/>}>View Detailed Reports</Button>
            </Link> {/* Changed usage */}
        </WidgetCard>

        <WidgetCard title="Quick Actions" size="medium" className="lg:col-span-1">
             <div className="space-y-3">
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<FinanceIcon className="w-5 h-5"/>} onClick={() => navigate('/bursar/fees')}>Record Fee Payment</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<ReportIcon className="w-5 h-5"/>} onClick={() => navigate('/bursar/expenses')}>Add New Expense</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<PayrollIcon className="w-5 h-5"/>} onClick={() => navigate('/admin/finance/payroll')}>Process Payroll</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<UsersIcon className="w-5 h-5"/>} onClick={() => navigate('/bursar/student-fees')}>View All Student Fees</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<SettingsIcon className="w-5 h-5"/>} onClick={() => navigate('/bursar/fee-categories')}>Manage Fee Categories</Button>
                 <Button variant="secondary" className="w-full justify-start text-left" leftIcon={<SettingsIcon className="w-5 h-5"/>} onClick={() => navigate('/bursar/fee-structures')}>Manage Fee Structures</Button>
            </div>
        </WidgetCard>
      </div>
      <p className="mt-8 text-center text-sm text-secondary-500">Managing finances effectively. Advanced reporting tools coming soon.</p>
    </div>
  );
};

export default BursarDashboardPage;