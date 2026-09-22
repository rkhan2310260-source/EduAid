import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDonor } from "@/context/DonorContext";
import { useNgo } from "../../context/NgoContext";


export default function DonorDonationDialog({ 
  open, 
  onOpenChange, 
  donationType = "general",
  title,
  description,
  itemData = null, // student or project data
  onDonationSuccess // callback for successful donations
}) {
  const { toast } = useToast();
  const { refreshData } = useNgo();
  const [formData, setFormData] = useState({
    amount: donationType === "student" ? "3000" : "",
    message: "",
  });

  // Update amount when donation type changes
  useEffect(() => {
    if (donationType === "student") {
      setFormData(prev => ({ ...prev, amount: "3000" }));
    }
  }, [donationType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount) {
      toast({
        title: "Error",
        description: "Please enter donation amount.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if user is donor or NGO
      const donorIdRaw = localStorage.getItem('donorId');
      const ngoIdRaw = localStorage.getItem('ngoId');
      
      // Parse JSON if needed
      let donorId = null;
      let ngoId = null;
      
      if (donorIdRaw) {
        try {
          const parsed = JSON.parse(donorIdRaw);
          donorId = parsed.donorId || parsed;
        } catch {
          donorId = donorIdRaw;
        }
      }
      
      if (ngoIdRaw) {
        try {
          const parsed = JSON.parse(ngoIdRaw);
          ngoId = parsed.ngoId || parsed;
        } catch {
          ngoId = ngoIdRaw;
        }
      }
      
      if (!donorId && !ngoId) {
        toast({
          title: "Error",
          description: "Please login to make a donation.",
          variant: "destructive"
        });
        return;
      }

      // Determine product name and build URL parameters based on donation type
      let productName = "General Donation";
      let productCategory = "Donation";
      const donationAmount = donationType === "student" ? "3000" : formData.amount;
      let urlParams = `amount=${donationAmount}`;
      
      // Add appropriate ID based on user type
      if (donorId) {
        urlParams += `&donorId=${donorId}`;
      } else if (ngoId) {
        urlParams += `&ngoId=${ngoId}`;
      }
      
      if (donationType === "student") {
        productName = "Student Sponsorship";
        productCategory = "Sponsorship";
        if (itemData && itemData.studentId) {
          urlParams += `&studentId=${itemData.studentId}`;
        }
      } else if (donationType === "project" && itemData) {
        productName = itemData.projectTitle || itemData.title || "Project Donation";
        productCategory = "Project";
        if (itemData.projectId || itemData.id) {
          urlParams += `&projectId=${itemData.projectId || itemData.id}`;
        }
      }
      
      urlParams += `&productName=${encodeURIComponent(productName)}&productCategory=${encodeURIComponent(productCategory)}`;
      
      const url = `http://localhost:8081/api/payment-transactions/sslcommerz/initiate?${urlParams}`;
      console.log('Payment URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Payment result:', result);
      
      if (result.status === 'SUCCESS' && result.paymentUrl) {
        console.log('Opening payment URL:', result.paymentUrl);
        // Open SSL Commerz payment page
        const popup = window.open(result.paymentUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        
        if (!popup) {
          toast({
            title: "Popup Blocked",
            description: "Please allow popups for this site and try again.",
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Payment Initiated",
          description: "Please complete your payment in the new window.",
        });
        
        // Reset form and close dialog
        setFormData({
          amount: "",
          message: "",
        });
        
        onOpenChange(false);
        
        // Auto-refresh NGO data after successful payment initiation
        const ngoId = localStorage.getItem('ngoId');
        if (ngoId && refreshData) {
          // Delay refresh to allow payment processing
          setTimeout(() => {
            refreshData(ngoId);
          }, 2000);
        }
        
        // Call success callback if provided
        if (onDonationSuccess) {
          setTimeout(() => {
            onDonationSuccess();
          }, 2000);
        }
      } else {
        console.error('Payment initiation failed:', result);
        toast({
          title: "Payment Error",
          description: result.message || "Failed to initiate payment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: "An error occurred while processing your payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {donationType === "project" ? "Project Donation" : title || "Make a Donation"}
          </DialogTitle>
          <DialogDescription>
            {description || "Support education in Bangladesh"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {itemData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                {donationType === "student" && (
                  <div>
                    <h4 className="font-semibold text-gray-900">{itemData.studentName || itemData.name}</h4>
                    <p className="text-sm text-gray-600">{itemData.schoolName || 'School information not available'}</p>
                    <p className="text-xs text-gray-500 mt-1">{itemData.classLevel || itemData.class}</p>
                  </div>
                )}
                {donationType === "project" && (
                  <div>
                    <h4 className="font-semibold text-gray-900">{itemData.projectTitle || itemData.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{itemData.projectDescription || itemData.description}</p>
                    <p className="text-sm text-gray-600 mt-1">{itemData.schoolName || `School ID: ${itemData.schoolId}`}</p>
                    <p className="text-sm font-medium text-green-600 mt-2">Fund Needed: ৳{(itemData.requiredAmount || 0).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Donation Amount (৳) *</Label>
              {donationType === "student" ? (
                <div>
                  <Input
                    id="amount"
                    type="number"
                    value="3000"
                    disabled
                    className="bg-gray-100"
                    data-testid="input-donation-amount"
                  />
                  <p className="text-sm text-gray-600 mt-1">Student sponsorship amount is fixed at ৳3,000 per month</p>
                </div>
              ) : (
                <div>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    data-testid="input-donation-amount"
                  />
                  <div className="flex gap-2 mt-2">
                    {[1000, 5000, 10000, 25000].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, amount: preset.toString() })}
                        data-testid={`button-preset-${preset}`}
                      >
                        Tk {preset.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>



            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a message of encouragement..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                data-testid="input-donation-message"
              />
            </div>


          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-donation">
              Donate Tk {(donationType === "student" ? 3000 : (formData.amount ? parseInt(formData.amount) : 0)).toLocaleString()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
