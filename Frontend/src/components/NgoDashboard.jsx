import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, MoreVertical, Briefcase, School, Plus, Trash2, Edit, Eye, Download, Heart, Users, TrendingUp, Trophy, Award, Send, Search, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import NgoDashSidebar from './NgoDashSidebar';
import ConfirmationModal from './Modal/ConfirmationModal';
import ProjectCreateModal from './Modal/ProjectCreateModal';
import DonorGamificationCard from './DonorGamificationCard';
import SchoolProjectCard from './SchoolProjectCard';
import ProjectRequestModal from './Modal/ProjectRequestModal';
import DonorDonationDialog from './Dialog/DonorDonationDialog';
import DonorProjectDialog from './Dialog/DonorProjectDialog';
import BrowseSchoolDialog from './Dialog/BrowseSchoolDialog';
import NoStudentsAvailableModal from './Modal/NoStudentsAvailableModal';
import { useNgo } from '../context/NgoContext';



const emptyData = {
  ngo: null,
  schoolProjects: [],
  assignedSchools: [],
  projectUpdates: [],
  budgetSummary: { totalBudget: 0, utilizedBudget: 0, remainingBudget: 0 }
};

export default function NgoDashboard() {
  const { ngoId } = useParams();
  const navigate = useNavigate();
  const { 
    ngoData, 
    projectsData, 
    donationsData, 
    gamificationData, 
    loading, 
    error, 
    initializeForNgo, 
    refreshGamificationData 
  } = useNgo();
  
  const [data, setData] = useState(emptyData);
  const [apiError, setApiError] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [ngoStats, setNgoStats] = useState({
    totalDonated: 0,
    studentsHelped: 0,
    schoolProjectsCount: 0,
    schoolsReached: 0
  });
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [donationDialogData, setDonationDialogData] = useState(null);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedProjectForRequest, setSelectedProjectForRequest] = useState(null);
  const [browseSchoolsOpen, setBrowseSchoolsOpen] = useState(false);
  const [highRiskStudents, setHighRiskStudents] = useState([]);
  const [fixedDisplayStudents, setFixedDisplayStudents] = useState([]);
  const [noStudentsModalOpen, setNoStudentsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  useEffect(() => {
    if (ngoId && !loading) {
      console.log('NgoDashboard: Initializing for NGO ID:', ngoId);
      // Reset stats to prevent showing stale data
      setNgoStats({
        totalDonated: 0,
        studentsHelped: 0,
        schoolProjectsCount: 0,
        schoolsReached: 0
      });
      // Initialize context data manually
      initializeForNgo(ngoId);
      // Fetch additional data
      fetchAdditionalData();
    }
  }, [ngoId]); // Only depend on ngoId to prevent infinite loop

  // Refresh data when context data changes
  useEffect(() => {
    if (ngoData || projectsData || donationsData) {
      console.log('NgoDashboard: Context data changed, updating local data');
      updateLocalData();
    }
  }, [ngoData, projectsData, donationsData, gamificationData]);

  // Recalculate stats when donations or projects change
  useEffect(() => {
    // Only calculate stats if we have actual data (not empty arrays from initial state)
    if ((donationsData && donationsData.length > 0) || (projectsData && projectsData.length > 0)) {
      const contextDonationsTotal = (donationsData || []).reduce((sum, d) => sum + (d.amount || 0), 0);
      const uniqueStudents = new Set();
      const uniqueSchoolProjects = new Set();
      
      (donationsData || []).forEach(donation => {
        if (donation.studentId) {
          uniqueStudents.add(donation.studentId);
        }
        if (donation.projectId) {
          uniqueSchoolProjects.add(donation.projectId);
        }
      });
      
      const updatedStats = {
        totalDonated: contextDonationsTotal,
        studentsHelped: uniqueStudents.size,
        schoolProjectsCount: uniqueSchoolProjects.size,
        schoolsReached: uniqueSchoolProjects.size
      };
      
      console.log('NgoDashboard: Updated stats from context data:', updatedStats);
      setNgoStats(updatedStats);
    } else if (!loading && donationsData !== null && projectsData !== null) {
      // If we have empty arrays but not loading, it means no data exists
      const emptyStats = {
        totalDonated: 0,
        studentsHelped: 0,
        schoolProjectsCount: 0,
        schoolsReached: 0
      };
      console.log('NgoDashboard: Setting empty stats (no data found):', emptyStats);
      setNgoStats(emptyStats);
    }
  }, [donationsData, projectsData, loading]);

  // Fetch additional data not covered by context
  const fetchAdditionalData = async () => {
    if (loading) {
      console.log('NgoDashboard: Already loading, skipping fetchAdditionalData');
      return;
    }
    
    try {
      const API_BASE_URL = 'http://localhost:8081/api';
      
      const newData = { ...data };
      
      // Fetch available school projects for donation
      try {
        const schoolProjectsRes = await fetch(`${API_BASE_URL}/school-projects`);
        if (schoolProjectsRes.ok) {
          const projectsData = await schoolProjectsRes.json();
          const allProjects = Array.isArray(projectsData) ? projectsData : [];
          newData.schoolProjects = allProjects; // Show all projects
        }
      } catch (err) {
        console.warn('Failed to fetch school projects:', err);
        newData.schoolProjects = [];
      }
      
      // Fetch all students and select 4 random ones for display
      try {
        const studentsRes = await fetch(`${API_BASE_URL}/students`);
        if (studentsRes.ok) {
          const allStudents = await studentsRes.json();
          if (Array.isArray(allStudents) && allStudents.length > 0) {
            // Shuffle and take first 4 students
            const shuffled = [...allStudents].sort(() => Math.random() - 0.5);
            setFixedDisplayStudents(shuffled.slice(0, 4));
          }
        }
        
        // Still fetch high-risk students for other purposes
        const highRiskRes = await fetch(`${API_BASE_URL}/students/high-risk-for-sponsorship`);
        if (highRiskRes.ok) {
          const students = await highRiskRes.json();
          setHighRiskStudents(Array.isArray(students) ? students : []);
        }
      } catch (err) {
        console.warn('Failed to fetch students:', err);
        setHighRiskStudents([]);
        setFixedDisplayStudents([]);
      }
      
      // Only calculate stats if context data is available and not just empty initial arrays
      if ((donationsData && donationsData.length > 0) || (projectsData && projectsData.length > 0)) {
        const contextDonationsTotal = (donationsData || []).reduce((sum, d) => sum + (d.amount || 0), 0);
        const uniqueStudents = new Set();
        const uniqueSchoolProjects = new Set();
        
        (donationsData || []).forEach(donation => {
          if (donation.studentId) {
            uniqueStudents.add(donation.studentId);
          }
          if (donation.projectId) {
            uniqueSchoolProjects.add(donation.projectId);
          }
        });
        
        const calculatedStats = {
          totalDonated: contextDonationsTotal,
          studentsHelped: uniqueStudents.size,
          schoolProjectsCount: uniqueSchoolProjects.size,
          schoolsReached: uniqueSchoolProjects.size
        };
        
        console.log('NgoDashboard: Calculated stats from context in fetchAdditionalData:', calculatedStats);
        setNgoStats(calculatedStats);
      }
      
      setData(newData);
      setApiError(false);
    } catch (error) {
      console.error('Error fetching additional data:', error);
      // Use context data as fallback only if we have actual data
      if ((donationsData && donationsData.length > 0) || (projectsData && projectsData.length > 0)) {
        const contextDonationsTotal = (donationsData || []).reduce((sum, d) => sum + (d.amount || 0), 0);
        const uniqueStudents = new Set();
        const uniqueSchoolProjects = new Set();
        
        (donationsData || []).forEach(donation => {
          if (donation.studentId) {
            uniqueStudents.add(donation.studentId);
          }
          if (donation.projectId) {
            uniqueSchoolProjects.add(donation.projectId);
          }
        });
        
        const fallbackStats = {
          totalDonated: contextDonationsTotal,
          studentsHelped: uniqueStudents.size,
          schoolProjectsCount: uniqueSchoolProjects.size,
          schoolsReached: uniqueSchoolProjects.size
        };
        console.log('NgoDashboard: Error fallback stats:', fallbackStats);
        setNgoStats(fallbackStats);
      }
      setApiError(true);
    }
  };

  // Update local data when context data changes
  const updateLocalData = () => {
    const newData = { ...emptyData };
    
    // Use context data
    newData.ngo = ngoData;
    newData.ngoProjects = projectsData || [];
    
    // Calculate budget from NGO's own projects
    const totalBudget = (newData.ngoProjects || []).reduce((sum, p) => sum + (p.budget || 0), 0);
    const utilizedBudget = (newData.ngoProjects || []).reduce((sum, p) => sum + (p.raisedAmount || 0), 0);
    newData.budgetSummary = {
      totalBudget,
      utilizedBudget,
      remainingBudget: totalBudget - utilizedBudget
    };
    
    // Set assigned schools from NGO projects
    newData.assignedSchools = (newData.ngoProjects || []).map(project => ({
      projectNameForSchool: project.projectName,
      allocatedBudget: project.budget,
      participationStatus: project.status || 'active'
    }));
    
    // Keep existing school projects data
    newData.schoolProjects = data.schoolProjects || [];
    
    setData(newData);
  };

  const formatCurrency = (amount) => {
    return `Tk ${Math.round(Math.abs(amount || 0)).toLocaleString()}`;
  };

  const handleProjectCreation = async (submitData) => {
    try {
      const jsonData = {
        ngoId: parseInt(ngoId),
        projectName: submitData.projectTitle,
        projectDescription: submitData.projectDescription,
        projectTypeId: submitData.projectTypeId,
        budget: submitData.requiredAmount || 0,
        status: 'ACTIVE'
      };
      
      console.log('Creating project from dashboard:', jsonData);
      
      const response = await fetch('http://localhost:8081/api/ngo-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)
      });
      
      if (response.ok) {
        setShowAddProject(false);
        // Only refresh additional data, context will update automatically
        fetchAdditionalData();
        console.log('Project created successfully from dashboard');
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
  
  // Add donation success handler to refresh data
  const handleDonationSuccess = () => {
    console.log('NgoDashboard: Donation successful, refreshing data');
    // Only refresh gamification data with a delay, context will update automatically
    setTimeout(() => {
      refreshGamificationData(ngoId);
    }, 3000); // Give backend time to process
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

  const handleDeleteProject = (projectId) => {
    setProjectToDelete(projectId);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const response = await fetch(`http://localhost:8081/api/ngo-projects/${projectToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchAdditionalData();
        toast.success('Project deleted successfully');
      } else {
        toast.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error deleting project');
    } finally {
      setProjectToDelete(null);
    }
  };

  const handleAddProject = () => {
    setShowAddProject(true);
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
  };
  
  const handleSendRequest = async (requestData) => {
    try {
      const response = await fetch('http://localhost:8081/api/ngo-project-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        toast.success('Request sent successfully!');
        setRequestModalOpen(false);
        setSelectedProjectForRequest(null);
      } else {
        toast.error('Failed to send request');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Error sending request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const ngoDisplayData = {
    ngoName: ngoData?.ngoName || data.ngo?.ngoName || `NGO ${ngoId}`,
    registrationNumber: ngoData?.registrationNumber || data.ngo?.registrationNumber || 'N/A',
    verificationStatus: ngoData?.verificationStatus || data.ngo?.verificationStatus || 'PENDING',
    totalStudents: ngoStats.studentsHelped,
    activeProjects: ngoStats.schoolsReached,
  };
  
  const gamificationInfo = {
    currentLevel: gamificationData?.totalPoints >= 1000 ? "Champion" : 
                 gamificationData?.totalPoints >= 500 ? "Expert" : 
                 gamificationData?.totalPoints >= 200 ? "Achiever" : 
                 gamificationData?.totalPoints >= 100 ? "Starter" : "Beginner",
    totalPoints: gamificationData?.totalPoints || 0,
    badgesEarned: gamificationData?.badgesEarned ? 
      (typeof gamificationData.badgesEarned === 'string' ? 
        JSON.parse(gamificationData.badgesEarned.replace(/\\"/g, '"')) : 
        gamificationData.badgesEarned) : ["New NGO"],
    rankingPosition: 1
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <ProjectCreateModal
        isOpen={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSubmit={handleProjectCreation}
      />
      <ProjectRequestModal
        isOpen={requestModalOpen}
        onClose={() => {
          setRequestModalOpen(false);
          setSelectedProjectForRequest(null);
        }}
        onSubmit={handleSendRequest}
        requestType="JOIN_REQUEST"
        projectData={selectedProjectForRequest}
        schoolId={selectedProjectForRequest?.schoolId}
        ngoProjectId={ngoId}
      />
      <DonorDonationDialog
        open={donationDialogOpen}
        onOpenChange={setDonationDialogOpen}
        donationType={donationDialogData?.donationType}
        title={donationDialogData?.title}
        description={donationDialogData?.description}
        itemData={donationDialogData?.itemData}
        onDonationSuccess={handleDonationSuccess}
      />
      <DonorProjectDialog
        open={projectDetailsOpen}
        onOpenChange={setProjectDetailsOpen}
        project={selectedProject}
        onDonate={(project) => {
          setDonationDialogData({
            donationType: "project",
            title: "Support School Project",
            description: "Help fund this school project",
            itemData: project
          });
          setDonationDialogOpen(true);
        }}
      />
      <BrowseSchoolDialog
        open={browseSchoolsOpen}
        onOpenChange={setBrowseSchoolsOpen}
        onDonate={(project) => {
          setDonationDialogData({
            donationType: "project",
            title: "Support School Project",
            description: "Help fund this school project",
            itemData: project
          });
          setDonationDialogOpen(true);
        }}
      />
      <NoStudentsAvailableModal
        isOpen={noStudentsModalOpen}
        onClose={() => setNoStudentsModalOpen(false)}
      />
      <NgoDashSidebar />

      <div className="flex-1 overflow-auto">
        {apiError && (
          <div className="m-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⚠ Using demo data. Connect to backend at <code className="bg-yellow-100 px-2 py-1 rounded">http://localhost:8081/api</code>
          </div>
        )}



        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 m-6 rounded-2xl p-8 flex items-center justify-between relative overflow-hidden">
          <div className="flex-1 z-10">
            <div className="text-lg text-gray-600 mb-1">Welcome back,</div>
            <div className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              {ngoDisplayData.ngoName}
              {ngoDisplayData.verificationStatus === 'VERIFIED' && <span className="text-green-500">✓</span>}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Managing impactful projects across multiple schools to reduce dropout rates
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>🏛️</span>
              Reg. No: {ngoDisplayData.registrationNumber}
            </div>
          </div>
          <div className="w-96 h-48 rounded-xl overflow-hidden shadow-lg">
            <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white">
              <Briefcase className="w-24 h-24 opacity-20" />
            </div>
          </div>
        </div>

        <div className="bg-white border-b">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold mb-1">Overview</h1>
            </div>
            <div className="grid grid-cols-4 gap-6 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Donated</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Heart size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatCurrency(ngoStats.totalDonated)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Total contributions made</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Students Helped</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{ngoStats.studentsHelped}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Unique students sponsored</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Projects Created</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Briefcase size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{(projectsData || []).length}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Own campaigns created</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Schools Reached</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{ngoStats.schoolsReached}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Schools supported via donations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 mb-8">
          {/* Start Scholarship Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-700 mb-2">Welcome, NGO</p>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  Start Your
                  <br />
                  Scholarship Today
                </h2>
                <p className="text-gray-600 mb-6">
                  Support students in Government Primary
                  <br />
                  Schools throughout Bangladesh
                </p>
                <button 
                  onClick={async () => {
                    try {
                      // Check if students without scholarships are available
                      const response = await fetch('http://localhost:8081/api/students/high-risk-for-sponsorship?limit=1');
                      if (response.ok) {
                        const availableStudents = await response.json();
                        if (availableStudents && availableStudents.length > 0) {
                          setDonationDialogData({
                            donationType: "student",
                            title: "Sponsor a Student",
                            description: "Help provide education opportunities for students in need",
                            itemData: null
                          });
                          setDonationDialogOpen(true);
                        } else {
                          setNoStudentsModalOpen(true);
                        }
                      } else {
                        // Fallback: open dialog anyway if API fails
                        setDonationDialogData({
                          donationType: "student",
                          title: "Sponsor a Student",
                          description: "Help provide education opportunities for students in need",
                          itemData: null
                        });
                        setDonationDialogOpen(true);
                      }
                    } catch (error) {
                      console.error('Error checking student availability:', error);
                      // Fallback: open dialog anyway if check fails
                      setDonationDialogData({
                        donationType: "student",
                        title: "Sponsor a Student",
                        description: "Help provide education opportunities for students in need",
                        itemData: null
                      });
                      setDonationDialogOpen(true);
                    }
                  }}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
                >
                  Sponser a student
                </button>
              </div>
              <div className="grid grid-cols-2 gap-9">
                {(() => {
                  // Use fetched students or fallback to empty array
                  const studentsToShow = fixedDisplayStudents.length > 0 ? fixedDisplayStudents : [];
                  
                  // If no students fetched, show message
                  if (studentsToShow.length === 0) {
                    return (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        <p>Loading students...</p>
                      </div>
                    );
                  }
                  
                  return studentsToShow.slice(0, 4).map((student, idx) => (
                    <div key={student.studentId || idx} className="bg-white rounded-lg overflow-hidden shadow-sm h-48">
                      <div className="relative h-32">
                        <img 
                          src={student.profileImage ? `http://localhost:8081${student.profileImage}` : `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&sig=${student.studentId || idx}`} 
                          alt={student.studentName || 'Student'} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.target.src = `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop`;
                          }}
                        />
                        <span className="absolute top-2 right-2 bg-white text-blue-600 text-xs px-2 py-1 rounded-full font-semibold">
                          Student
                        </span>
                      </div>
                      <div className="p-3 h-16 flex flex-col justify-between">
                        <p className="text-xs text-gray-500 mb-1">Looking for Scholarship</p>
                        <p className="font-semibold text-sm truncate">{student.studentName}, Class {student.classLevel}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="border-b flex justify-between px-6 py-4">
                  <h3 className="text-lg font-bold text-green-600">Available Projects</h3>
                  <button 
                    onClick={() => setBrowseSchoolsOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-green-700"
                  >
                    <School size={18} />
                    Browse Schools
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                        <option value="all">All Types</option>
                        <option value="infrastructure">Infrastructure</option>
                        <option value="education">Education</option>
                        <option value="technology">Technology</option>
                      </select>
                      
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
                        <option value="all">All Funding</option>
                        <option value="low">0-25% Funded</option>
                        <option value="medium">26-75% Funded</option>
                        <option value="high">76-100% Funded</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      // Get donated project IDs to filter them out
                      const donatedProjectIds = [...new Set(donationsData
                        ?.filter(d => d.projectId || d.project?.projectId)
                        .map(d => d.projectId || d.project?.projectId))] || [];
                      
                      // Filter out projects NGO has already donated to
                      const availableProjects = data.schoolProjects
                        .filter(project => {
                          const projectId = project.projectId || project.project_id;
                          const isActive = !project.status || project.status.toLowerCase() === 'active';
                          const notDonated = !donatedProjectIds.includes(projectId);
                          return isActive && notDonated;
                        });
                      
                      return availableProjects.length > 0 ? (
                        availableProjects.map((project) => {
                          return (
                            <div
                              key={project.projectId || project.project_id}
                              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-xl font-bold mb-1">{project.projectTitle || project.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>{project.schoolName || `School ID: ${project.schoolId}`}</span>
                                  </div>
                                </div>
                                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                                  {project.status || 'Active'}
                                </span>
                              </div>

                              <p className="text-gray-600 mb-4">{project.projectDescription || 'No description available'}</p>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="text-sm text-gray-600">
                                  Created: {new Date(project.createdAt || Date.now()).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Type: {project.projectTypeName || 'General'}
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="font-semibold">
                                    ৳{Math.round(project.raisedAmount || 0).toLocaleString()} raised
                                  </span>
                                  <span className="text-gray-500">
                                    of ৳{Math.round(project.requiredAmount || 100000).toLocaleString()}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(((project.raisedAmount || 0) / (project.requiredAmount || 100000)) * 100, 100)}%` }}
                                  ></div>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {(((project.raisedAmount || 0) / (project.requiredAmount || 100000)) * 100).toFixed(1)}% funded
                                </div>
                              </div>
                              
                              <div className="flex gap-3 mt-4">
                                <button
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setProjectDetailsOpen(true);
                                  }}
                                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => {
                                    setDonationDialogData({
                                      donationType: "project",
                                      title: "Support School Project",
                                      description: "Help fund this school project",
                                      itemData: project
                                    });
                                    setDonationDialogOpen(true);
                                  }}
                                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                >
                                  Donate Now
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>{data.schoolProjects.length === 0 ? "No projects available at the moment." : "No projects match your filters."}</p>
                          <p className="text-sm mt-2">{data.schoolProjects.length === 0 ? "Check back later for new opportunities to help!" : "Try adjusting your search or filters."}</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <DonorGamificationCard 
                currentLevel={gamificationInfo.currentLevel}
                totalPoints={gamificationInfo.totalPoints}
                badgesEarned={gamificationInfo.badgesEarned}
                rankingPosition={gamificationInfo.rankingPosition}
                pointsToNextLevel={gamificationData?.pointsToNextLevel}
                progressPercentage={gamificationData?.progressPercentage}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
