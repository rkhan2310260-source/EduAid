import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, TrendingUp, FileText, Search } from "lucide-react";
import { useNgo } from "../context/NgoContext";
import NgoDashSidebar from './NgoDashSidebar';
import DonorDonationDialog from './Dialog/DonorDonationDialog';

export default function NgoProjectView() {
  const { ngoId, projectId } = useParams();
  const navigate = useNavigate();
  const { ngoData, projectsData, donationsData, loading, refreshData } = useNgo();
  const [project, setProject] = useState(null);
  const [projectStats, setProjectStats] = useState({
    totalRaised: 0,
    totalUtilized: 0,
    completionRate: 0
  });
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [donationDialogData, setDonationDialogData] = useState(null);

  useEffect(() => {
    if (projectId && projectsData.length > 0) {
      fetchProjectDetails();
    }
  }, [projectId, projectsData]);

  const fetchProjectDetails = async () => {
    try {
      // Find project in context data first
      const contextProject = projectsData.find(p => 
        (p.projectId || p.project_id) == projectId
      );
      
      if (contextProject) {
        setProject(contextProject);
      }

      // Fetch fresh project data from backend
      const response = await fetch(`http://localhost:8081/api/school-projects/${projectId}`);
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
        
        // Calculate stats
        setProjectStats({
          totalRaised: projectData.raisedAmount || 0,
          totalUtilized: projectData.utilizedAmount || 0,
          completionRate: projectData.completionRate || 0
        });
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex h-screen bg-gray-50">
        <NgoDashSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading project details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <NgoDashSidebar />
      <div className="flex-1 overflow-auto bg-white">
        <div className="border-b">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate(`/ngo-dashboard/${ngoId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold mb-1">{project.projectTitle || project.title}</h1>
                <p className="text-gray-600 text-sm">
                  Project Details and Analytics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Raised</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">৳{projectStats.totalRaised.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">
                  of ৳{(project.requiredAmount || 0).toLocaleString()} target
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Funds Utilized</span>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">৳{projectStats.totalUtilized.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {projectStats.totalRaised > 0 ? ((projectStats.totalUtilized / projectStats.totalRaised) * 100).toFixed(0) : 0}% utilized
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Completion</span>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-purple-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{Math.round(projectStats.completionRate)}%</div>
                <div className="text-xs text-gray-500 mt-1">
                  Project progress
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Project Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-800 mt-1">{project.projectDescription || 'No description available'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Project Type</label>
                    <p className="text-gray-800 mt-1">{project.projectTypeName || 'General'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">School</label>
                    <p className="text-gray-800 mt-1">{project.schoolName || `School ID: ${project.schoolId}` || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created Date</label>
                    <p className="text-gray-800 mt-1">
                      {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                      {project.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Visualization */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Progress Overview</h3>
              
              <div className="space-y-6">
                {/* Funding Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Funding Progress</span>
                    <span className="text-gray-500">
                      {project.requiredAmount > 0 ? 
                        Math.round((projectStats.totalRaised / project.requiredAmount) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{ 
                        width: `${project.requiredAmount > 0 ? 
                          Math.min((projectStats.totalRaised / project.requiredAmount) * 100, 100) : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>৳{projectStats.totalRaised.toLocaleString()}</span>
                    <span>৳{(project.requiredAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Completion Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Project Completion</span>
                    <span className="text-gray-500">{Math.round(projectStats.completionRate)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${Math.min(projectStats.completionRate, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                  <button
                    onClick={() => {
                      setDonationDialogData({
                        donationType: "project",
                        title: "Support This Project",
                        description: "Help fund this project to reach its goals",
                        itemData: project
                      });
                      setDonationDialogOpen(true);
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Donate to This Project
                  </button>
                  
                  <button
                    onClick={() => navigate(`/ngo-dashboard/${ngoId}`)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DonorDonationDialog
        open={donationDialogOpen}
        onOpenChange={setDonationDialogOpen}
        donationType={donationDialogData?.donationType}
        title={donationDialogData?.title}
        description={donationDialogData?.description}
        itemData={donationDialogData?.itemData}
      />
    </div>
  );
}