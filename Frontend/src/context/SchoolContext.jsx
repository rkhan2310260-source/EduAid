import React, { createContext, useContext, useState } from 'react';

const SchoolContext = createContext();

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within SchoolProvider');
  }
  return context;
};

export const SchoolProvider = ({ children }) => {
  const [schoolData, setSchoolData] = useState(null);
  const [studentsData, setStudentsData] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [donationsData, setDonationsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8081/api';

  // AI FIX: Fetch school data with total funds calculation
  const fetchSchoolData = async (schoolId) => {
    try {
      const [schoolResponse, fundsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/schools/${schoolId}`),
        fetch(`${API_BASE_URL}/schools/${schoolId}/total-funds-received`)
      ]);
      
      if (schoolResponse.ok) {
        const schoolData = await schoolResponse.json();
        
        // Add total funds received from backend calculation
        if (fundsResponse.ok) {
          const totalFunds = await fundsResponse.json();
          schoolData.totalFundsReceived = totalFunds;
        } else {
          schoolData.totalFundsReceived = 0;
        }
        
        setSchoolData(schoolData);
        return schoolData;
      } else {
        throw new Error(`Failed to fetch school data: ${schoolResponse.status}`);
      }
    } catch (error) {
      console.error('Error fetching school data:', error);
      setError(error.message);
      return null;
    }
  };

  // Fetch students for a school
  const fetchStudentsData = async (schoolId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`);
      if (response.ok) {
        const allStudents = await response.json();
        // Filter students for this school
        const schoolStudents = allStudents.filter(student => 
          student.school?.schoolId === parseInt(schoolId) || student.schoolId === parseInt(schoolId)
        );
        setStudentsData(schoolStudents);
        return schoolStudents;
      } else {
        throw new Error(`Failed to fetch students: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError(error.message);
      return [];
    }
  };

  // Fetch projects for a school
  const fetchProjectsData = async (schoolId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/school-projects`);
      if (response.ok) {
        const allProjects = await response.json();
        // Filter projects for this school
        const schoolProjects = allProjects.filter(project => 
          project.school?.schoolId === parseInt(schoolId) || project.schoolId === parseInt(schoolId)
        );
        setProjectsData(schoolProjects);
        return schoolProjects;
      } else {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error.message);
      return [];
    }
  };

  // Fetch donations for a school
  const fetchDonationsData = async (schoolId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/donations/school/${schoolId}`);
      if (response.ok) {
        const donations = await response.json();
        setDonationsData(donations);
        return donations;
      } else {
        throw new Error(`Failed to fetch donations: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      setError(error.message);
      return [];
    }
  };

  // Refresh all data for a school
  const refreshData = async (schoolId) => {
    if (!schoolId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchSchoolData(schoolId),
        fetchStudentsData(schoolId),
        fetchProjectsData(schoolId),
        fetchDonationsData(schoolId)
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // AI FIX: Calculate school statistics with backend total funds calculation
  const getSchoolStats = () => {
    const totalStudents = studentsData.length;
    const highRiskStudents = studentsData.filter(student => 
      student.riskStatus === 'HIGH' || (student.dropoutPredictions && student.dropoutPredictions.some(p => p.riskStatus === 'HIGH'))
    ).length;
    
    const totalProjects = projectsData.length;
    const activeProjects = projectsData.filter(project => 
      !project.status || project.status.toLowerCase() === 'active'
    ).length;
    
    // AI FIX: Use backend calculation for total funds from all sources
    const totalFundsReceived = schoolData?.totalFundsReceived || 0;
    
    const totalFundsUtilized = projectsData
      .reduce((sum, project) => sum + (project.raisedAmount || 0), 0);

    return {
      totalStudents,
      highRiskStudents,
      totalProjects,
      activeProjects,
      totalFundsReceived,
      totalFundsUtilized
    };
  };

  const value = {
    // Data
    schoolData,
    studentsData,
    projectsData,
    donationsData,
    loading,
    error,
    
    // Functions
    fetchSchoolData,
    fetchStudentsData,
    fetchProjectsData,
    fetchDonationsData,
    refreshData,
    getSchoolStats,
    
    // Constants
    API_BASE_URL
  };

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
};