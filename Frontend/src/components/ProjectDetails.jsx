import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Target, TrendingUp, Coins, Calendar, User, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectRecordExpenseModal from "./Modal/ProjectRecordExpenseModal";
import ProjectUpdateModal from "./Modal/ProjectPostUpdateModal";
import FundTransparencyModal from "./Modal/FundTransparencyModal";
import SchoolDonationTable from "./SchoolDonationTable";
import DashSidebar from "./DashSidebar";
import { useApp } from '../context/AppContext';
import { toast } from 'react-toastify';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { schoolData, API_BASE_URL } = useApp();
  const [showRecordExpense, setShowRecordExpense] = useState(false);
  const [showPostUpdate, setShowPostUpdate] = useState(false);
  const [showTransparencyModal, setShowTransparencyModal] = useState(false);
  const [selectedUtilizationId, setSelectedUtilizationId] = useState(null);
  const [project, setProject] = useState(null);
  const [utilizations, setUtilizations] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [donations, setDonations] = useState([]);
  const [transparencies, setTransparencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Determine if came from dashboard or projects page
  const cameFromDashboard = document.referrer.includes('/dashboard/');
  
  // AI FIX: Determine user role for transparency card (school can edit, others view only)
  const getUserRole = () => {
    const path = window.location.pathname;
    if (path.includes('/dashboard/') || path.includes('/projects/')) return 'school';
    if (path.includes('/ngo/')) return 'ngo';
    if (path.includes('/donor/')) return 'donor';
    return 'school'; // Default to school
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  // AI FIX: Fetch project details with comprehensive validation
  const fetchProjectDetails = async () => {
    if (!projectId) {
      console.error('No projectId provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // AI FIX: Validate projectId before making API call
      const validProjectId = parseInt(projectId);
      if (isNaN(validProjectId)) {
        console.error('Invalid projectId:', projectId);
        setIsLoading(false);
        return;
      }

      const projectResponse = await fetch(`${API_BASE_URL}/school-projects/${validProjectId}`);
      
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        // Frontend logic: Auto-complete when raised >= required
        const requiredAmt = projectData.requiredAmount || 0;
        const raisedAmt = projectData.raisedAmount || 0;
        const isFullyFunded = raisedAmt >= requiredAmt && requiredAmt > 0;
        const computedStatus = isFullyFunded ? 'completed' : (projectData.projectStatus?.toLowerCase() || 'active');
        const computedPercentage = projectData.fundingPercentage || 
          Math.min(100, requiredAmt > 0 ? Math.round((raisedAmt / requiredAmt) * 100) : 0);
        
        setProject({
          projectId: projectData.projectId,
          projectTitle: projectData.projectTitle,
          projectDescription: projectData.projectDescription || 'No description available',
          status: computedStatus,
          projectType: { typeName: projectData.projectTypeName || 'General' },
          priorityLevel: 'Medium', // Default priority
          startDate: projectData.createdAt ? new Date(projectData.createdAt).toLocaleDateString() : null,
          expectedCompletion: 'Not specified',
          requiredAmount: requiredAmt,
          raisedAmount: raisedAmt,
          fundingPercentage: computedPercentage,
          utilizedAmount: 0 // Will be calculated from fund utilizations
        });
        
        // Fetch fund utilizations for this project
        const utilizationsResponse = await fetch(`${API_BASE_URL}/fund-utilization/project/${projectId}`);
        if (utilizationsResponse.ok) {
          const utilizationsData = await utilizationsResponse.json();
          const mappedUtilizations = utilizationsData.map(util => ({
            utilizationId: util.utilizationId,
            description: util.specificPurpose || 'No description',
            amount: util.amountUsed || 0,
            date: util.utilizationDate,
            vendor: util.vendorName,
            status: util.utilizationStatus,
            // AI FIX: Add additional utilization fields for display
            billInvoiceNumber: util.billInvoiceNumber,
            detailedDescription: util.detailedDescription,
            receiptImageUrl: util.receiptImageUrl
          }));
          // Sort by date (newest first)
          mappedUtilizations.sort((a, b) => new Date(b.date) - new Date(a.date));
          setUtilizations(mappedUtilizations);
          
          // Calculate total utilized amount
          const totalUtilized = utilizationsData.reduce((sum, util) => sum + (util.amountUsed || 0), 0);
          setProject(prev => ({ ...prev, utilizedAmount: totalUtilized }));
        }
        
        // AI FIX: Fetch fund transparencies for this project
        try {
          const transparenciesResponse = await fetch(`${API_BASE_URL}/fund-transparencies/by-project/${projectId}`);
          if (transparenciesResponse.ok) {
            const transparenciesData = await transparenciesResponse.json();
            setTransparencies(transparenciesData.map(trans => ({
              transparencyId: trans.transparencyId,
              beforePhotos: Array.isArray(trans.beforePhotos) ? trans.beforePhotos : (trans.beforePhotos ? JSON.parse(trans.beforePhotos) : []),
              afterPhotos: Array.isArray(trans.afterPhotos) ? trans.afterPhotos : (trans.afterPhotos ? JSON.parse(trans.afterPhotos) : []),
              beneficiaryFeedback: trans.beneficiaryFeedback,
              additionalNotes: trans.additionalNotes,
              quantityPurchased: trans.quantityPurchased,
              unitCost: trans.unitCost,
              unitMeasurement: trans.unitMeasurement,
              isPublic: trans.isPublic
            })));
          }
        } catch (error) {
          console.log('No transparency data available:', error);
          setTransparencies([]);
        }
        
        // Fetch project updates using project-specific endpoint
        const updatesResponse = await fetch(`${API_BASE_URL}/project-updates/project/${projectId}`);
        if (updatesResponse.ok) {
          const updatesData = await updatesResponse.json();
          const mappedUpdates = updatesData.map(update => ({
            updateId: update.updateId,
            updateTitle: update.updateTitle,
            updateDescription: update.updateDescription,
            progressPercentage: update.progressPercentage || 0,
            amountUtilized: update.amountUtilized || 0,
            createdAt: update.createdAt || new Date().toISOString(),
            updatedByName: 'School Admin',
    
            imagesUrls: Array.isArray(update.imagesUrls) ? update.imagesUrls : (update.imagesUrls ? JSON.parse(update.imagesUrls) : [])
          }));
          // Sort by date (newest first)
          mappedUpdates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setUpdates(mappedUpdates);
        }
        
        // AI FIX: Fetch donations using all-sources endpoint like SchoolReporting
        try {
          if (projectData.schoolId) {
            console.log('Fetching donations for schoolId:', projectData.schoolId, 'projectId:', projectId);
            const donationsResponse = await fetch(`${API_BASE_URL}/donations/school/${projectData.schoolId}/all-sources`);
            if (donationsResponse.ok) {
              const allDonations = await donationsResponse.json();
              console.log('All donations from backend:', allDonations.length, allDonations);
              
              // Filter for this specific project and COMPLETED status
              const projectDonations = allDonations.filter(donation => {
                const matchesProject = donation.projectId === parseInt(projectId) || 
                                      donation.project?.projectId === parseInt(projectId) ||
                                      donation.projectTitle?.includes(projectData.projectTitle);
                const isCompleted = donation.paymentStatus === 'COMPLETED';
                console.log('Donation check:', donation.donationId, 'projectId:', donation.projectId, 'matches:', matchesProject, 'completed:', isCompleted);
                return matchesProject && isCompleted;
              });
              
              console.log('Filtered project donations:', projectDonations.length, projectDonations);
              const totalAmount = projectDonations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
              console.log('Total donation amount:', totalAmount);
              
              // Sort by date (newest first)
              projectDonations.sort((a, b) => new Date(b.donatedAt) - new Date(a.donatedAt));
              setDonations(projectDonations);
            } else {
              console.error('Failed to fetch donations:', donationsResponse.status);
              setDonations([]);
            }
          }
        } catch (error) {
          console.error('Error fetching donations:', error);
          setDonations([]);
        }
      }

    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DashSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Project not found</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6"
          data-testid="button-back-to-projects"
        >
          <ChevronLeft className="w-5 h-5" />
          {cameFromDashboard ? 'Back to Dashboard' : 'Back to Projects'}
        </Button>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2" data-testid="text-project-title">
                {project.projectTitle}
              </h2>
              <span className={`text-sm px-3 py-1 rounded-full ${
                project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                project.status === 'funded' ? 'bg-green-100 text-green-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{project.projectDescription}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <p className="font-semibold">{project.projectType.typeName}</p>
            </div>
            <div>
              <span className="text-gray-500">Priority:</span>
              <p className="font-semibold">{project.priorityLevel}</p>
            </div>
            <div>
              <span className="text-gray-500">Start Date:</span>
              <p className="font-semibold">{project.startDate || 'Not started'}</p>
            </div>
            <div>
              <span className="text-gray-500">Expected Completion:</span>
              <p className="font-semibold">{project.expectedCompletion}</p>
            </div>
          </div>
        </div>

        {/* Funding Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">Required</span>
              <Target className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800" data-testid="text-required-amount">
              ৳{(project.requiredAmount || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">Raised</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600" data-testid="text-raised-amount">
              ৳{(project.raisedAmount || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {Math.min(100, project.fundingPercentage || Math.round(((project.raisedAmount || 0) / (project.requiredAmount || 1)) * 100))}% funded
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">Utilized</span>
              <Coins className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600" data-testid="text-utilized-amount">
              ৳{(project.utilizedAmount || 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ৳{((project.raisedAmount || 0) - (project.utilizedAmount || 0)).toLocaleString()} remaining
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="utilizations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="utilizations" data-testid="tab-utilizations">Fund Utilization</TabsTrigger>
            <TabsTrigger value="updates" data-testid="tab-updates">Project Updates</TabsTrigger>
            <TabsTrigger value="donations" data-testid="tab-donations">Donations</TabsTrigger>
          </TabsList>

          <TabsContent value="utilizations" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Fund Utilization Records</h3>
              {/* AI FIX: Only show Record Expense button for school users */}
              {getUserRole() === 'school' && (
                <Button 
                  onClick={() => setShowRecordExpense(true)}
                  data-testid="button-record-expense-tab"
                >
                  Record Expense
                </Button>
              )}
            </div>
            {utilizations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No expenses recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {utilizations.map((expense, index) => (
                  <div key={`expense-${expense.utilizationId}-${index}`} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-grow">
                        <h4 className="font-bold text-gray-800 mb-2">{expense.description}</h4>
                        {expense.detailedDescription && (
                          <p className="text-sm text-gray-600 mb-3">{expense.detailedDescription}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-green-600" />
                            {expense.date ? new Date(expense.date).toLocaleDateString() : 'No date'}
                          </span>
                          {expense.vendor && (
                            <span className="text-gray-700"><span className="font-medium">Vendor:</span> {expense.vendor}</span>
                          )}
                          {expense.billInvoiceNumber && (
                            <span className="text-gray-700"><span className="font-medium">Invoice:</span> {expense.billInvoiceNumber}</span>
                          )}
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            expense.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            expense.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {expense.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-green-600">৳{parseFloat(expense.amount || 0).toLocaleString()}</p>
                        <button
                          onClick={() => {
                            setSelectedUtilizationId(expense.utilizationId);
                            setShowTransparencyModal(true);
                          }}
                          className="mt-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                    {expense.receiptImageUrl && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <img 
                          src={`${API_BASE_URL.replace('/api', '')}${expense.receiptImageUrl}`}
                          alt="Receipt"
                          className="w-40 h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                ))}
                
           
              </div>
            )}
          </TabsContent>

          <TabsContent value="updates" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Project Updates</h3>
              {/* AI FIX: Only show Post Update button for school users */}
              {getUserRole() === 'school' && (
                <Button 
                  onClick={() => setShowPostUpdate(true)}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-post-update-tab"
                >
                  Post Update
                </Button>
              )}
            </div>
            {updates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No updates posted yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((update, index) => (
                  <div key={`update-${update.updateId}-${index}`} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow" data-testid={`update-${update.updateId}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-grow">
                        <h4 className="font-bold text-gray-800 mb-2">{update.updateTitle}</h4>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{update.updateDescription}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">{new Date(update.createdAt).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">{update.updatedByName}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="bg-green-50 rounded-lg px-4 py-3">
                          <p className="text-3xl font-bold text-green-600">{update.progressPercentage}%</p>
                          <p className="text-xs text-green-700 font-medium mt-1">Progress</p>
                        </div>
                      </div>
                    </div>
                    
                    {update.imagesUrls && update.imagesUrls.length > 0 && (
                      <div className="mb-3 pt-3 border-t border-gray-100">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">Update Images</h5>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {update.imagesUrls.map((url, index) => (
                            <img 
                              key={index}
                              src={`${API_BASE_URL.replace('/api', '')}${url}`}
                              alt={`Update ${index + 1}`}
                              className="w-40 h-32 object-cover rounded-lg border border-gray-200 flex-shrink-0 hover:scale-105 transition-transform"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                      <p className="text-sm font-semibold text-green-800">Amount Utilized: <span className="text-lg">৳{update.amountUtilized.toLocaleString()}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="donations" className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Donations Received</h3>
            {donations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No donations received yet</p>
              </div>
            ) : (
              <SchoolDonationTable donations={donations} />
            )}
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* AI FIX: Only show modals for school users */}
      {getUserRole() === 'school' && (
        <ProjectRecordExpenseModal 
          isOpen={showRecordExpense} 
          onClose={() => setShowRecordExpense(false)}
          onSubmit={async (data) => {
            try {
              console.log('Submitting expense to API:', JSON.stringify(data, null, 2));
              
              // FIX: First create basic fund utilization without transparency
              const utilizationData = { ...data };
              const transparencyData = utilizationData.transparency;
              delete utilizationData.transparency; // Remove transparency from first call
              
              const utilizationResponse = await fetch(`${API_BASE_URL}/fund-utilization/basic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(utilizationData)
              });
              
              if (!utilizationResponse.ok) {
                const errorText = await utilizationResponse.text();
                console.error('Utilization API Error:', utilizationResponse.status, errorText);
                toast.error(`Failed to record expense: ${errorText}`);
                throw new Error(`Failed to record expense: ${errorText}`);
              }
              
              const utilizationResult = await utilizationResponse.json();
              console.log('Fund utilization created:', utilizationResult);
              
              // FIX: Then add transparency if provided
              if (transparencyData) {
                const transparencyResponse = await fetch(`${API_BASE_URL}/fund-utilization/${utilizationResult.utilizationId}/transparency`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(transparencyData)
                });
                
                if (!transparencyResponse.ok) {
                  const errorText = await transparencyResponse.text();
                  console.warn('Transparency creation failed:', errorText);
                  // Don't fail the whole operation if transparency fails
                }
              }
              
              toast.success('Expense recorded successfully!');
              await fetchProjectDetails(); // Refresh all data
            } catch (error) {
              console.error('Error recording expense:', error);
              if (!error.message.includes('Failed to record expense:')) {
                toast.error('Failed to record expense. Please try again.');
              }
              throw error; // Let modal handle the error display
            }
          }}
          project={project}
        />
      )}
      
      {/*  Only show modals for school users */}
      {getUserRole() === 'school' && (
        <ProjectUpdateModal
          isOpen={showPostUpdate} 
          onClose={() => setShowPostUpdate(false)}
          onSubmit={async (data) => {
            try {
              // FIX: Make API call here since modal no longer makes direct calls
              const response = await fetch(`${API_BASE_URL}/project-updates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (response.ok) {
                await fetchProjectDetails(); // Refresh data
              } else {
                const errorText = await response.text();
                throw new Error(`Failed to post update: ${errorText}`);
              }
            } catch (error) {
              console.error('Error posting update:', error);
              throw error; // Let modal handle the error display
            }
          }}
          project={project}
        />
      )}

      {/*  Fund Transparency Modal */}
      <FundTransparencyModal
        isOpen={showTransparencyModal}
        onClose={() => {
          setShowTransparencyModal(false);
          setSelectedUtilizationId(null);
        }}
        utilizationId={selectedUtilizationId}
        API_BASE_URL={API_BASE_URL}
      />
    </div>
  );
}
