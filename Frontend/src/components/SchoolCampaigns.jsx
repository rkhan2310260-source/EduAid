import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, Target, Calendar, Coins, Search, MessageCircle } from 'lucide-react';
import DashSidebar from './DashSidebar';
import CampaignViewModal from './Modal/CampaignViewModal';
import SchoolRequestsPanel from './SchoolRequestsPanel';

export default function SchoolCampaigns() {
  const { schoolId } = useParams();
  const [campaigns, setCampaigns] = useState([]);
  const [acceptedCampaigns, setAcceptedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  const API_BASE_URL = 'http://localhost:8081/api';

  useEffect(() => {
    fetchCampaigns();
    fetchAcceptedCampaigns();
  }, [schoolId]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/ngo-projects`);
      if (response.ok) {
        const data = await response.json();
        setCampaigns(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch only approved campaigns for this school
  const fetchAcceptedCampaigns = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ngo-project-requests/school/${schoolId}`);
      if (response.ok) {
        const requests = await response.json();
        // Filter only approved requests and extract campaign IDs
        const approvedIds = requests
          .filter(req => req.status === 'APPROVED')
          .map(req => req.ngoProjectId);
        setAcceptedCampaigns(approvedIds);
      }
    } catch (error) {
      console.error('Error fetching approved campaigns:', error);
      setAcceptedCampaigns([]);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'planned': 'bg-blue-100 text-blue-700',
      'active': 'bg-green-100 text-green-700',
      'in_progress': 'bg-orange-100 text-orange-700',
      'completed': 'bg-green-600 text-white',
      'paused': 'bg-gray-100 text-gray-700',
      'cancelled': 'bg-red-100 text-red-700',
    };
    return statusMap[status?.toLowerCase()] || 'bg-green-100 text-green-700';
  };

  // Filter campaigns to show only accepted ones
  const filteredCampaigns = campaigns
    .filter(campaign => acceptedCampaigns.includes(campaign.ngoProjectId))
    .filter(campaign =>
      campaign.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.projectDescription?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DashSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <CampaignViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
      />
      
      <DashSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">NGO Campaigns</h1>
              <p className="text-sm text-gray-500">Browse available NGO campaigns and manage invitations</p>
            </div>
          </div>

          {showRequests ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Campaign Invitations</h2>
                <p className="text-sm text-gray-500 mt-1">Manage invitations from NGOs to join their campaigns</p>
              </div>
              <SchoolRequestsPanel 
                schoolId={schoolId} 
                API_BASE_URL={API_BASE_URL} 
              />
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="bg-white border-b">
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Accepted Campaigns</span>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Target size={16} className="text-green-600" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{filteredCampaigns.length}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Total campaigns</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Active Campaigns</span>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Calendar size={16} className="text-green-600" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{filteredCampaigns.filter(c => c.status?.toLowerCase() === 'active').length}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Currently running</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Total Budget</span>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Coins size={16} className="text-green-600" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">Tk {filteredCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Across all campaigns</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Participation Rate</span>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 text-sm font-bold">%</span>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{filteredCampaigns.length > 0 ? Math.round((filteredCampaigns.filter(c => c.status?.toLowerCase() === 'active').length / filteredCampaigns.length) * 100) : 0}%</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Active participation</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Available Campaigns Section */}
                  <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Accepted Campaigns</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCampaigns.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                          <div className="text-gray-400 text-5xl mb-3">📋</div>
                          <h3 className="text-base font-semibold text-gray-800 mb-2">No campaigns found</h3>
                          <p className="text-sm text-gray-500">No NGO campaigns match your search criteria</p>
                        </div>
                      ) : (
                        filteredCampaigns.map((campaign) => (
                          <div key={campaign.ngoProjectId} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-base font-semibold text-gray-800 line-clamp-2">
                                {campaign.projectName}
                              </h3>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {campaign.projectDescription}
                            </p>
                            
                            <div className="flex items-center justify-between mb-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                                {campaign.status || 'Active'}
                              </span>
                              <span className="text-sm font-semibold text-gray-800">
                                Tk {(campaign.budget || 0).toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setViewModalOpen(true);
                                }}
                                className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button 
                                onClick={() => {
                                  // Navigate to specific conversation with NGO
                                  window.location.href = `/school-messages/${schoolId}?ngoId=${campaign.ngoId || campaign.ngo?.ngoId}`;
                                }}
                                className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Message
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* View Invitations Section */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Campaign Invitations</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                      <SchoolRequestsPanel 
                        schoolId={schoolId} 
                        API_BASE_URL={API_BASE_URL} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}