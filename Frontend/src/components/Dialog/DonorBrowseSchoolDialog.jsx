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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDonor } from "@/context/DonorContext";







export default function DonorBrowseSchoolDialog({ open, onOpenChange }) {
  const { schoolsData } = useDonor();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [currentView, setCurrentView] = useState('browse'); // 'browse' or 'details'
  const [schoolProjects, setSchoolProjects] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filter schools based on search
  const filteredSchools = schoolsData.filter(school => {
    const matchesSearch = school.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         school.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewSchool = (school) => {
    setSelectedSchool(school);
    setCurrentView('details');
    fetchSchoolDetails(school);
  };

  const handleBackToBrowse = () => {
    setCurrentView('browse');
    setSelectedSchool(null);
  };

  const fetchSchoolDetails = async (school) => {
    if (!school) return;
    
    setLoading(true);
    try {
      // Fetch school projects
      const projectsResponse = await fetch(`http://localhost:8081/api/school-projects`);
      if (projectsResponse.ok) {
        const allProjects = await projectsResponse.json();
        const schoolSpecificProjects = allProjects.filter(p => p.schoolId === school.schoolId);
        setSchoolProjects(schoolSpecificProjects);
      }

      // Fetch student count
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

  const getLocationString = (school) => {
    const parts = [];
    if (school.divisionName) parts.push(school.divisionName + ' Division');
    if (school.districtName) parts.push(school.districtName + ' District');
    return parts.join(', ') || school.address || 'Location not specified';
  };

  const totalFunding = schoolProjects.reduce((sum, project) => 
    sum + (parseFloat(project.raisedAmount) || 0), 0
  );

  // Reset view when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentView('browse');
      setSelectedSchool(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={currentView === 'details' ? "sm:max-w-[600px] max-h-[90vh] flex flex-col" : "sm:max-w-[700px]"}>
        {currentView === 'browse' ? (
          // Browse Schools View
          <>
            <DialogHeader>
              <DialogTitle>Browse Schools</DialogTitle>
              <DialogDescription>
                Find schools in need of support across Bangladesh
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search schools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-schools"
                />
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {filteredSchools.map((school) => (
                    <div
                      key={school.id}
                      className="flex items-start justify-between gap-4 rounded-lg border p-4 hover-elevate"
                      data-testid={`school-card-${school.id}`}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold">{school.schoolName || school.name}</h4>
                          <Badge className="bg-green-100 text-green-700">
                            active
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {school.location || 'Location not specified'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {school.totalStudents || 0} students
                          </div>
                        </div>

                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleViewSchool(school)}
                        data-testid={`button-view-school-${school.id}`}
                      >
                        View School
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        ) : (
          // School Details View
          <>
            <div className="flex items-center gap-2 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToBrowse}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold mb-1">
                  {selectedSchool?.schoolName}
                </DialogTitle>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{getLocationString(selectedSchool)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
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
                      const raised = parseFloat(project.raisedAmount) || 0;
                      
                      return (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{project.projectTitle}</span>
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
                    <span>{selectedSchool?.contactPhone || selectedSchool?.user?.userProfile?.phone || '+880-XXX-XXXX'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{selectedSchool?.contactEmail || selectedSchool?.user?.email || 'school@example.com'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Support This School
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
