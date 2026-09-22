import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from 'react-router-dom';
import { Search, Coins, Users, Building2, TrendingUp, FileText, CheckCircle, Download, Eye, Calendar, Filter, Target, Award, GraduationCap } from "lucide-react";
import DashSidebar from './DashSidebar';
import SchoolDonationTable from './SchoolDonationTable';

export default function SchoolReporting() {
  const { schoolId } = useParams();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPurpose, setFilterPurpose] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Set active tab from URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'donations', 'impact'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSchoolData();
  }, [schoolId]);

  const [donationData, setDonationData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [backendTotalFunds, setBackendTotalFunds] = useState(0);

  const fetchSchoolData = async () => {
    try {
      setLoading(true);
      
      // Use same backend endpoint as dashboard for consistency
      const [donationsResponse, totalFundsResponse, allProjects, allStudents] = await Promise.all([
        fetch(`http://localhost:8081/api/donations/school/${schoolId}/all-sources`),
        fetch(`http://localhost:8081/api/schools/${schoolId}/total-funds-received`),
        fetch(`http://localhost:8081/api/school-projects`),
        fetch(`http://localhost:8081/api/students`)
      ]);
      
      const donations = donationsResponse.ok ? await donationsResponse.json() : [];
      const totalFunds = totalFundsResponse.ok ? await totalFundsResponse.json() : 0;
      const projects = allProjects.ok ? await allProjects.json() : [];
      const students = allStudents.ok ? await allStudents.json() : [];
      
      setProjectData(projects.filter(p => p.schoolId === parseInt(schoolId)));
      setStudentData(students.filter(s => s.schoolId === parseInt(schoolId)));
      setDonationData(donations);
      
      // Store backend calculated total for consistency with dashboard
      setBackendTotalFunds(totalFunds);
      
    } catch (err) {
      console.error('Error fetching school data:', err);
      setDonationData([]);
      setProjectData([]);
      setStudentData([]);
      setBackendTotalFunds(0);
    } finally {
      setLoading(false);
    }
  };

  // Use backend calculated total for consistency with dashboard
  const totalReceived = backendTotalFunds || donationData.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const completedDonations = donationData.filter(d => d.paymentStatus === 'COMPLETED');
  const totalCompleted = completedDonations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  
  // Calculate beneficiaries and impact using backend field names
  const totalBeneficiaries = studentData.length;
  const activeProjects = projectData.length;
  const completedProjects = 0;
  
  // Calculate donations by purpose using new data structure
  const purposeBreakdown = donationData.reduce((acc, item) => {
    const purpose = item.purpose === 'STUDENT_SPONSORSHIP' ? 'student_sponsorship' : 
                   item.purpose === 'SCHOOL_PROJECT' ? 'project_donation' : 
                   item.source === 'ngo' && item.studentName ? 'ngo_student_donation' :
                   item.source === 'ngo' && item.projectTitle ? 'ngo_project_donation' : 'project_donation';
    acc[purpose] = (acc[purpose] || 0) + parseFloat(item.amount || 0);
    return acc;
  }, {});

  // Calculate high-risk students using backend field names
  const highRiskStudents = studentData.filter(s => s.riskStatus === 'HIGH').length;

  const filterDonations = () => {
    return donationData.filter((donation) => {
      const projectName = donation.projectTitle || '';
      const studentName = donation.studentName || '';
      const donorName = donation.donorName || 'Anonymous';
      const transactionRef = donation.transactionRef || donation.donationId;
      const purpose = donation.purpose === 'STUDENT_SPONSORSHIP' ? 'student_sponsorship' : 
                     donation.purpose === 'SCHOOL_PROJECT' ? 'project_donation' : 
                     donation.source === 'ngo' && donation.studentName ? 'ngo_student_donation' :
                     donation.source === 'ngo' && donation.projectTitle ? 'ngo_project_donation' : 'project_donation';
      
      const matchesSearch = projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transactionRef.toString().toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPurpose = filterPurpose === "all" || purpose === filterPurpose;
      return matchesSearch && matchesPurpose;
    });
  };

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
      'project_donation': 'bg-green-500',
      'student_sponsorship': 'bg-green-600',
      'ngo_project_donation': 'bg-green-700',
      'ngo_student_donation': 'bg-green-400'
    };
    return colors[purpose] || 'bg-gray-500';
  };

  const getPurposeLabel = (purpose) => {
    const labels = {
      'project_donation': 'School Project',
      'student_sponsorship': 'Student Sponsorship',
      'ngo_project_donation': 'NGO Project',
      'ngo_student_donation': 'NGO Student Support'
    };
    return labels[purpose] || 'Unknown';
  };

  const getPurposeIcon = (purpose) => {
    const icons = {
      'project_donation': Building2,
      'student_sponsorship': GraduationCap,
      'ngo_project_donation': Target,
      'ngo_student_donation': Award
    };
    return icons[purpose] || Award;
  };

  // Export report functionality
  const handleExportReport = useCallback(() => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const reportContent = `EDUAID SCHOOL FUNDING REPORT
=================================

Generated on: ${new Date().toLocaleDateString()}
School ID: ${schoolId}

EXECUTIVE SUMMARY
-----------------
Total Received: ৳${totalReceived.toLocaleString()}
Total Donations: ${donationData.length}
Completed Donations: ${completedDonations.length}
Active Projects: ${activeProjects}
Students Enrolled: ${totalBeneficiaries}
High-Risk Students: ${highRiskStudents}
Success Rate: ${totalReceived > 0 ? ((totalCompleted / totalReceived) * 100).toFixed(1) : '0'}%

FUNDING BREAKDOWN BY PURPOSE
-----------------------------${Object.entries(purposeBreakdown).map(([purpose, amount]) => {
  const percentage = ((amount / totalReceived) * 100).toFixed(1);
  return `\n${getPurposeLabel(purpose)}: ৳${amount.toLocaleString()} (${percentage}%)`;
}).join('')}

RECENT DONATIONS
----------------${donationData.slice(0, 10).map(donation => {
  const date = new Date(donation.donatedAt).toLocaleDateString();
  const donor = donation.donorName || 'Anonymous';
  const amount = parseFloat(donation.amount || 0);
  const purpose = donation.purpose === 'STUDENT_SPONSORSHIP' ? 'student_sponsorship' : 
                 donation.purpose === 'SCHOOL_PROJECT' ? 'project_donation' : 
                 donation.source === 'ngo' && donation.studentName ? 'ngo_student_donation' :
                 donation.source === 'ngo' && donation.projectTitle ? 'ngo_project_donation' : 'project_donation';
  return `\n${date} - ${donor} - ${getPurposeLabel(purpose)} - ৳${amount.toLocaleString()}`;
}).join('')}

Thank you for your partnership!
EduAid Platform`;
        
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `school-funding-report-${schoolId}-${new Date().toISOString().split('T')[0]}.txt`;
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
  }, [schoolId, donationData, totalReceived, completedDonations, activeProjects, totalBeneficiaries, highRiskStudents, totalCompleted, purposeBreakdown, isExporting]);

  // Download receipt functionality
  const handleDownloadReceipt = useCallback((donation) => {
    setTimeout(() => {
      const purpose = donation.purpose === 'STUDENT_SPONSORSHIP' ? 'student_sponsorship' : 
                     donation.purpose === 'SCHOOL_PROJECT' ? 'project_donation' : 
                     donation.source === 'ngo' && donation.studentName ? 'ngo_student_donation' :
                     donation.source === 'ngo' && donation.projectTitle ? 'ngo_project_donation' : 'project_donation';
      
      const receiptContent = `DONATION RECEIPT
================

Transaction ID: ${donation.transactionRef}
Donation ID: ${donation.donationId}
Date: ${new Date(donation.donatedAt).toLocaleDateString()}

DONATION DETAILS
----------------
Amount: ৳${parseFloat(donation.amount).toLocaleString()}
Purpose: ${getPurposeLabel(purpose)}
Status: ${donation.paymentStatus}
Source: ${donation.source || 'donor'}

DONOR INFORMATION
-----------------
Donor: ${donation.donorName || 'Anonymous'}

RECIPIENT INFORMATION
---------------------
${donation.projectTitle ? `Project: ${donation.projectTitle}` : ''}
${donation.studentName ? `Student: ${donation.studentName}` : ''}
School ID: ${schoolId}

Thank you for your generous donation!
EduAid Platform
`;
      
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donation-receipt-${donation.transactionRef}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }, [schoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading school funding reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <DashSidebar />
      <div className="flex-1 bg-white">
        {/* Header */}
        <div className="border-b bg-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">School Funding Reports</h1>
                <p className="text-gray-600 text-sm">
                  Track donations received, project funding, and student support impact
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
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Received</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Coins size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">৳{backendTotalFunds.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">
                  From {donationData.length} donations
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Active Projects</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{activeProjects}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {completedProjects} completed projects
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Students Enrolled</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{totalBeneficiaries}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {highRiskStudents} high-risk students
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {totalReceived > 0 ? ((totalCompleted / totalReceived) * 100).toFixed(1) : '0'}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Payment completion rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-6">
          <div className="flex gap-6 border-b mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-2 font-semibold ${
                activeTab === "overview"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("donations")}
              className={`pb-2 font-semibold ${
                activeTab === "donations"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500"
              }`}
            >
              Donations Received
            </button>
            <button
              onClick={() => setActiveTab("impact")}
              className={`pb-2 font-semibold ${
                activeTab === "impact"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500"
              }`}
            >
              Impact Analysis
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="px-6 pb-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-3 gap-6">
              {/* Funding Breakdown by Purpose */}
              <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Funding Distribution by Purpose</h3>
                <div className="space-y-4">
                  {Object.entries(purposeBreakdown).map(([purpose, amount]) => {
                    const percentage = ((amount / totalReceived) * 100).toFixed(1);
                    const IconComponent = getPurposeIcon(purpose);
                    return (
                      <div key={purpose} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPurposeColor(purpose)}`}>
                            <IconComponent size={20} className="text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{getPurposeLabel(purpose)}</div>
                            <div className="text-sm text-gray-500">{percentage}% of total funding</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-800">৳{amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">
                            {donationData.filter(d => {
                              const itemPurpose = d.purpose === 'STUDENT_SPONSORSHIP' ? 'student_sponsorship' : 
                                                 d.purpose === 'SCHOOL_PROJECT' ? 'project_donation' : 
                                                 d.source === 'ngo' && d.studentName ? 'ngo_student_donation' :
                                                 d.source === 'ngo' && d.projectTitle ? 'ngo_project_donation' : 'project_donation';
                              return itemPurpose === purpose;
                            }).length} donations
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* School Performance Metrics */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">School Performance</h3>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {((totalBeneficiaries - highRiskStudents) / totalBeneficiaries * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Student Retention Rate</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Students</span>
                      <span className="text-sm font-bold text-green-600">{totalBeneficiaries}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">High Risk</span>
                      <span className="text-sm font-bold text-gray-600">{highRiskStudents}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Projects</span>
                      <span className="text-sm font-bold text-green-600">{activeProjects}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${totalBeneficiaries > 0 ? ((totalBeneficiaries - highRiskStudents) / totalBeneficiaries) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "donations" && (
            <div>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search donations, projects, students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <select
                  value={filterPurpose}
                  onChange={(e) => setFilterPurpose(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Purposes</option>
                  <option value="project_donation">Donor Projects</option>
                  <option value="student_sponsorship">Donor Sponsorship</option>
                  <option value="ngo_project_donation">NGO Projects</option>
                  <option value="ngo_student_donation">NGO Student Support</option>
                </select>
              </div>

              {/* Donations Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Donation Details</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Transaction ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Purpose</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterDonations().map((donation) => {
                      const amount = parseFloat(donation.amount || 0);
                      const purpose = donation.purpose === 'STUDENT_SPONSORSHIP' ? 'student_sponsorship' : 
                                     donation.purpose === 'SCHOOL_PROJECT' ? 'project_donation' : 
                                     donation.source === 'ngo' && donation.studentName ? 'ngo_student_donation' :
                                     donation.source === 'ngo' && donation.projectTitle ? 'ngo_project_donation' : 'project_donation';
                      const IconComponent = getPurposeIcon(purpose);
                      
                      return (
                        <tr key={`${donation.donationId}-${donation.source || 'donor'}-${donation.transactionRef}`} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPurposeColor(purpose)}`}>
                                <IconComponent size={16} className="text-white" />
                              </div>
                              <div>
                                <div className="font-semibold">
                                  {donation.projectTitle || donation.studentName || `${getPurposeLabel(purpose)} Support`}
                                </div>
                                <div className="text-sm text-gray-500">
                                  From: {donation.donorName || 'Anonymous Donor'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-600 font-mono">
                              {donation.transactionRef}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getPurposeColor(purpose)}`}>
                              {getPurposeLabel(purpose)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-lg">৳{amount.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{donation.source || 'donor'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {new Date(donation.donatedAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(donation.paymentStatus)}`}>
                              {donation.paymentStatus?.toLowerCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button 
                              onClick={() => handleDownloadReceipt(donation)}
                              className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center gap-1"
                            >
                              <Download size={14} />
                              Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "impact" && (
            <div className="grid grid-cols-2 gap-6">
              {/* Impact Metrics */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Educational Impact</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Students Enrolled</span>
                    <span className="text-xl font-bold text-green-600">{totalBeneficiaries}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Projects Funded</span>
                    <span className="text-xl font-bold text-green-600">{projectData.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Retention Rate</span>
                    <span className="text-xl font-bold text-green-600">
                      {totalBeneficiaries > 0 ? ((totalBeneficiaries - highRiskStudents) / totalBeneficiaries * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost Efficiency */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Funding Efficiency</h3>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ৳{(totalBeneficiaries + projectData.length) > 0 ? Math.round(totalCompleted / (totalBeneficiaries + projectData.length)).toLocaleString() : '0'}
                    </div>
                    <div className="text-sm text-gray-600">Average funding per initiative</div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(purposeBreakdown).map(([purpose, amount]) => {
                      const donationCount = donationData.filter(d => {
                        const itemPurpose = d.purpose === 'STUDENT_SPONSORSHIP' ? 'student_sponsorship' : 
                                           d.purpose === 'SCHOOL_PROJECT' ? 'project_donation' : 
                                           d.source === 'ngo' && d.studentName ? 'ngo_student_donation' :
                                           d.source === 'ngo' && d.projectTitle ? 'ngo_project_donation' : 'project_donation';
                        return itemPurpose === purpose;
                      }).length;
                      const avgPerDonation = donationCount > 0 ? Math.round(amount / donationCount) : 0;
                      
                      return (
                        <div key={purpose} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{getPurposeLabel(purpose)}</span>
                          <span className="text-sm font-bold text-green-600">৳{avgPerDonation.toLocaleString()}/donation</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}