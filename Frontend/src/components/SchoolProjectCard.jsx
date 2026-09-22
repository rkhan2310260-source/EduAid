import React, { useState, useEffect } from "react";
import { Target, Users, Calendar, Eye, Receipt, Send, AlertTriangle } from "lucide-react";
import { toast } from 'react-toastify';

import ProjectPostUpdateModal from "./Modal/ProjectPostUpdateModal";
import ProjectRecordExpenseModal from "./Modal/ProjectRecordExpenseModal";


const getStatusColor = (status) => {
  switch ((status || "").toLowerCase()) {
    case "draft": return "bg-gray-100 text-gray-700";
    case "active": return "bg-yellow-100 text-yellow-700";
    case "funded": return "bg-green-100 text-green-700";
    case "in_progress": return "bg-blue-100 text-blue-700";
    case "completed": return "bg-emerald-100 text-emerald-700";
    case "cancelled": return "bg-red-100 text-red-700";
    case "unpaid": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getRiskColor = (risk) => {
  if (!risk) return "text-gray-600";
  const lower = risk.toLowerCase();
  if (lower.includes("high")) return "text-red-600";
  if (lower.includes("medium")) return "text-orange-600";
  return "text-green-600";
};

export default function SchoolProjectCard({ project, onViewDetails, onRecordExpense, onPostUpdate, onDonate, onSendRequest, showAllButtons = true, showDescription = true, showProjectInfo = true, isNgoMode = false, showRequestButton = false, hasDonated = false }) {
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [projectData, setProjectData] = useState(project);
  
  
  // Refresh project data when component mounts or project ID changes
  useEffect(() => {
    if (project && (project.projectId || project.project_id)) {
      refreshProjectData();
    }
  }, [project?.projectId, project?.project_id]);
 
  // Use backend DTO field names and computed values
  const requiredAmount = projectData.requiredAmount || 0;
  const raisedAmount = projectData.raisedAmount || 0;
  const completionRate = projectData.completionRate || 0;
  
  // Frontend logic: Auto-complete when raised >= required
  const isFullyFunded = raisedAmount >= requiredAmount && requiredAmount > 0;
  const projectStatus = isFullyFunded ? 'COMPLETED' : (projectData.projectStatus || 'ACTIVE');
  
  // Use backend-computed funding percentage or calculate and cap at 100%
  const fundingPercentage = projectData.fundingPercentage || 
    Math.min(100, requiredAmount > 0 ? Math.round((raisedAmount / requiredAmount) * 100) : 0);
    
  // Refresh project data from backend
  const refreshProjectData = async () => {
    const projectId = projectData.projectId || projectData.project_id;
    if (projectId) {
      try {
        // Fetch project data
        const projectResponse = await fetch(`http://localhost:8081/api/school-projects/${projectId}`);
        if (projectResponse.ok) {
          const updatedProject = await projectResponse.json();
          
          // The backend should already calculate raisedAmount from donations
          // If not available, try to fetch donations
          if (!updatedProject.raisedAmount) {
            try {
              const donationsResponse = await fetch(`http://localhost:8081/api/donations`);
              if (donationsResponse.ok) {
                const donations = await donationsResponse.json();
                const projectDonations = donations.filter(d => 
                  (d.projectId === projectId || d.project?.projectId === projectId) && 
                  d.paymentStatus === 'COMPLETED'
                );
                const totalRaised = projectDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
                updatedProject.raisedAmount = totalRaised;
              }
            } catch (donationError) {
              console.warn('Failed to fetch donations:', donationError);
            }
          }
          
          setProjectData(updatedProject);
          return updatedProject;
        }
      } catch (error) {
        console.error('Failed to refresh project data:', error);
      }
    }
    return null;
  };

  const handlePostUpdate = async (data) => {
    try {
      // Validate progress percentage - new value must be greater than current
      const currentProgress = projectData.completionRate || 0;
      const newProgress = data.progressPercentage || 0;
      
      if (newProgress <= currentProgress) {
        throw new Error(`Progress must be greater than current ${currentProgress}%`);
      }
      
      console.log('Posting update with data:', data);
      
      // FIX: Make API call here since modal no longer makes direct calls
      const response = await fetch('http://localhost:8081/api/project-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        console.log('Project update posted successfully');
        
        // Refresh project data to get updated completion rate and raised amount
        await refreshProjectData();
        
        if (onPostUpdate) onPostUpdate(projectData);
      } else {
        const errorText = await response.text();
        console.error('Failed to post update:', response.status, response.statusText, errorText);
        throw new Error(`Failed to post update: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error posting update:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleRecordExpense = async (data) => {
    try {
      // FIX: Make API call here since modal no longer makes direct calls
      const response = await fetch('http://localhost:8081/api/fund-utilization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        console.log('Expense recorded successfully');
        // Refresh project data after recording expense
        await refreshProjectData();
        if (onRecordExpense) onRecordExpense(project);
      } else {
        const errorText = await response.text();
        console.error('Failed to record expense:', response.status, response.statusText, errorText);
        toast.error(`Failed to record expense: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error recording expense:', error);
      toast.error(`Error recording expense: ${error.message}`);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col h-full">
           {/* Modals */}
      <ProjectPostUpdateModal 
        isOpen={openUpdate} 
        onClose={() => setOpenUpdate(false)} 
        onSubmit={handlePostUpdate}
        project={projectData} 
      />
      <ProjectRecordExpenseModal 
        isOpen={openExpense} 
        onClose={() => setOpenExpense(false)} 
        onSubmit={handleRecordExpense}
        project={projectData} 
      />
      
      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-grow">
            <div className="items-center  justify-between gap-3 flex ">
              <h3 className="text-xl font-bold text-foreground line-clamp-2">
                {projectData.projectTitle || projectData.project_name || projectData.project_title || projectData.title || 'Untitled Project'}
              </h3>
              <div className=" gap-2  flex flex-col justify-end w-max">

              <span className={`text-xs px-2 py-1 rounded-full ${
                projectStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {projectStatus === 'COMPLETED' ? 'Completed' : 'Active'}
              </span>
              </div>
            </div>
             <div className="text-muted-foreground text-sm mb-3">
                <div>{projectData.projectTypeName || 'Unknown Type'}</div>
              </div>
            {/*: Always show description if enabled, only 1 line for dashboard cards */}
            {showDescription && (projectData.projectDescription || projectData.project_description) && (
              <div className="mt-2 text-xs text-gray-600 line-clamp-1 mb-3">
                {projectData.projectDescription || projectData.project_description}
              </div>
            )}
            
             
            
            {showProjectInfo && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {projectData.projectTypeName || projectData.project_type || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {projectData.schoolName || `School ID: ${projectData.schoolId || 'N/A'}`}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Created: {projectData.createdAt ? new Date(projectData.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Section - Fixed height for alignment */}
    

        {/* Action Buttons - pushed to bottom */}
        <div className="mt-auto">
              <div className="mb-4 flex flex-col ">
          {/* Funding Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">
                Raised: Tk {raisedAmount.toLocaleString()} / Tk {requiredAmount.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                {fundingPercentage}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, fundingPercentage)}%` }}
              />
            </div>
          </div>

          {/* Completion Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">
                Completion: {Math.round(completionRate)}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.round(completionRate)}%` }}
              />
            </div>
          </div>
        </div>
          {showAllButtons ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onViewDetails(projectData.projectId || projectData.project_id)}
                className="w-full py-2 text-sm text-green-600 bg-white rounded-lg hover:bg-green-50 transition-colors font-medium"
              >
                View Details
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOpenExpense(true)}
                  className="py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Record Expense
                </button>
                <button
                  onClick={() => setOpenUpdate(true)}
                  className="py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Post Update
                </button>
              </div>
            </div>
          ) : isNgoMode ? (
            showRequestButton ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSendRequest && onSendRequest(projectData)}
                  className="normal flex items-center justify-center gap-2 py-2 text-sm rounded-lg"
                >
                  <Send className="w-4 h-4" /> Request
                </button>
                <button
                  onClick={() => onViewDetails(projectData.projectId || projectData.project_id)}
                  className="secondary !border-0 hover:!bg-gray-50 hover:!text-[#0E792E] py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" /> Details
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onDonate && onDonate(projectData)}
                  className="normal flex items-center justify-center gap-2 py-2 text-sm rounded-lg"
                >
                  💰 {hasDonated ? 'Donate Again' : 'Donate Now'}
                </button>
                <button
                  onClick={() => onViewDetails(projectData.projectId || projectData.project_id)}
                  className="secondary !border-0 hover:!bg-gray-50 hover:!text-[#0E792E] py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" /> {hasDonated ? 'Analytics' : 'Details'}
                </button>
              </div>
            )
          ) : (
            <button
              onClick={() => onViewDetails(projectData.projectId || projectData.project_id)}
              className="secondary !border-0 hover:!bg-gray-50 hover:!text-[#0E792E] w-full py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Eye className="w-4 h-4" /> View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
