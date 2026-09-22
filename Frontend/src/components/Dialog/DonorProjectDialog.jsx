import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Calendar, DollarSign, Users, TrendingUp } from "lucide-react";


export default function DonorProjectDialog({ 
  open, 
  onOpenChange, 
  project,
  onDonate 
}) {
  const [schoolData, setSchoolData] = React.useState(null);
  const [donorCount, setDonorCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (project && open) {
      fetchProjectDetails();
    }
  }, [project, open]);

  const fetchProjectDetails = async () => {
    if (!project) return;
    
    setLoading(true);
    try {
      // Fetch school data
      const schoolResponse = await fetch(`http://localhost:8081/api/schools/${project.schoolId}`);
      if (schoolResponse.ok) {
        const school = await schoolResponse.json();
        setSchoolData(school);
      }

      // Fetch donor count for this project
      const donationsResponse = await fetch(`http://localhost:8081/api/donations`);
      if (donationsResponse.ok) {
        const donations = await donationsResponse.json();
        const projectDonations = donations.filter(d => 
          (d.projectId === project.projectId) && d.paymentStatus === 'COMPLETED'
        );
        const uniqueDonors = new Set(projectDonations.map(d => d.donorId));
        setDonorCount(uniqueDonors.size);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  const requiredAmount = parseFloat(project.requiredAmount) || 0;
  const raisedAmount = parseFloat(project.raisedAmount) || 0;
  const progressPercentage = requiredAmount > 0 ? (raisedAmount / requiredAmount) * 100 : 0;
  const remaining = requiredAmount - raisedAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{project.projectTitle}</DialogTitle>
              <DialogDescription className="mt-2">
                {schoolData?.schoolName || 'Loading school...'}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">Active</Badge>
              <Badge variant="outline">{project.projectTypeName || 'Project'}</Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-6">
            {/* Funding Progress */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold">Funding Progress</h3>
                <span className="text-2xl font-bold font-mono">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  ৳{raisedAmount.toLocaleString()} raised
                </span>
                <span className="text-muted-foreground">
                  ৳{Math.max(0, remaining).toLocaleString()} remaining
                </span>
              </div>
            </div>

            <Separator />

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Project Details</h3>
              <p className="text-muted-foreground leading-relaxed">
                {project.projectDescription || 'No description available for this project.'}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{schoolData?.address || 'Location not available'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Started: {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Goal: ৳{requiredAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{donorCount} donors supporting</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Project Status */}
            <div className="space-y-3">
              <h3 className="font-semibold">Project Status</h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                  <TrendingUp className="h-5 w-5 text-chart-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Completion Rate: {Math.round(project.completionRate || 0)}%</p>
                    <p className="text-xs text-muted-foreground">
                      Project progress based on milestones
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                  <TrendingUp className="h-5 w-5 text-chart-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Project Type: {project.projectTypeName}</p>
                    <p className="text-xs text-muted-foreground">
                      Category of development project
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onDonate(project)} data-testid="button-donate-from-details">
            <DollarSign className="h-4 w-4 mr-2" />
            Donate to This Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
