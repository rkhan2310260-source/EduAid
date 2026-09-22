import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, TrendingUp, Calendar, MapPin, FileText, Target, MoreVertical, ChevronLeft } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FundTransparencyModal from './Modal/FundTransparencyModal';
import NgoDashSidebar from './NgoDashSidebar';

export default function NgoProjectAnalytics() {
  const { projectId, ngoId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [school, setSchool] = useState(null);
  const [fundUtilizations, setFundUtilizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ngoContribution, setNgoContribution] = useState(0);
  const [showTransparencyModal, setShowTransparencyModal] = useState(false);
  const [selectedUtilizationId, setSelectedUtilizationId] = useState(null);

  useEffect(() => {
    fetchProjectData();
    fetchFundUtilizations();
    fetchNgoContribution();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/school-projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        if (data.schoolId) {
          const schoolResponse = await fetch(`http://localhost:8081/api/schools/${data.schoolId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (schoolResponse.ok) {
            const schoolData = await schoolResponse.json();
            setSchool(schoolData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchFundUtilizations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/fund-utilization/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFundUtilizations(data || []);
      }
    } catch (error) {
      console.error('Error fetching fund utilizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNgoContribution = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentNgoId = ngoId || localStorage.getItem('ngoId');
      
      if (!currentNgoId) {
        setNgoContribution(0);
        return;
      }
      
      // Try the specific endpoint first
      try {
        const response = await fetch(`http://localhost:8081/api/ngo-project-donations/ngo/${currentNgoId}/project/${projectId}/total`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const total = await response.json();
          setNgoContribution(total || 0);
          return;
        }
      } catch (endpointError) {
        console.warn('Endpoint failed, trying fallback method:', endpointError);
      }
      
      // Fallback: Get all NGO donations and calculate manually
      const allDonationsResponse = await fetch(`http://localhost:8081/api/ngo-project-donations/ngo/${currentNgoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (allDonationsResponse.ok) {
        const donations = await allDonationsResponse.json();
        const projectDonations = donations.filter(d => 
          (d.projectId == projectId) && d.paymentStatus === 'COMPLETED'
        );
        const total = projectDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
        setNgoContribution(total);
      } else {
        setNgoContribution(0);
      }
    } catch (error) {
      console.error('Error fetching NGO contribution:', error);
      setNgoContribution(0);
    }
  };

  // Calculate analytics data
  const totalUtilized = fundUtilizations.reduce((sum, util) => sum + (parseFloat(util.amountUsed) || 0), 0);
  const utilizationByPurpose = fundUtilizations.reduce((acc, util) => {
    const purpose = util.specificPurpose || 'Other';
    acc[purpose] = (acc[purpose] || 0) + (parseFloat(util.amountUsed) || 0);
    return acc;
  }, {});

  // Prepare chart data
  const pieData = Object.entries(utilizationByPurpose).map(([purpose, amount]) => ({
    name: purpose,
    value: amount,
    percentage: totalUtilized > 0 ? ((amount / totalUtilized) * 100).toFixed(1) : 0
  }));

  const monthlyUtilization = fundUtilizations.reduce((acc, util) => {
    if (util.utilizationDate) {
      const month = new Date(util.utilizationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + (parseFloat(util.amountUsed) || 0);
    }
    return acc;
  }, {});

  const lineData = Object.entries(monthlyUtilization).map(([month, amount]) => ({
    month,
    amount
  }));

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <NgoDashSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <NgoDashSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </Button>

          {/* Project Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {project?.projectTitle || 'Project'} Analytics
                </h2>
                <p className="text-gray-600">Detailed fund utilization and transparency report</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{project?.projectDescription || 'No description available'}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="font-semibold">{project?.projectTypeName || 'General'}</p>
              </div>
              <div>
                <span className="text-gray-500">School:</span>
                <p className="font-semibold">{school?.schoolName || 'Loading...'}</p>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <p className="font-semibold">{project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="font-semibold">Active</p>
              </div>
            </div>
          </div>

          {/* Impact Overview Section */}
          <div className="bg-white border-b">
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-1">Impact Overview</h1>
              <div className="grid grid-cols-4 gap-6 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Your Contribution</span>
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign size={16} className="text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">৳{Math.round(ngoContribution).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Amount contributed</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Raised</span>
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Target size={16} className="text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">৳{Math.round(parseFloat(project?.raisedAmount) || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Total project funding</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Funds Utilized</span>
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp size={16} className="text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">৳{Math.round(totalUtilized).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Amount spent</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Utilization Rate</span>
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText size={16} className="text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {project?.raisedAmount ? ((totalUtilized / parseFloat(project.raisedAmount)) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Efficiency rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="utilizations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="utilizations">Fund Utilization</TabsTrigger>
              <TabsTrigger value="details">Utilization Details</TabsTrigger>
            </TabsList>

            <TabsContent value="utilizations" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Fund Utilization by Purpose */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Fund Utilization by Purpose</h3>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`৳${value.toLocaleString()}`, 'Amount']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      No utilization data available
                    </div>
                  )}
                </div>

                {/* Monthly Utilization Trend */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Monthly Utilization Trend</h3>
                  {lineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`৳${value.toLocaleString()}`, 'Amount Used']} />
                        <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      No trend data available
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Fund Utilization Details</h3>
              {fundUtilizations.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="space-y-3">
                    {fundUtilizations.map((util, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                {util.specificPurpose || 'Other'}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-gray-500">
                                <Calendar className="w-4 h-4 text-green-600" />
                                <span className="text-gray-700">{util.utilizationDate ? new Date(util.utilizationDate).toLocaleDateString() : 'N/A'}</span>
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">{util.detailedDescription || 'No description'}</p>
                            {util.vendorName && (
                              <p className="text-sm text-gray-600"><span className="font-medium">Vendor:</span> {util.vendorName}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-2xl font-bold text-green-600">৳{Math.round(parseFloat(util.amountUsed) || 0).toLocaleString()}</p>
                            <button
                              onClick={() => {
                                setSelectedUtilizationId(util.utilizationId);
                                setShowTransparencyModal(true);
                              }}
                              className="mt-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No fund utilization records found
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* AI FIX: Fund Transparency Modal */}
      <FundTransparencyModal
        isOpen={showTransparencyModal}
        onClose={() => {
          setShowTransparencyModal(false);
          setSelectedUtilizationId(null);
        }}
        utilizationId={selectedUtilizationId}
        API_BASE_URL="http://localhost:8081/api"
      />
    </div>
  );
}