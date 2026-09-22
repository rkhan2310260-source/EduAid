import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, Users, ArrowLeft, TrendingUp, Phone, Mail } from "lucide-react";
import DonorProjectDialog from "./DonorProjectDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDonor } from "@/context/DonorContext";

// Browse View Component
function SchoolBrowseView({ onViewSchool }) {
  const { schoolsData } = useDonor();
  const [searchTerm, setSearchTerm] = useState("");
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch schools data when component mounts
  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8081/api/schools');
      if (response.ok) {
        const schoolsData = await response.json();
        setSchools(Array.isArray(schoolsData) ? schoolsData : []);
      } else {
        console.warn('Failed to fetch schools:', response.status);
        setSchools([]);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         school.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <div className="flex-shrink-0 mb-4">
        <DialogTitle className="text-xl font-bold mb-1">
          Browse Schools
        </DialogTitle>
        <div className="text-sm text-gray-600">
          Find schools in need of support across Bangladesh
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        <div className="space-y-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">Loading schools...</p>
            </div>
          ) : filteredSchools.length > 0 ? (
            filteredSchools.map((school) => (
              <div
                key={school.schoolId || school.id}
                className="rounded-lg border p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {school.schoolName || school.name}
                    </h4>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        {school.village || school.location || school.address || 'Location not specified'}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onViewSchool(school)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    View School
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No schools found.</p>
              <p className="text-sm mt-2">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Details View Component
function SchoolDetailsView({ school, onBack, onClose, onProjectClick }) {
  const [schoolProjects, setSchoolProjects] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (school) {
      fetchSchoolDetails();
    }
  }, [school]);

  const fetchSchoolDetails = async () => {
    if (!school) return;
    
    setLoading(true);
    try {
      const projectsResponse = await fetch(`http://localhost:8081/api/school-projects`);
      if (projectsResponse.ok) {
        const allProjects = await projectsResponse.json();
        const schoolSpecificProjects = allProjects.filter(p => p.schoolId === school.schoolId);
        setSchoolProjects(schoolSpecificProjects);
      }

      const studentsResponse = await fetch(`http://localhost:8081/api/students`);
      if (studentsResponse.ok) {
        const allStudents = await studentsResponse.json();
        const schoolStudents = allStudents.filter(s => s.schoolId === school.schoolId);
        setStudentCount(schoolStudents.length);
      }
    } catch (error) {
      console.error('Error fetching school details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocationString = () => {
    const parts = [];
    if (school.divisionName) parts.push(school.divisionName + ' Division');
    if (school.districtName) parts.push(school.districtName + ' District');
    return parts.join(', ') || school.address || 'Location not specified';
  };

  const totalFunding = schoolProjects.reduce((sum, project) => 
    sum + (parseFloat(project.raisedAmount) || 0), 0
  );

  return (
    <>
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <DialogTitle className="text-xl font-bold mb-1">
            {school.schoolName}
          </DialogTitle>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{getLocationString()}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{studentCount}</div>
            <div className="text-sm text-gray-600">Students</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">৳{totalFunding.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Fund Received</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{schoolProjects.length}</div>
            <div className="text-sm text-gray-600">Active Projects</div>
          </div>
        </div>

        {schoolProjects.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">💰 Ongoing Projects</h3>
            <div className="space-y-3">
              {schoolProjects.map((project, index) => {
                const progress = project.completionRate || 0;
                const required = parseFloat(project.requiredAmount) || 0;
                
                return (
                  <div 
                    key={index} 
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onProjectClick(project)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium hover:text-green-600">{project.projectTitle}</span>
                      <span className="text-sm text-gray-600">৳{required.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{width: `${Math.min(progress, 100)}%`}}
                      ></div>
                    </div>
                    <div className="text-right text-sm text-gray-600">{Math.round(progress)}%</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-sm font-medium">
              Total Funding Received: ৳{totalFunding.toLocaleString()}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{school.contactPhone || school.user?.userProfile?.phone || '+880-XXX-XXXX'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{school.contactEmail || school.user?.email || 'school@example.com'}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}

// Main Dialog Component
export default function BrowseSchoolDialog({ open, onOpenChange, onDonate }) {
  const [currentView, setCurrentView] = useState('browse');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  const handleViewSchool = (school) => {
    setSelectedSchool(school);
    setCurrentView('details');
  };

  const handleBackToBrowse = () => {
    setCurrentView('browse');
    setSelectedSchool(null);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setProjectDialogOpen(true);
  };

  const handleDonateToProject = (project) => {
    console.log('Donate to project:', project);
    setProjectDialogOpen(false);
    
    // Call parent's onDonate function if provided
    if (onDonate) {
      onDonate(project);
    }
    
    // Close browse dialog
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setCurrentView('browse');
      setSelectedSchool(null);
      setSelectedProject(null);
      setProjectDialogOpen(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-w-5xl h-[600px] flex flex-col backdrop-blur-sm">
        {currentView === 'browse' ? (
          <SchoolBrowseView onViewSchool={handleViewSchool} />
        ) : (
          <SchoolDetailsView 
            school={selectedSchool} 
            onBack={handleBackToBrowse}
            onClose={() => onOpenChange(false)}
            onProjectClick={handleProjectClick}
          />
        )}
      </DialogContent>
      
      <DonorProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={selectedProject}
        onDonate={handleDonateToProject}
      />
    </Dialog>
  );
}