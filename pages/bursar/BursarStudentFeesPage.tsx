import React, { useState, useEffect, useCallback } from 'react';
import { StudentFeeSummary, FeePayment, FeeStructure, FeeCategory } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { FinanceIcon, UsersIcon, EyeIcon, PlusIcon } from '../../assets/icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useParams, useNavigate } from 'react-router-dom'; // Changed import


const API_URL = 'http://localhost:3001/api';

export const BursarStudentFeesPage: React.FC = () => {
  const [studentFeeSummaries, setStudentFeeSummaries] = useState<StudentFeeSummary[]>([]);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentFeeSummary | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState<Partial<FeePayment>>({
    amountPaid: 0, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'cash',
  });
  const [allFeeStructures, setAllFeeStructures] = useState<FeeStructure[]>([]);
  const [allFeeCategories, setAllFeeCategories] = useState<FeeCategory[]>([]);


  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const params = useParams(); // Changed usage
  const navigate = useNavigate(); // Changed usage

  const fetchAllStudentFeeSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/bursar/all-student-fees`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch student fee summaries');
      const data: StudentFeeSummary[] = await response.json();
      setStudentFeeSummaries(data);
    } catch (error) {
      console.error("Fetch fee summaries error:", error);
      addToast({ type: 'error', message: 'Failed to load student fee summaries.' });
    } finally {
      setLoading(false);
    }
  }, [addToast, getAuthHeaders]);

  const fetchStudentFeeDetail = useCallback(async (studentId: string) => {
    setLoading(true);
    try {
        const response = await fetch(`${API_URL}/bursar/student-fees/${studentId}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch student fee details');
        const data: StudentFeeSummary = await response.json();
        setSelectedStudentDetail(data);
        setIsDetailModalOpen(true);
    } catch (error) {
        console.error("Fetch student fee detail error:", error);
        addToast({ type: 'error', message: 'Failed to load detailed fee information for the student.' });
    } finally {
        setLoading(false);
    }
  }, [addToast, getAuthHeaders]);

  const fetchSupportingFinanceData = useCallback(async () => {
    try {
        const [structRes, catRes] = await Promise.all([
            fetch(`${API_URL}/finance/fee-structures`, { headers: getAuthHeaders() }),
            fetch(`${API_URL}/finance/fee-categories`, { headers: getAuthHeaders() })
        ]);
        if (structRes.ok) {
          const structData = await structRes.json();
          setAllFeeStructures(Array.isArray(structData) ? structData : []);
        } else {
          setAllFeeStructures([]);
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setAllFeeCategories(Array.isArray(catData) ? catData : []);
        } else {
          setAllFeeCategories([]);
        }
    } catch (error) {
        console.error("Error fetching fee structures/categories", error);
        setAllFeeStructures([]);
        setAllFeeCategories([]);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchAllStudentFeeSummaries();
    fetchSupportingFinanceData();
  }, [fetchAllStudentFeeSummaries, fetchSupportingFinanceData]);

  useEffect(() => {
    if (params.studentId && !isDetailModalOpen && !selectedStudentDetail) {
        fetchStudentFeeDetail(params.studentId);
    }
  }, [params.studentId, fetchStudentFeeDetail, isDetailModalOpen, selectedStudentDetail]);


  const handleViewDetails = (studentId: string) => {
    navigate(`/bursar/student-fees/${studentId}`);
  };

  const openPaymentModal = (student: StudentFeeSummary) => {
    setSelectedStudentDetail(student); // Keep student context for payment
    setNewPaymentData({ studentId: student.studentId, amountPaid: 0, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'cash', feeStructureId: '', feeCategoryId: ''});
    setIsPaymentModalOpen(true);
  };

  const handlePaymentInputChange = (key: keyof FeePayment, value: string | number) => {
    setNewPaymentData(prev => ({ ...prev, [key]: value }));
  };

  const handleRecordPayment = async () => {
    if (!selectedStudentDetail || newPaymentData.amountPaid == null || Number(newPaymentData.amountPaid) <= 0) {
        addToast({type: 'error', message: 'Valid amount is required.'});
        return;
    }
    if (!newPaymentData.feeStructureId && !newPaymentData.feeCategoryId) {
        addToast({type: 'error', message: 'Please select a Fee Structure or Fee Category for the payment.'});
        return;
    }
    
    setLoading(true);
    try {
        const payload = { ...newPaymentData, studentId: selectedStudentDetail.studentId, amountPaid: Number(newPaymentData.amountPaid) };
        const response = await fetch(`${API_URL}/finance/payments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Failed to record payment.");
        }
        addToast({type: 'success', message: "Payment recorded successfully!"});
        fetchAllStudentFeeSummaries();
        if (isDetailModalOpen && selectedStudentDetail) {
            fetchStudentFeeDetail(selectedStudentDetail.studentId);
        }
        setIsPaymentModalOpen(false);
    } catch (error: any) {
        addToast({type: 'error', message: error.message});
    } finally {
        setLoading(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedStudentDetail(null);
    if (params.studentId) { // If navigated via URL param, go back to list view on close
        navigate('/bursar/student-fees');
    }
  };

  const filteredSummaries = studentFeeSummaries.filter(summary =>
    summary.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.studentIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  
  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' },
    { value: 'online', label: 'Online' }, { value: 'cheque', label: 'Cheque' }
  ];
  const feeStructureOptionsForPayment = [{value: '', label: 'Select Fee Structure (Optional)'}, ...allFeeStructures.map(fs => ({ value: fs.id, label: `${fs.name || fs.feeCategoryName} - ${formatCurrency(fs.amount)}`}))];
  const feeCategoryOptionsForPayment = [{value: '', label: 'Select Fee Category (Optional)'}, ...allFeeCategories.map(fc => ({ value: fc.id, label: fc.name}))];


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary-800 flex items-center"><FinanceIcon className="w-8 h-8 mr-2 text-primary-600" />Student Fee Management</h1>
        <Input
            id="searchStudents"
            type="text"
            placeholder="Search by Name, ID, or Grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0 sm:w-72"
            className="mt-0"
        />
      </div>

      {loading && studentFeeSummaries.length === 0 ? <p className="text-center py-8">Loading student fee information...</p> : (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Total Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Total Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredSummaries.map((summary) => (
                  <tr key={summary.studentId} className={`hover:bg-secondary-50 ${summary.balance > 0 ? 'bg-red-50' : summary.balance < 0 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{summary.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{summary.studentIdentifier}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{summary.grade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{formatCurrency(summary.totalDue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{formatCurrency(summary.totalPaid)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${summary.balance > 0 ? 'text-red-600' : summary.balance < 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {formatCurrency(summary.balance)}
                        {summary.balance < 0 && <span className="text-xs italic"> (Overpaid)</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                      <Button onClick={() => handleViewDetails(summary.studentId)} variant="ghost" size="sm" leftIcon={<EyeIcon className="w-4 h-4"/>}>Details</Button>
                      <Button onClick={() => openPaymentModal(summary)} variant="ghost" size="sm" leftIcon={<PlusIcon className="w-4 h-4 text-green-600"/>}>Record Payment</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSummaries.length === 0 && !loading && <p className="text-center text-secondary-500 py-8">No student fee records found matching your search.</p>}
        </div>
      )}

      {selectedStudentDetail && (
        <Modal isOpen={isDetailModalOpen} onClose={closeDetailModal} title={`Fee Details for ${selectedStudentDetail.studentName} (${selectedStudentDetail.studentIdentifier})`} size="xl">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div><p className="text-xs text-secondary-500">Total Due</p><p className="font-semibold text-lg">{formatCurrency(selectedStudentDetail.totalDue)}</p></div>
                <div><p className="text-xs text-secondary-500">Total Paid</p><p className="font-semibold text-lg text-green-600">{formatCurrency(selectedStudentDetail.totalPaid)}</p></div>
                <div><p className="text-xs text-secondary-500">Balance</p><p className={`font-semibold text-lg ${selectedStudentDetail.balance > 0 ? 'text-red-600' : selectedStudentDetail.balance < 0 ? 'text-yellow-600' : 'text-green-600'}`}>{formatCurrency(selectedStudentDetail.balance)}</p></div>
                <div><p className="text-xs text-secondary-500">Grade</p><p className="font-semibold text-lg">{selectedStudentDetail.grade}</p></div>
            </div>

            <div>
                <h3 className="text-md font-semibold text-secondary-700 mb-2">Applied Fee Structures</h3>
                {selectedStudentDetail.appliedFeeStructures && selectedStudentDetail.appliedFeeStructures.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-secondary-600 bg-secondary-50 p-3 rounded-md">
                        {selectedStudentDetail.appliedFeeStructures.map(fs => (
                            <li key={fs.id}>{fs.feeCategoryName || fs.name}: {formatCurrency(fs.amount)} (Due: {fs.dueDate ? new Date(fs.dueDate).toLocaleDateString() : 'N/A'}, Freq: {fs.frequency})</li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-secondary-500">No specific fee structures applied.</p>}
            </div>
            
            <div>
              <h3 className="text-md font-semibold text-secondary-700 mb-2">Payment History</h3>
              {selectedStudentDetail.payments && selectedStudentDetail.payments.length > 0 ? (
                <div className="overflow-x-auto max-h-60 border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-secondary-100">
                      <tr>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Amount Paid</th>
                        <th className="p-2 text-left">For Fee</th>
                        <th className="p-2 text-left">Method</th>
                        <th className="p-2 text-left">Receipt No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentDetail.payments.map((payment) => (
                        <tr key={payment.id} className="border-b last:border-0 hover:bg-secondary-50">
                          <td className="p-2">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                          <td className="p-2">{formatCurrency(payment.amountPaid)}</td>
                          <td className="p-2">{payment.feeCategoryName || "General Payment"}</td>
                          <td className="p-2 capitalize">{payment.paymentMethod}</td>
                          <td className="p-2">{payment.receiptNumber || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-secondary-500">No payment history found for this student.</p>
              )}
            </div>
             <div className="flex justify-end mt-6 space-x-2">
                <Button variant="secondary" onClick={closeDetailModal}>Close Details</Button>
                <Button variant="primary" onClick={() => { setIsDetailModalOpen(false); openPaymentModal(selectedStudentDetail);}} leftIcon={<PlusIcon/>}>Record New Payment</Button>
             </div>
          </div>
        </Modal>
      )}
      
      {isPaymentModalOpen && selectedStudentDetail && (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Record Payment for ${selectedStudentDetail.studentName}`}>
          <form onSubmit={(e) => { e.preventDefault(); handleRecordPayment(); }}>
            <Input
              label="Amount Paid"
              id="amountPaid"
              type="number"
              value={newPaymentData.amountPaid || ''}
              onChange={(e) => handlePaymentInputChange('amountPaid', parseFloat(e.target.value))}
              required
              min="0.01"
              step="0.01"
            />
            <Input
              label="Payment Date"
              id="paymentDate"
              type="date"
              value={newPaymentData.paymentDate || ''}
              onChange={(e) => handlePaymentInputChange('paymentDate', e.target.value)}
              required
            />
            <Select
              label="Payment Method"
              id="paymentMethod"
              options={paymentMethodOptions}
              value={newPaymentData.paymentMethod || 'cash'}
              onChange={(e) => handlePaymentInputChange('paymentMethod', e.target.value as FeePayment['paymentMethod'])}
              required
            />
            <Select
                label="For Fee Structure (Optional)"
                id="feeStructureId"
                options={feeStructureOptionsForPayment}
                value={newPaymentData.feeStructureId || ''}
                onChange={(e) => handlePaymentInputChange('feeStructureId', e.target.value)}
            />
            <Select
                label="For Fee Category (Optional)"
                id="feeCategoryId"
                options={feeCategoryOptionsForPayment}
                value={newPaymentData.feeCategoryId || ''}
                onChange={(e) => handlePaymentInputChange('feeCategoryId', e.target.value)}
            />
            <Input
                label="Transaction ID (Optional)"
                id="transactionId"
                value={newPaymentData.transactionId || ''}
                onChange={(e) => handlePaymentInputChange('transactionId', e.target.value)}
            />
            <Input
                label="Notes (Optional)"
                id="paymentNotes"
                type="textarea"
                value={newPaymentData.notes || ''}
                onChange={(e) => handlePaymentInputChange('notes', e.target.value)}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Correctly use default export if this is the main/only export of the file.
// If the error persists and this file is intended to be the primary component,
// ensure the filename matches and the build system isn't confused.
// For this exercise, assuming the default export is what's expected.
// export default BursarStudentFeesPage; // Changed to named export
