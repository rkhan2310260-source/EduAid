import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, FileText, Search } from "lucide-react";
import { useDonor } from "@/context/DonorContext";
import Sidebar from './DonorDashSidebar';
import DonorProjectCard from './DonorProjectCard';
import DonorDonationDialog from './Dialog/DonorDonationDialog';
import DonorProjectDialog from './Dialog/DonorProjectDialog';

export default function DonorProjectView() {
  const { id: userId } = useParams(); // URL param is now userId
  const navigate = useNavigate();
  const { projectsData, donationsData, loading, refreshDonorData, fetchProjectsData } = useDonor();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("donated");
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [donationDialogData, setDonationDialogData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [totalProjectContributions, setTotalProjectContributions] = useState(0);
  const [totalUtilized, setTotalUtilized] = useState(0);

  useEffect(() => {
    refreshDonorData(); // Use the updated function that handles userId internally
    fetchProjectContributions();
  }, []);

  // Refetch contributions when donations data changes
  useEffect(() => {
    if (donationsData.length > 0) {
      fetchProjectContributions();
    }
  }, [donationsData]);
  
  // Helper function to get donorId from localStorage with proper parsing
  const getDonorIdFromStorage = () => {
    try {
      const storedDonorId = localStorage.getItem('donorId');
      if (!storedDonorId) return null;
      
      // Try to parse as JSON first (new format)
      const donorIdData = JSON.parse(storedDonorId);
      
      // Check if data has expired
      if (donorIdData.expiresAt && new Date().getTime() > donorIdData.expiresAt) {
        localStorage.removeItem('donorId');
        return null;
      }
      
      return donorIdData.donorId;
    } catch (error) {
      // If parsing fails, try to use the value directly (fallback for old format)
      const directDonorId = localStorage.getItem('donorId');
      return directDonorId && !directDonorId.startsWith('{') ? directDonorId : null;
    }
  };

  const fetchProjectContributions = async () => {
    try {
      // Calculate project contributions from donations data
      const projectContributions = donationsData
        .filter(d => (d.projectId || d.project?.projectId) && d.paymentStatus === 'COMPLETED')
        .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
      
      setTotalProjectContributions(projectContributions);
      
      // Fetch total utilized amount for donor's contributed projects
      const donorId = getDonorIdFromStorage();
      console.log('DonorProjectView: Fetching fund utilization for donorId:', donorId);
      
      if (donorId) {
        const url = `http://localhost:8081/api/fund-utilization/donor/${donorId}/projects-total-used`;
        console.log('DonorProjectView: Making request to:', url);
        
        const response = await fetch(url);
        console.log('DonorProjectView: Fund utilization response status:', response.status);
        
        if (response.ok) {
          const utilized = await response.json();
          console.log('DonorProjectView: Fund utilization data received:', utilized);
          setTotalUtilized(utilized || 0);
        } else {
          console.error('Failed to fetch fund utilization:', response.status, await response.text());
        }
      } else {
        console.log('No donorId found in localStorage');
      }
    } catch (error) {
      console.error('Error calculating project contributions:', error);
    }
  };



  // Get projects that the donor has donated to
  const donatedProjectIds = [...new Set(donationsData
    .filter(d => d.projectId || d.project?.projectId)
    .map(d => d.projectId || d.project?.projectId))];
  
  const donatedProjects = projectsData.filter(p => 
    donatedProjectIds.includes(p.projectId || p.id)
  );
  const completedProjects = projectsData.filter((p) => p.status === "COMPLETED");

  const filterProjects = () => {
    return donatedProjects.filter(
      (project) =>
        (project.projectTitle || project.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.schoolId || '').toString().includes(searchTerm.toLowerCase())
    );
  };

  // Check if donor has donated to a specific project
  const hasDonatedToProject = (projectId) => {
    return donatedProjectIds.includes(projectId);
  };

  const totalContributed = totalProjectContributions;

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto bg-white">
        <div className="border-b">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-1">My Donated Projects</h1>
            <p className="text-gray-600 text-sm">
              Projects you have supported with donations
            </p>

            <div className="grid grid-cols-3 gap-6 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Contributed</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">৳{totalContributed.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Across {projectsData.length} projects
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Funds Utilized</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">৳{totalUtilized.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {totalContributed > 0 ? ((totalUtilized / totalContributed) * 100).toFixed(0) : 0}% of contributions
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Donated Projects</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{donatedProjects.length}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Projects you've supported
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">

            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search projects or schools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={() => {
                  fetchProjectsData();
                  fetchProjectContributions();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Refresh
              </button>
            
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
          <DonorProjectDialog
            open={projectDetailsOpen}
            onOpenChange={setProjectDetailsOpen}
            project={selectedProject}
            onDonate={() => setDonationDialogOpen(true)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterProjects().length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No donated projects found.</p>
                <p className="text-sm text-gray-400 mt-2">You haven't donated to any projects yet.</p>
              </div>
            ) : (
              filterProjects().map((project) => (
                <DonorProjectCard
                  key={project.projectId || project.id}
                  project={project}
                  hasDonated={true}
                  onViewDetails={(project) => {
                    // Navigate to analytics page for donated projects
                    navigate(`/donor-project-analytics/${project.projectId || project.id}`);
                  }}
                  onDonate={(project) => {
                    setDonationDialogData({
                      donationType: "project",
                      title: "Project Donation",
                      description: `Support ${project.projectTitle || project.title}`,
                      itemData: project
                    });
                    setDonationDialogOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}