import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Coins,
  School,
  Users,
  TrendingUp,
  Plus,
  Search,
  MapPin,
  Calendar,
  Award,
  Info,
} from "lucide-react";
import { useDonor } from "@/context/DonorContext";
import { useToast } from "@/hooks/use-toast";
import BrowseSchoolDialog from "@/components/Dialog/BrowseSchoolDialog";
import DonorDonationDialog from "@/components/Dialog/DonorDonationDialog";
import DonorProjectDialog from "@/components/Dialog/DonorProjectDialog";
import DonorDonationChart from "@/components/DonorDonationChart";
import DonorDonationHistoryTable from "@/components/DonorDonationHistory";
import DonorGamificationCard from "@/components/DonorGamificationCard";
import DonorRecentActivityFeed from "@/components/DonorRecentActivity";
import DonorProjectCard from "@/components/DonorProjectCard";
import Sidebar from './DonorDashSidebar';
import DonorProjectView from "./DonorProjectView";
import NoStudentsAvailableModal from "./Modal/NoStudentsAvailableModal";



export default function DonorDashboard() {
  const { id: userId } = useParams(); // URL param is now userId
  const { toast } = useToast();
  const { 
    donorData, 
    donationsData, 
    projectsData, 
    schoolsData, 
    sponsoredStudentsData,
    highRiskStudentsData,
    gamificationData,
    donorStats,
    uniqueSchoolsCount,
    loading, 
    refreshDonorData,
    fetchFilteredProjects,
    fetchProjectTypes
  } = useDonor();
  
  const [activeTab, setActiveTab] = useState("available");
  const [browseSchoolsOpen, setBrowseSchoolsOpen] = useState(false);
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [donationDialogData, setDonationDialogData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedFunding, setSelectedFunding] = useState("all");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [fixedDisplayStudents, setFixedDisplayStudents] = useState([]);
  const [noStudentsModalOpen, setNoStudentsModalOpen] = useState(false);

  // Load project types on component mount
  useEffect(() => {
    const loadProjectTypes = async () => {
      try {
        const types = await fetchProjectTypes();
        console.log("types", types);
        setProjectTypes(types || []);
      } catch (error) {
        console.error('Error loading project types:', error);
        // Set fallback types if loading fails
        setProjectTypes(['Infrastructure', 'Education', 'Technology', 'Health & Safety']);
      }
    };
    loadProjectTypes();
  }, []); // Remove fetchProjectTypes from dependencies

  // Apply filters when filter values change
  useEffect(() => {
    const applyFilters = async () => {
      if (searchTerm || selectedType !== 'all' || selectedFunding !== 'all') {
        setIsFiltering(true);
        const filtered = await fetchFilteredProjects(searchTerm, selectedType, selectedFunding);
        setFilteredProjects(filtered);
        setIsFiltering(false);
      } else {
        setFilteredProjects([]);
      }
    };
    
    const debounceTimer = setTimeout(applyFilters, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedType, selectedFunding]); // Remove fetchFilteredProjects from dependencies

  useEffect(() => {
    // Call refreshDonorData without parameters - it will handle userId extraction internally
    refreshDonorData();
    
    // Fetch all students for display
    const fetchStudentsForDisplay = async () => {
      try {
        const response = await fetch('http://localhost:8081/api/students');
        if (response.ok) {
          const allStudents = await response.json();
          if (Array.isArray(allStudents) && allStudents.length > 0) {
            // Shuffle and take first 4 students
            const shuffled = [...allStudents].sort(() => Math.random() - 0.5);
            setFixedDisplayStudents(shuffled.slice(0, 4));
          }
        }
      } catch (error) {
        console.warn('Failed to fetch students for display:', error);
      }
    };
    
    fetchStudentsForDisplay();

    // Make refresh function globally available
    window.refreshDonorData = () => {
      refreshDonorData(); // No need to pass userId, function handles it internally
    };

    // Listen for payment completion messages from popup window
    const handlePaymentMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'PAYMENT_COMPLETE') {
        const { status, transactionId } = event.data;
        
        if (status === 'VALID') {
          toast({
            title: "Payment Successful!",
            description: "Your donation has been processed successfully. Thank you for your contribution!",
          });
          // Refresh donor data to show updated stats
          refreshDonorData(); // No need to pass userId, function handles it internally
        } else if (status === 'FAILED') {
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive"
          });
        } else if (status === 'CANCELLED') {
          toast({
            title: "Payment Cancelled",
            description: "You have cancelled the payment.",
            variant: "destructive"
          });
        }
      }
    };

    window.addEventListener('message', handlePaymentMessage);
    
    return () => {
      window.removeEventListener('message', handlePaymentMessage);
      delete window.refreshDonorData;
    };
  }, []); // Remove refreshDonorData from dependencies to prevent infinite loop

  // Use calculated statistics from backend with debugging
  const totalDonated = donorStats?.totalDonated || 0;
  const schoolsSupported = donorStats?.totalSchoolsSupported || 0;
  const studentsSponsored = donorStats?.totalStudentsSponsored || 0;
  const donatedProjectsCount = donorStats?.totalProjectsDonated || 0;
  
  // Debug logging
  console.log('Dashboard Data:', {
    donorStats,
    totalStudentsSponsored: donorStats?.totalStudentsSponsored,
    gamificationData,
    donationsData: donationsData?.length,
    projectsData: projectsData?.length,
    loading
  });
  

  
  const stats = [
    {
      label: "Total Donated",
      value: `৳${Math.round(Number(totalDonated)).toLocaleString()}`,
      period: "Lifetime donations",
      icon: Coins,
      color: "green",
    },
    {
      label: "Schools Supported",
      value: schoolsSupported.toString(),
      period: "Unique schools",
      icon: School,
      color: "green",
    },
    {
      label: "Students Sponsored",
      value: studentsSponsored.toString(),
      period: "Unique students helped",
      icon: Users,
      color: "green",
    },
    {
      label: "Donated Projects",
      value: donatedProjectsCount.toString(),
      period: "Projects supported",
      icon: TrendingUp,
      color: "green",
    },
  ];


  
  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setProjectDetailsOpen(true);
  };

  const handleDonate = (project) => {
    setDonationDialogData({
      donationType: "project",
      title: "Support School Project",
      description: "Help fund this school project to improve education",
      itemData: project
    });
    setDonationDialogOpen(true);
  };

  // Create chart data from donations with proper error handling
  const chartData = (donationsData || []).slice(-6).map((donation, index) => ({
    month: donation.createdAt ? 
      new Date(donation.createdAt).toLocaleDateString('en-US', { month: 'short' }) : 
      `Month ${index + 1}`,
    amount: donation.amount || 0
  }));

  // Ensure we have at least some data for the chart
  const displayChartData = chartData.length > 0 ? chartData : [
    { month: 'Jan', amount: 0 },
    { month: 'Feb', amount: 0 },
    { month: 'Mar', amount: 0 }
  ];



  // Create recent activities from donations data with proper error handling
  const recentActivities = (donationsData || []).slice(-4).map((donation, index) => ({
    id: donation.id || donation.donationId || `activity-${index}`,
    type: "donation",
    title: "Donation Successful",
    description: `Your donation of ৳${(donation.amount || 0).toLocaleString()} was processed successfully`,
    timestamp: donation.createdAt ? new Date(donation.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    }) : 'Recent'
  }));

  // Add fallback activities if no donations exist
  const displayActivities = recentActivities.length > 0 ? recentActivities : [
    {
      id: 'welcome',
      type: 'verification',
      title: 'Welcome to EduAid!',
      description: 'Your donor account has been created successfully',
      timestamp: 'Today'
    }
  ];

 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <BrowseSchoolDialog
          open={browseSchoolsOpen}
          onOpenChange={setBrowseSchoolsOpen}
          onDonate={(project) => {
            setDonationDialogData({
              donationType: "project",
              title: "Support School Project",
              description: "Help fund this school project to improve education",
              itemData: project
            });
            setDonationDialogOpen(true);
          }}
        />
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
        <NoStudentsAvailableModal
          isOpen={noStudentsModalOpen}
          onClose={() => setNoStudentsModalOpen(false)}
        />

        <div className="bg-white border-b">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-1">Impact Overview</h1>
            <div className="grid grid-cols-4 gap-6 mt-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{stat.label}</span>
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <stat.icon size={16} className="text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{stat.period}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className=" gap-6">
            <div className="">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-green-700 mb-2">Welcome, Donor</p>
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">
                      Start Your
                      <br />
                      Scholarship Today
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Directly for students in Government Primary
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
                  <div className="bg-white  rounded-xl shadow-sm">
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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        
                        <div className="flex gap-3">
                          <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          >
                            <option value="all">All Types</option>
                            {projectTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          
                          <select
                            value={selectedFunding}
                            onChange={(e) => setSelectedFunding(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          >
                            <option value="all">All Funding</option>
                            <option value="low">0-25% Funded</option>
                            <option value="medium">26-75% Funded</option>
                            <option value="high">76-100% Funded</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {isFiltering ? (
                          <div className="text-center py-8">
                            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-gray-500">Filtering projects...</p>
                          </div>
                        ) : (() => {
                          // Get donated project IDs to filter them out
                          const donatedProjectIds = [...new Set(donationsData
                            .filter(d => d.projectId || d.project?.projectId)
                            .map(d => d.projectId || d.project?.projectId))];
                          
                          const displayProjects = (searchTerm || selectedType !== 'all' || selectedFunding !== 'all') 
                            ? filteredProjects.filter(project => !donatedProjectIds.includes(project.projectId))
                            : (projectsData || []).filter(project => !donatedProjectIds.includes(project.projectId));
                          
                          return displayProjects.length > 0 ? (
                            displayProjects.map((project, idx) => {
                              const hasDonated = false; // Always false since we're filtering out donated projects
                              
                              return (
                                <DonorProjectCard 
                                  key={project.projectId || idx}
                                  project={{
                                    ...project,
                                    projectName: project.projectTitle,
                                    targetAmount: project.requiredAmount,
                                    projectType: project.projectTypeName,
                                    description: project.projectDescription
                                  }}
                                  hasDonated={hasDonated}
                                  onViewDetails={(project) => {
                                    setSelectedProject(project);
                                    setProjectDetailsOpen(true);
                                  }}
                                  onDonate={(project) => {
                                    setDonationDialogData({
                                      donationType: "project",
                                      title: "Project Donation",
                                      description: "Support this specific project to help students and schools",
                                      itemData: project
                                    });
                                    setDonationDialogOpen(true);
                                  }}
                                />
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <p>{(projectsData || []).length === 0 ? "No projects available at the moment." : "No projects match your filters."}</p>
                              <p className="text-sm mt-2">{(projectsData || []).length === 0 ? "Check back later for new opportunities to help!" : "Try adjusting your search or filters."}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-1">
                  <DonorGamificationCard 
                    currentLevel={donorStats?.currentLevel || "Bronze"}
                    totalPoints={donorStats?.totalPoints || 0}
                    badgesEarned={gamificationData?.badgesEarned || ["New Donor"]}
                    rankingPosition={gamificationData?.rankingPosition || 1}
                    pointsToNextLevel={0}
                    progressPercentage={0}
                    loading={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}