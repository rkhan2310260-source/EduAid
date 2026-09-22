import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, TrendingUp, Phone, Mail } from "lucide-react";

export function SchoolDetailsDialog({ open, onOpenChange, school }) {
  const [schoolProjects, setSchoolProjects] = React.useState([]);
  const [studentCount, setStudentCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (school && open) {
      fetchSchoolDetails();
    }
  }, [school, open]);

  const fetchSchoolDetails = async () => {
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

  if (!school) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 mb-4">
          <DialogTitle className="text-xl font-bold mb-1">
            {school.schoolName}
          </DialogTitle>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{getLocationString()}</span>
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
              <span>{school.contactPhone || school.user?.userProfile?.phone || '+880-XXX-XXXX'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{school.contactEmail || school.user?.email || 'school@example.com'}</span>
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
      </DialogContent>
    </Dialog>
  );
}