import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams } from 'react-router-dom';
import { Search, DollarSign, Users, GraduationCap, Building2, Heart, TrendingUp, FileText, CheckCircle, Download, Eye, Calendar, Filter, Target, Award } from "lucide-react";
import DonorDashSidebar from './DonorDashSidebar';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDonor } from "@/context/DonorContext";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function DonorReporting() {
  const { id: donorId } = useParams();
  const { 
    donorStats,
    donationsData,
    loading,
    refreshDonorData
  } = useDonor();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPurpose, setFilterPurpose] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("all");
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Use donationsData from context instead of local state
  const donationData = donationsData || [];
  


  useEffect(() => {
    if (donorId && !loading && (!donorStats || donationsData.length === 0)) {
      refreshDonorData(donorId);
    }
  }, [donorId]); // Only refresh if data is not already loaded

  // Memoize expensive calculations to prevent recalculation on every render
  const calculatedStats = useMemo(() => {
    const totalDonated = donationData.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const completedDonations = donationData.filter(d => d.paymentStatus === 'COMPLETED');
    const totalCompleted = completedDonations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    
    const totalBeneficiaries = donationData.reduce((sum, d) => {
      if (d.purpose === 'STUDENT_SPONSORSHIP') return sum + 1;
      if (d.project?.beneficiaryCount) return sum + d.project.beneficiaryCount;
      return sum + 1;
    }, 0);
    
    const uniqueSchools = [...new Set(donationData.map(d => d.project?.school?.schoolName || d.student?.school?.schoolName).filter(Boolean))].length;
    const uniqueStudents = [...new Set(donationData.filter(d => d.student).map(d => d.student.studentId))].length;

    const purposeBreakdown = donationData.reduce((acc, item) => {
      const purpose = item.purpose || 'GENERAL_SUPPORT';
      acc[purpose] = (acc[purpose] || 0) + parseFloat(item.amount || 0);
      return acc;
    }, {});

    return {
      totalDonated,
      completedDonations,
      totalCompleted,
      totalBeneficiaries,
      uniqueSchools,
      uniqueStudents,
      purposeBreakdown
    };
  }, [donationData]);

  const { totalDonated, completedDonations, totalCompleted, totalBeneficiaries, uniqueSchools, uniqueStudents, purposeBreakdown } = calculatedStats;

  // Memoize filtered donations to prevent recalculation on every render
  const filteredDonations = useMemo(() => {
    return donationData.filter((donation) => {
      const projectName = donation.project?.projectTitle || '';
      const studentName = donation.student ? `${donation.student.firstName} ${donation.student.lastName}` : '';
      const schoolName = donation.project?.school?.schoolName || donation.student?.school?.schoolName || '';
      const purpose = donation.purpose || 'GENERAL_SUPPORT';
      
      const matchesSearch = projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           schoolName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPurpose = filterPurpose === "all" || purpose === filterPurpose;
      return matchesSearch && matchesPurpose;
    });
  }, [donationData, searchTerm, filterPurpose]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "FAILED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPurposeColor = (purpose) => {
    const colors = {
      'SCHOOL_PROJECT': 'bg-green-500',
      'STUDENT_SPONSORSHIP': 'bg-green-600',
      'NGO_PROJECT': 'bg-green-700',
      'GENERAL_SUPPORT': 'bg-green-400'
    };
    return colors[purpose] || 'bg-gray-500';
  };

  const getPurposeLabel = (purpose) => {
    const labels = {
      'SCHOOL_PROJECT': 'School Project',
      'STUDENT_SPONSORSHIP': 'Student Sponsorship',
      'NGO_PROJECT': 'NGO Project',
      'GENERAL_SUPPORT': 'General Support'
    };
    return labels[purpose] || 'Unknown';
  };

  const getPurposeIcon = (purpose) => {
    const icons = {
      'SCHOOL_PROJECT': Building2,
      'STUDENT_SPONSORSHIP': GraduationCap,
      'NGO_PROJECT': Heart,
      'GENERAL_SUPPORT': Target
    };
    return icons[purpose] || Target;
  };

  const chartRef = useRef();
  const monthlyChartRef = useRef();

  // Memoize monthly data calculation
  const monthlyData = useMemo(() => {
    const monthlyData = {};
    donationData.forEach(donation => {
      const date = new Date(donation.donatedAt || donation.createdAt);
      if (isNaN(date.getTime())) {
        return;
      }
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(donation.amount || 0);
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));
  }, [donationData]);

  // Generate ASCII pie chart representation
  const generatePieChart = (data) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    let chart = '\n';
    
    Object.entries(data).forEach(([purpose, amount]) => {
      const percentage = ((amount / total) * 100).toFixed(1);
   const bars = Math.round(percentage / 2);
const filledBars = Math.min(bars, 25);
const emptyBars = Math.max(25 - filledBars, 0);
const barString = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

      chart += `${getPurposeLabel(purpose).padEnd(20)} [${barString}] ${percentage}%\n`;
    });
    
    return chart;
  };

  // Optimized export function with text-based report
  const handleExportReport = useCallback(() => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const donorName = donationData[0]?.donor?.name || 'Donor';
        const avgDonation = donationData.length > 0 ? (totalDonated / donationData.length) : 0;
        const largestDonation = Math.max(...donationData.map(d => parseFloat(d.amount || 0)));
        const mostRecent = donationData.length > 0 ? new Date(Math.max(...donationData.map(d => new Date(d.donatedAt || d.createdAt)))).toLocaleDateString() : 'N/A';
        
        const reportContent = `EDUAID DONATION IMPACT REPORT
=================================

Generated on: ${new Date().toLocaleDateString()}
Donor ID: ${donorId}
Donor Name: ${donorName}

EXECUTIVE SUMMARY
-----------------
Total Donated: ৳${totalDonated.toLocaleString()}
Total Donations: ${donationData.length}
Students Sponsored: ${uniqueStudents}
Schools Supported: ${uniqueSchools}
Total Beneficiaries: ${totalBeneficiaries}
Completed Donations: ${completedDonations.length}
Success Rate: ${donationData.length > 0 ? ((completedDonations.length / donationData.length) * 100).toFixed(1) : 0}%

DONATION BREAKDOWN BY PURPOSE
-----------------------------${Object.entries(purposeBreakdown).map(([purpose, amount]) => {
  const percentage = ((amount / totalDonated) * 100).toFixed(1);
  return `\n${getPurposeLabel(purpose)}: ৳${amount.toLocaleString()} (${percentage}%)`;
}).join('')}

DONATION IMPACT CHART
---------------------${generatePieChart(purposeBreakdown)}
MONTHLY DONATION TRENDS
-----------------------${monthlyData.map(item => `\n${item.month}: ৳${item.amount.toLocaleString()}`).join('')}

RECENT DONATIONS
----------------${donationData.slice(0, 8).map(donation => {
  const date = new Date(donation.donatedAt || donation.createdAt).toLocaleDateString();
  const recipient = donation.project?.projectTitle || (donation.student ? `${donation.student.firstName} ${donation.student.lastName}` : 'General Support');
  const amount = parseFloat(donation.amount || 0);
  return `\n${date} - ${recipient.substring(0, 30)} - ৳${amount.toLocaleString()}`;
}).join('')}

IMPACT ANALYSIS
---------------
Average Donation: ৳${avgDonation.toLocaleString()}
Largest Donation: ৳${largestDonation.toLocaleString()}
Most Recent: ${mostRecent}

Thank you for your continued support!
EduAid Platform`;
        
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eduaid-impact-report-${donorId}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error generating report:', error);
      } finally {
        setIsExporting(false);
      }
    }, 100);
  }, [donorId, donationData, totalDonated, uniqueStudents, uniqueSchools, totalBeneficiaries, completedDonations, purposeBreakdown, monthlyData, isExporting]);

  const handleDownloadReceipt = useCallback((donation) => {
    // Use setTimeout to prevent blocking
    setTimeout(() => {
      // Generate PDF receipt with donation details
      const receiptData = {
        donationId: donation.donationId,
        transactionId: donation.transactionId,
        amount: donation.amount,
        donationType: donation.donationType,
        purpose: getPurposeLabel(donation.purpose),
        donatedAt: donation.donatedAt || donation.createdAt,
        paymentStatus: donation.paymentStatus,
      recipient: donation.project?.projectTitle || 
                (donation.student ? `${donation.student.firstName} ${donation.student.lastName}` : 'General Fund'),
      school: donation.project?.school?.schoolName || donation.student?.school?.schoolName,
      donorMessage: donation.donorMessage,
      isAnonymous: donation.isAnonymous
    };
    
    // Create PDF content
    const pdfContent = `
      DONATION RECEIPT
      ================
      
      Transaction ID: ${receiptData.transactionId}
      Donation ID: ${receiptData.donationId}
      Date: ${new Date(receiptData.donatedAt).toLocaleDateString()}
      
      DONATION DETAILS
      ----------------
      Amount: ৳${parseFloat(receiptData.amount).toLocaleString()}
      Type: ${receiptData.donationType}
      Purpose: ${receiptData.purpose}
      Status: ${receiptData.paymentStatus}
      
      RECIPIENT INFORMATION
      ---------------------
      Recipient: ${receiptData.recipient}
      ${receiptData.school ? `School: ${receiptData.school}` : ''}
      
      ${receiptData.donorMessage ? `Message: ${receiptData.donorMessage}` : ''}
      
      Thank you for your generous donation!
      EduAid Platform
    `;
    
    // Create and download PDF-like text file (can be enhanced with actual PDF library)
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donation-receipt-${receiptData.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    }, 0);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading donation impact reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DonorDashSidebar />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="p-6">
            <div className="flex items-center justify-between ">
              <div>
                <h1 className="text-2xl font-bold mb-1">Reports</h1>
                <p className="text-gray-600 text-sm">
                  Track your donations across projects, students, and their real-world impact
                </p>
              </div>
              <button 
                onClick={handleExportReport}
                disabled={isExporting || loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isExporting || loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                <Download size={16} />
                {isExporting ? 'Generating...' : 'Export Report'}
              </button>
            </div>

            {/* Impact Summary Cards */}
            {/* <div className="grid grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Donated</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">৳{totalDonated.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Across {donationData.length} donations
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Students Sponsored</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <GraduationCap size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{uniqueStudents}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Direct student sponsorships
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Schools Supported</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{uniqueSchools}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Educational institutions
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Impact</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{totalBeneficiaries.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Lives positively impacted
                </div>
              </div>
            </div> */}
          </div>
        </div>



        {/* Main Content */}
        <div className="px-6 pb-6">
          <div className="space-y-6">
              {/* First Row - Donation Performance Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Donation Performance Summary</h3>
                <div className="grid grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {donationData.length > 0 ? ((completedDonations.length / donationData.length) * 100).toFixed(1) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {donationData.length > 0 ? Math.ceil((Date.now() - new Date(Math.min(...donationData.map(d => new Date(d.createdAt))))) / (1000 * 60 * 60 * 24)) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Days Active</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      ৳{donationData.length > 0 ? Math.max(...donationData.map(d => parseFloat(d.amount || 0))).toLocaleString() : '0'}
                    </div>
                    <div className="text-sm text-gray-600">Largest Donation</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {(() => {
                        if (monthlyData.length < 2) {
                          return 'N/A';
                        }
                        const current = monthlyData[monthlyData.length - 1]?.amount || 0;
                        const previous = monthlyData[monthlyData.length - 2]?.amount || 0;
                        if (previous === 0) return current > 0 ? '+100%' : '0%';
                        const growth = ((current - previous) / previous * 100);
                        return (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';
                      })()}
                    </div>
                    <div className="text-sm text-gray-600">Monthly Growth</div>
                  </div>
                </div>
              </div>

              {/* Second Row - Purpose Distribution and Payment Status */}
              <div className="grid grid-cols-3 gap-6">
                {/* Donation Breakdown by Purpose */}
                <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">Donation Distribution by Purpose</h3>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(purposeBreakdown).map(([purpose, amount]) => ({
                          name: getPurposeLabel(purpose),
                          value: amount,
                          fill: purpose === 'SCHOOL_PROJECT' ? '#16a34a' :
                                purpose === 'STUDENT_SPONSORSHIP' ? '#15803d' :
                                purpose === 'NGO_PROJECT' ? '#166534' : '#22c55e'
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      >
                      </Pie>
                      <Tooltip formatter={(value) => [`৳${value.toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-4">
                    {Object.entries(purposeBreakdown).map(([purpose, amount]) => {
                      const percentage = ((amount / totalDonated) * 100).toFixed(1);
                      const IconComponent = getPurposeIcon(purpose);
                      return (
                        <div key={purpose} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPurposeColor(purpose)}`}>
                              <IconComponent size={20} className="text-white" />
                            </div>
                            <div>
                              <div className="font-medium">{getPurposeLabel(purpose)}</div>
                              <div className="text-sm text-gray-500">{percentage}% of total donations</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-800">৳{amount.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">
                              {donationData.filter(d => d.purpose === purpose).length} donations
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Status Overview */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">Impact Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Students Sponsored</span>
                      <span className="text-xl font-bold text-gray-900">{donorStats?.totalStudentsSponsored || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Schools Supported</span>
                      <span className="text-xl font-bold text-gray-900">{donorStats?.totalSchoolsSupported || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Active Donations</span>
                      <span className="text-xl font-bold text-gray-900">{completedDonations.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Average Donation</span>
                      <span className="text-xl font-bold text-gray-900">৳{donationData.length > 0 ? Math.round(totalDonated / donationData.length).toLocaleString() : '0'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Third Row - Impact Analysis Charts */}
              <div className="grid grid-cols-2 gap-6">
                {/* Monthly Donation Trends */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">Monthly Donation Trends</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#374151" />
                      <YAxis stroke="#374151" />
                      <Tooltip formatter={(value) => [`৳${value.toLocaleString()}`, 'Amount']} />
                      <Bar dataKey="amount" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Donation Amount Distribution */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">Donation Amount Ranges</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { range: '< ৳5,000', count: donationData.filter(d => parseFloat(d.amount || 0) < 5000).length },
                      { range: '৳5,000-15,000', count: donationData.filter(d => parseFloat(d.amount || 0) >= 5000 && parseFloat(d.amount || 0) < 15000).length },
                      { range: '৳15,000-30,000', count: donationData.filter(d => parseFloat(d.amount || 0) >= 15000 && parseFloat(d.amount || 0) < 30000).length },
                      { range: '> ৳30,000', count: donationData.filter(d => parseFloat(d.amount || 0) >= 30000).length }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="range" stroke="#374151" />
                      <YAxis stroke="#374151" />
                      <Tooltip formatter={(value) => [value, 'Donations']} />
                      <Bar dataKey="count" fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}