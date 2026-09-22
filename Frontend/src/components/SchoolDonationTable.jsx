import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Building2, GraduationCap, Target, Award } from "lucide-react";

const statusStyles = {
  completed: "bg-chart-2/20 text-chart-2",
  pending: "bg-chart-5/20 text-chart-5",
  failed: "bg-destructive/20 text-destructive",
  COMPLETED: "bg-chart-2/20 text-chart-2",
  PENDING: "bg-chart-5/20 text-chart-5",
  FAILED: "bg-destructive/20 text-destructive",
};

const getPurposeColor = (purpose) => {
  const colors = {
    'project_donation': 'bg-green-500',
    'student_sponsorship': 'bg-green-600',
    'ngo_project_donation': 'bg-green-700',
    'ngo_student_donation': 'bg-green-400'
  };
  return colors[purpose] || 'bg-gray-500';
};

const getPurposeLabel = (purpose) => {
  const labels = {
    'project_donation': 'School Project',
    'student_sponsorship': 'Student Sponsorship',
    'ngo_project_donation': 'NGO Project',
    'ngo_student_donation': 'NGO Student Support'
  };
  return labels[purpose] || 'Unknown';
};

const getPurposeIcon = (purpose) => {
  const icons = {
    'project_donation': Building2,
    'student_sponsorship': GraduationCap,
    'ngo_project_donation': Target,
    'ngo_student_donation': Award
  };
  return icons[purpose] || Award;
};

export default function SchoolDonationTable({ donations, maxRows = null }) {
  const displayDonations = maxRows ? donations.slice(0, maxRows) : donations;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Donation Details</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayDonations.map((donation) => {
            const purpose = donation.purpose === 'STUDENT_SPONSORSHIP' ? 'student_sponsorship' : 
                           donation.purpose === 'SCHOOL_PROJECT' ? 'project_donation' : 
                           donation.source === 'ngo' && donation.studentName ? 'ngo_student_donation' :
                           donation.source === 'ngo' && donation.projectTitle ? 'ngo_project_donation' : 'project_donation';
            const IconComponent = getPurposeIcon(purpose);
            const status = donation.paymentStatus || donation.status || 'pending';
            
            return (
              <TableRow key={`school-${donation.donationId || donation.id}-${purpose}`} data-testid={`row-donation-${donation.donationId || donation.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPurposeColor(purpose)}`}>
                      <IconComponent size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        {donation.projectTitle || donation.studentName || `${getPurposeLabel(purpose)} Support`}
                      </div>
                      <div className="text-sm text-gray-500">
                        From: {donation.donorName || 'Anonymous Donor'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={`${getPurposeColor(purpose)} text-white text-sm`}>
                    {getPurposeLabel(purpose)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-bold text-lg">৳{Math.round(donation.amount || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{donation.source || 'donor'}</div>
                </TableCell>
                <TableCell className="font-medium">
                  {new Date(donation.donatedAt || donation.date || donation.createdAt).toLocaleDateString('en-BD')}
                </TableCell>
                <TableCell>
                  <Badge className={statusStyles[status.toLowerCase()] || statusStyles.pending}>
                    {status.toLowerCase()}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}