import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Eye, Send, Target, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import NgoDashSidebar from './NgoDashSidebar';
import CreateCampaignModal from './Modal/CreateCampaignModal';
import NgoRequestsPanel from './NgoRequestsPanel';
import CampaignViewModal from './Modal/CampaignViewModal';
import SchoolInviteModal from './Modal/SchoolInviteModal';

export default function NgoProjects() {
  const { ngoId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (ngoId) {
      fetchProjects();
    }
  }, [ngoId]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      console.log('Fetching projects for NGO ID:', ngoId);
      const response = await fetch('http://localhost:8081/api/ngo-projects');
      console.log('Fetch projects response status:', response.status);
      
      if (response.ok) {
        const allProjects = await response.json();
        console.log('All projects received:', allProjects);
        const ngoProjects = Array.isArray(allProjects) ? allProjects.filter(p => p.ngoId == ngoId) : [];
        console.log('Filtered NGO projects:', ngoProjects);
        setProjects(ngoProjects);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch projects:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fixed: Removed projectTypeId as it's not needed per Backend.md requirements
  // Aligned with backend ngo_project entity structure with proper error handling
  const handleCreateCampaign = async (formData) => {
    try {
      console.log('Creating campaign with data:', formData);
      
      const jsonData = {
        ngoId: parseInt(ngoId),
        projectName: formData.projectName,
        projectDescription: formData.projectDescription,
        budget: parseFloat(formData.budget) || 0,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        status: 'ACTIVE'
      };
      
      console.log('Sending payload:', jsonData);
      
      const response = await fetch('http://localhost:8081/api/ngo-projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(jsonData)
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Campaign created successfully:', result);
        fetchProjects();
        toast.success('Campaign created successfully!');
      } else {
        const errorText = await response.text();
        console.error('Campaign creation failed:', response.status, errorText);
        toast.error(`Failed to create campaign (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Error creating campaign: ' + error.message);
    }
  };

  const handleSendInvite = async (requestData) => {
    try {
      const response = await fetch('http://localhost:8081/api/ngo-project-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        toast.success('Invitation sent successfully!');
        setInviteModalOpen(false);
        setRefreshKey(prev => prev + 1);
      } else {
        const errorText = await response.text();
        if (errorText.includes('active invitation already exists')) {
          toast.warning('This school already has an active invitation for this campaign.');
        } else {
          toast.error('Failed to send invitation: ' + errorText);
        }
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Error sending invitation: ' + error.message);
    }
  };
  
  const getStatusColor = (status) => {
    const statusMap = {
      'planned': 'bg-green-100 text-green-700',
      'active': 'bg-green-100 text-green-700',
      'in_progress': 'bg-orange-100 text-orange-700',
      'completed': 'bg-green-600 text-white',
      'paused': 'bg-gray-100 text-gray-700',
      'cancelled': 'bg-red-100 text-red-700',
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  // Calculate campaign statistics
  const totalCampaigns = projects.length;
  const activeCampaigns = projects.filter(p => p.status?.toLowerCase() === 'active').length;
  const completedCampaigns = projects.filter(p => p.status?.toLowerCase() === 'completed').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCampaign}
      />
      <CampaignViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedProject(null);
        }}
        campaign={selectedProject}
      />
      <SchoolInviteModal
        isOpen={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setSelectedProject(null);
        }}
        onInvite={handleSendInvite}
        campaign={selectedProject}
      />
      <NgoDashSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">NGO Campaigns</h1>
              <p className="text-sm text-gray-500">Manage your Campaigns and track progress</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </button>
          </div>

          <div className="bg-white border-b">
          <div className="p-6">
           
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Campaigns</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{totalCampaigns}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">All campaigns</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Active</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{activeCampaigns}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Currently running</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Completed</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{completedCampaigns}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Successfully finished</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Budget</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">৳</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">৳{totalBudget.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Across all campaigns</p>
              </div>
            </div>
          </div>
          </div>

          <div className="p-6 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Campaigns Section */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">My Campaigns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                    <div className="text-gray-400 text-5xl mb-3">📋</div>
                    <h3 className="text-base font-semibold text-gray-800 mb-2">No campaigns yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Create your first campaign to start</p>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Create Campaign
                    </button>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div key={project.ngoProjectId} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-base font-semibold text-gray-800 line-clamp-2">
                          {project.projectName}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {project.projectDescription}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                          {project.status || 'Active'}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          Tk {(project.budget || 0).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedProject(project);
                            setViewModalOpen(true);
                          }}
                          className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedProject(project);
                            setInviteModalOpen(true);
                          }}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Send className="w-4 h-4" />
                          Invite
                        </button>
                      </div>
                      
                      {/* Select for viewing invitations */}
                      <button 
                        onClick={() => setSelectedProject(project)}
                        className={`w-full mt-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
                          selectedProject?.ngoProjectId === project.ngoProjectId
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {selectedProject?.ngoProjectId === project.ngoProjectId ? 'Selected' : 'Select to view invitations'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Requests Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Sent Invitations</h2>
              {selectedProject ? (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="p-3 border-b bg-gray-50">
                    <p className="text-xs font-medium text-gray-600">Showing invitations for:</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{selectedProject.projectName}</p>
                  </div>
                  <NgoRequestsPanel 
                    key={`${selectedProject.ngoProjectId}-${refreshKey}`}
                    ngoProjectId={selectedProject.ngoProjectId} 
                    API_BASE_URL="http://localhost:8081/api" 
                  />
                </div>
              ) : projects.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                  <p className="text-sm text-gray-500 mb-2">Select a campaign to view invitations</p>
                  <p className="text-xs text-gray-400">Click on any campaign card to see its invitations</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                  <p className="text-sm text-gray-500">Create a campaign to send invitations</p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}