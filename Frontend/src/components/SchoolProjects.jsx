import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Users as UsersIcon, Layers, Plus, Inbox } from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from './DashSidebar';
import { useSchool } from '../context/SchoolContext';
import SchoolProjectCard from './SchoolProjectCard';
import ProjectCreateModal from './Modal/ProjectCreateModal';
import ProjectRequestsPanel from './ProjectRequestsPanel';

export default function SchoolProjects() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { schoolData, projectsData, loading, refreshData, getSchoolStats, API_BASE_URL } = useSchool();
  
  // Modals
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 12;
  
  // Project fund statistics
  const [fundStats, setFundStats] = useState({ totalFundsReceived: 0, totalFundsUtilized: 0 });

  useEffect(() => {
    if (schoolId) {
      refreshData(schoolId);
      fetchFundStats();
    }
  }, [schoolId]);
  
  // Fetch project fund statistics from backend
  const fetchFundStats = async () => {
    try {
      console.log('Fetching fund stats for school:', schoolId);
      const response = await fetch(`${API_BASE_URL}/school-projects/school/${schoolId}/fund-stats`);
      if (response.ok) {
        const stats = await response.json();
        console.log('Fund stats received:', stats);
        setFundStats(stats);
      } else {
        console.error('Failed to fetch fund stats:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching fund stats:', error);
    }
  };

  // Use projects data directly from context (already filtered for this school)
  const processedProjects = projectsData;

  const totalCount = processedProjects.length;
  
  // Format currency for display
  const formatCurrency = (amount) => {
    return `৳${Math.round(Math.abs(amount)).toLocaleString()}`;
  };



  const formatProjectType = (projectType) => {
    return projectType ? projectType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'active': { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
      'high risk': { bg: 'bg-red-100', text: 'text-red-700', label: 'High Risk' },
      'unpaid': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Unpaid' },
      'at risk': { bg: 'bg-red-100', text: 'text-red-700', label: 'High Risk' }
    };
    
    const key = status?.toLowerCase() || 'active';
    const badge = badges[key] || badges['active'];
    return badge;
  };

  // Filter projects
  const filteredProjects = processedProjects.filter(project => {
    const projectName = project.projectTitle || '';
    const matchesSearch = projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' && (!project.status || project.status === 'ACTIVE'));
    const matchesRisk = riskFilter === 'All'; // Risk filtering not implemented for projects yet
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);

  const handleProjectClick = (projectId) => {
    console.log('Viewing project details for ID:', projectId);
    navigate(`/project-details/${projectId}`);
  };

  const handleProjectCreation = async (formData) => {
    try {
      const jsonData = {
        schoolId: parseInt(schoolId),
        projectTitle: formData.get('project_title'),
        projectDescription: formData.get('project_description'),
        projectTypeId: parseInt(formData.get('project_type_id'))
      };
      
      const response = await fetch(`${API_BASE_URL}/school-projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)
      });
      
      if (response.ok) {
        const projectData = await response.json();
        
        const projectImage = formData.get('project_image');
        if (projectImage && projectImage.size > 0) {
          const imageFormData = new FormData();
          imageFormData.append('image', projectImage);
          
          await fetch(`${API_BASE_URL}/school-projects/${projectData.projectId}/image`, {
            method: 'POST',
            body: imageFormData,
          }).catch(error => console.error('Image upload failed:', error));
        }
        
        setProjectModalOpen(false);
        refreshData(schoolId);
        fetchFundStats(); // Refresh fund stats after creating new project
      } else {
        const errorData = await response.text();
        console.error('Project creation failed:', errorData);
        toast.error('Failed to create project: ' + errorData);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error creating project: ' + error.message);
    }
  };

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
    <div className="flex h-screen bg-gray-50">
      <ProjectCreateModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={handleProjectCreation}
      />
      <Sidebar />
      <div className="flex-1 overflow-auto">

        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Project Overview</h1>
              <p className="text-sm text-gray-500">View your key stats at a glance</p>
            </div>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          </div>

          {/* Requests Panel */}
          {showRequests && (
            <div className="mb-6">
              <ProjectRequestsPanel schoolId={schoolId} API_BASE_URL={API_BASE_URL} />
            </div>
          )}

        <div className="bg-white border-b">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold mb-1">Impact Overview</h1>
            </div>
            <div className="grid grid-cols-4 gap-6 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Projects</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <UsersIcon size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{totalCount}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Active projects</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Fund Received</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatCurrency(fundStats.totalFundsReceived)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Total funding received</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Funds Utilized</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Layers size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatCurrency(fundStats.totalFundsUtilized)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Funds spent on projects</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Utilization Rate</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm font-bold">%</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{fundStats.totalFundsReceived > 0 ? Math.round((fundStats.totalFundsUtilized / fundStats.totalFundsReceived) * 100) : 0}%</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Funds effectively used</p>
              </div>
            </div>
          </div>
        </div>

          <div className="p-6">
            {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Paused">Paused</option>
              </select>
              
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="All">All Risk Levels</option>
                <option value="High Risk">High Risk</option>
                <option value="Low Risk">Low Risk</option>
              </select>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {currentProjects.map((project) => (
              <SchoolProjectCard
                key={project.projectId}
                project={project}
                onViewDetails={handleProjectClick}
                onRecordExpense={(project) => console.log('Record expense for:', project.projectTitle)}
                onPostUpdate={(project) => console.log('Post update for:', project.projectTitle)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}