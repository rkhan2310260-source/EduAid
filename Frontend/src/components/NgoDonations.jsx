import { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { Search, DollarSign, Clock, TrendingUp, FileText, CheckCircle, XCircle, AlertCircle, Download, Building2, GraduationCap, Heart, Target, Users } from "lucide-react";
import NgoDashSidebar from './NgoDashSidebar';

export default function NgoDonations() {
  const { ngoId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDonations();
  }, [ngoId]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      
      // Fetch both student and project donations for NGO
      const [studentDonationsRes, projectDonationsRes] = await Promise.all([
        fetch(`http://localhost:8081/api/ngo-student-donations/ngo/${ngoId}`),
        fetch(`http://localhost:8081/api/ngo-project-donations/ngo/${ngoId}`)
      ]);
      
      let allDonations = [];
      
      if (studentDonationsRes.ok) {
        const studentDonations = await studentDonationsRes.json();
        
        // Fetch student details for each donation
        const studentDonationsWithDetails = await Promise.all(
          studentDonations.map(async (d) => {
            try {
              const studentRes = await fetch(`http://localhost:8081/api/students/${d.studentId}`);
              let studentName = `Student ID: ${d.studentId}`;
              let schoolName = 'Unknown School';
              
              if (studentRes.ok) {
                const student = await studentRes.json();
                studentName = `${student.studentName || student.firstName || 'Unknown'} ${student.lastName || ''}`.trim();
                
                if (student.schoolId) {
                  try {
                    const schoolRes = await fetch(`http://localhost:8081/api/schools/${student.schoolId}`);
                    if (schoolRes.ok) {
                      const school = await schoolRes.json();
                      schoolName = school.schoolName || 'Unknown School';
                    }
                  } catch (schoolErr) {
                    console.warn('Failed to fetch school:', schoolErr);
                  }
                }
              }
              
              return {
                ...d,
                donationId: d.studentDonationId,
                donationType: 'STUDENT_SPONSORSHIP',
                purpose: 'STUDENT_SPONSORSHIP',
                recipientName: studentName,
                projectName: `Sponsorship for ${studentName}`,
                schoolName: schoolName,
                donatedAt: d.donatedAt || d.createdAt
              };
            } catch (err) {
              console.warn('Failed to fetch student details:', err);
              return {
                ...d,
                donationId: d.studentDonationId,
                donationType: 'STUDENT_SPONSORSHIP',
                purpose: 'STUDENT_SPONSORSHIP',
                recipientName: `Student ID: ${d.studentId}`,
                projectName: `Student Sponsorship`,
                schoolName: 'Unknown School',
                donatedAt: d.donatedAt || d.createdAt
              };
            }
          })
        );
        
        allDonations = [...allDonations, ...studentDonationsWithDetails];
      }
      
      if (projectDonationsRes.ok) {
        const projectDonations = await projectDonationsRes.json();
        
        // Fetch project details for each donation
        const projectDonationsWithDetails = await Promise.all(
          projectDonations.map(async (d) => {
            try {
              const projectRes = await fetch(`http://localhost:8081/api/school-projects/${d.projectId}`);
              let projectTitle = `Project ID: ${d.projectId}`;
              let schoolName = 'Unknown School';
              
              if (projectRes.ok) {
                const project = await projectRes.json();
                projectTitle = project.projectTitle || project.title || `Project ID: ${d.projectId}`;
                
                if (project.schoolId) {
                  try {
                    const schoolRes = await fetch(`http://localhost:8081/api/schools/${project.schoolId}`);
                    if (schoolRes.ok) {
                      const school = await schoolRes.json();
                      schoolName = school.schoolName || 'Unknown School';
                    }
                  } catch (schoolErr) {
                    console.warn('Failed to fetch school:', schoolErr);
                  }
                }
              }
              
              return {
                ...d,
                donationId: d.projectDonationId,
                donationType: 'PROJECT_DONATION',
                purpose: 'SCHOOL_PROJECT',
                recipientName: projectTitle,
                projectName: projectTitle,
                schoolName: schoolName,
                donatedAt: d.donatedAt || d.createdAt
              };
            } catch (err) {
              console.warn('Failed to fetch project details:', err);
              return {
                ...d,
                donationId: d.projectDonationId,
                donationType: 'PROJECT_DONATION',
                purpose: 'SCHOOL_PROJECT',
                recipientName: `Project ID: ${d.projectId}`,
                projectName: `School Project`,
                schoolName: 'Unknown School',
                donatedAt: d.donatedAt || d.createdAt
              };
            }
          })
        );
        
        allDonations = [...allDonations, ...projectDonationsWithDetails];
      }
      
      // Sort by date (newest first)
      allDonations.sort((a, b) => new Date(b.donatedAt) - new Date(a.donatedAt));
      
      setDonations(allDonations);
    } catch (err) {
      setError('Error fetching donations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const studentDonations = donations.filter((d) => d.purpose === "STUDENT_SPONSORSHIP" || d.donationType === "STUDENT_SPONSORSHIP");
  const projectDonations = donations.filter((d) => d.purpose === "SCHOOL_PROJECT" || d.donationType === "PROJECT_DONATION" || d.purpose === "NGO_PROJECT");
  const completedDonations = donations.filter((d) => d.paymentStatus === "COMPLETED");

  const totalDonated = completedDonations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  // Calculate today donations amount
  const todayAmount = donations
    .filter(d => {
      const donationDate = new Date(d.donatedAt || d.createdAt);
      const today = new Date();
      return donationDate.toDateString() === today.toDateString();
    })
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const thisMonthAmount = donations
    .filter(d => {
      const donationDate = new Date(d.donatedAt || d.createdAt);
      const now = new Date();
      return donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

  const filterDonations = () => {
    let filteredDonations = donations;
    if (activeTab === "student") filteredDonations = studentDonations;
    if (activeTab === "project") filteredDonations = projectDonations;

    return filteredDonations.filter((donation) => {
      const projectName = donation.projectName || donation.recipientName || 'General Donation';
      const transactionRef = donation.transactionId || donation.transactionRef || donation.donationId;
      const matchesSearch =
        projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transactionRef.toString().toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || donation.paymentStatus === filterStatus;
      return matchesSearch && matchesStatus;
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle size={16} className="text-green-600" />;
      case "PENDING":
        return <AlertCircle size={16} className="text-yellow-600" />;
      case "FAILED":
        return <XCircle size={16} className="text-red-600" />;
      default:
        return null;
    }
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

  const handleDownloadReceipt = (donation) => {
    const receiptData = {
      donationId: donation.donationId,
      transactionId: donation.transactionId || `NGO${donation.donationId}`,
      amount: donation.amount,
      donationType: donation.donationType || 'Online',
      donatedAt: donation.donatedAt || donation.createdAt,
      paymentStatus: donation.paymentStatus,
      recipient: donation.projectName || donation.recipientName || 'General Fund',
      donorMessage: donation.message
    };
    
    const pdfContent = `
      NGO DONATION RECEIPT
      ====================
      
      Transaction ID: ${receiptData.transactionId}
      Donation ID: ${receiptData.donationId}
      Date: ${new Date(receiptData.donatedAt).toLocaleDateString()}
      
      DONATION DETAILS
      ----------------
      Amount: Tk ${parseFloat(receiptData.amount).toLocaleString()}
      Type: ${receiptData.donationType}
      Status: ${receiptData.paymentStatus}
      
      RECIPIENT INFORMATION
      ---------------------
      Recipient: ${receiptData.recipient}
      
      ${receiptData.donorMessage ? `Message: ${receiptData.donorMessage}` : ''}
      
      Thank you for your generous donation!
      EduAid Platform
    `;
    
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ngo-donation-receipt-${receiptData.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadAllDonations = () => {
    const allDonationsData = donations.map(donation => ({
      Date: new Date(donation.donatedAt || donation.createdAt).toLocaleDateString(),
      'Transaction ID': donation.transactionId || donation.transactionRef || `NGO${donation.donationId}`,
      'Project/Recipient': donation.projectName || donation.recipientName || 'General Fund',
      Amount: parseFloat(donation.amount || 0),
      Status: donation.paymentStatus,
      Type: donation.donationType || 'Online'
    }));
    
    const csvContent = [
      Object.keys(allDonationsData[0] || {}).join(','),
      ...allDonationsData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        ).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ngo-donations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading donations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={fetchDonations} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NgoDashSidebar />
      <div className="flex-1 bg-white">
        <div className="border-b">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Donation History</h1>
              <p className="text-gray-600 text-sm">
                Track all your contributions and transaction history
              </p>
            </div>
            <button 
              onClick={handleDownloadAllDonations}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={16} />
              Download All
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Donated</span>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold">Tk {Math.round(totalDonated).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {completedDonations.length} successful transactions
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Today</span>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold">
                Tk {Math.round(todayAmount).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">{donations.filter(d => {
                const donationDate = new Date(d.donatedAt || d.createdAt);
                const today = new Date();
                return donationDate.toDateString() === today.toDateString();
              }).length} donations today</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">This Month</span>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold">
                Tk {Math.round(thisMonthAmount).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">{donations.filter(d => {
                const donationDate = new Date(d.donatedAt || d.createdAt);
                const now = new Date();
                return donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear();
              }).length} donations this month</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Tabs and Search */}
        <div className="mb-6">
          <div className="flex gap-6 border-b mb-4">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-2 font-semibold ${
                activeTab === "all"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500"
              }`}
            >
              ALL ({donations.length})
            </button>
            <button
              onClick={() => setActiveTab("student")}
              className={`pb-2 font-semibold ${
                activeTab === "student"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500"
              }`}
            >
              Student ({studentDonations.length})
            </button>
            <button
              onClick={() => setActiveTab("project")}
              className={`pb-2 font-semibold ${
                activeTab === "project"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500"
              }`}
            >
              Project ({projectDonations.length})
            </button>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by project or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
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
                const purpose = donation.purpose || 'GENERAL_SUPPORT';
                const IconComponent = getPurposeIcon(purpose);
                
                return (
                  <tr key={`${donation.donationType}-${donation.donationId}`} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPurposeColor(purpose)}`}>
                          <IconComponent size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="font-semibold">
                            {donation.projectName || donation.recipientName || `${getPurposeLabel(purpose)} Donation`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {donation.schoolName || 
                             (donation.message && donation.message.trim() ? 
                              donation.message.substring(0, 40) + (donation.message.length > 40 ? '...' : '') : 
                              'EduAid Platform')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600 font-mono">
                        {donation.transactionId || donation.transactionRef || `NGO${donation.donationId}`}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium text-white ${getPurposeColor(purpose)}`}>
                        {getPurposeLabel(purpose)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-lg">৳{Math.round(amount).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{donation.donationType?.toLowerCase() || 'online'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {new Date(donation.donatedAt || donation.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        donation.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        donation.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {donation.paymentStatus?.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {donation.paymentStatus === 'COMPLETED' && donation.transactionId && (
                        <button 
                          onClick={() => handleDownloadReceipt(donation)}
                          className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center gap-1"
                        >
                          <Download size={14} />
                          Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}