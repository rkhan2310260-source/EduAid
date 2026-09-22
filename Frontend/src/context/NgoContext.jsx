import React, { createContext, useContext, useState, useEffect } from 'react';

const NgoContext = createContext();

export const useNgo = () => {
  const context = useContext(NgoContext);
  if (!context) {
    throw new Error('useNgo must be used within an NgoProvider');
  }
  return context;
};

export const NgoProvider = ({ children }) => {
  const [ngoData, setNgoData] = useState(null);
  const [projectsData, setProjectsData] = useState([]);
  const [donationsData, setDonationsData] = useState([]);
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Automatic initialization is disabled to prevent login loading issues
  // Data will be loaded manually when components call initializeForNgo

  const fetchNgoData = async (ngoId) => {
    if (!ngoId) return;
    
    console.log('NgoContext: Fetching data for NGO ID:', ngoId);
    setLoading(true);
    setError(null);
    
    try {
      const API_BASE_URL = 'http://localhost:8081/api';
      
      // Fetch NGO basic data
      try {
        const ngoRes = await fetch(`${API_BASE_URL}/ngos/${ngoId}`);
        if (ngoRes.ok) {
          const ngo = await ngoRes.json();
          setNgoData(ngo);
        }
      } catch (err) {
        console.warn('Failed to fetch NGO data:', err);
      }
      
      // Fetch NGO projects
      try {
        const projectsRes = await fetch(`${API_BASE_URL}/ngo-projects`);
        if (projectsRes.ok) {
          const allProjects = await projectsRes.json();
          const ngoProjects = Array.isArray(allProjects) ? allProjects.filter(p => p.ngoId == ngoId) : [];
          setProjectsData(ngoProjects);
        }
      } catch (err) {
        console.warn('Failed to fetch NGO projects:', err);
        setProjectsData([]);
      }
      
      // Fetch NGO donations using correct endpoints
      let allDonations = [];
      try {
        const studentDonationsRes = await fetch(`${API_BASE_URL}/ngo-student-donations/ngo/${ngoId}`);
        if (studentDonationsRes.ok) {
          const studentDonations = await studentDonationsRes.json();
          allDonations = [...allDonations, ...(Array.isArray(studentDonations) ? studentDonations : [])];
        }
      } catch (err) {
        console.warn('Failed to fetch student donations:', err);
      }
      
      try {
        const projectDonationsRes = await fetch(`${API_BASE_URL}/ngo-project-donations/ngo/${ngoId}`);
        if (projectDonationsRes.ok) {
          const projectDonations = await projectDonationsRes.json();
          allDonations = [...allDonations, ...(Array.isArray(projectDonations) ? projectDonations : [])];
        }
      } catch (err) {
        console.warn('Failed to fetch project donations:', err);
      }
      
      console.log('NgoContext: Fetched donations data for NGO', ngoId, ':', allDonations);
      setDonationsData(allDonations);
      
      // Fetch gamification data for specific NGO
      try {
        console.log('NgoContext: Fetching gamification data for NGO', ngoId);
        const gamificationRes = await fetch(`${API_BASE_URL}/ngo-gamification/ngo/${ngoId}`);
        
        if (gamificationRes.ok) {
          const ngoGamification = await gamificationRes.json();
          console.log('NgoContext: Received gamification data:', ngoGamification);
          
          // Calculate additional fields for frontend
          const totalPoints = ngoGamification.totalPoints || 0;
          const pointsToNextLevel = calculatePointsToNextLevel(totalPoints);
          const progressPercentage = calculateProgressPercentage(totalPoints);
          
          const gamificationWithCalculations = {
            ...ngoGamification,
            pointsToNextLevel,
            progressPercentage
          };
          
          console.log('NgoContext: Setting gamification data:', gamificationWithCalculations);
          setGamificationData(gamificationWithCalculations);
        } else {
          console.warn('NgoContext: Gamification API returned non-OK status:', gamificationRes.status);
          const errorText = await gamificationRes.text();
          console.warn('NgoContext: Gamification API error response:', errorText);
          
          // Still set default data but log the issue
          setGamificationData({
            ngoId: parseInt(ngoId),
            totalPoints: 0,
            badgesEarned: '["New NGO"]',
            pointsToNextLevel: 100,
            progressPercentage: 0
          });
        }
      } catch (gamificationError) {
        console.error('NgoContext: Error fetching gamification data:', gamificationError);
        // Set default gamification data
        setGamificationData({
          ngoId: parseInt(ngoId),
          totalPoints: 0,
          badgesEarned: '["New NGO"]',
          pointsToNextLevel: 100,
          progressPercentage: 0
        });
      }
      
    } catch (err) {
      console.error('Error fetching NGO data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = (ngoId) => {
    if (loading) {
      console.log('NgoContext: Already loading, skipping refresh for NGO', ngoId);
      return;
    }
    console.log('NgoContext: Refreshing all data for NGO', ngoId);
    fetchNgoData(ngoId);
  };
  
  // Manual initialization for dashboard components
  const initializeForNgo = (ngoId) => {
    if (ngoId && !loading) {
      console.log('NgoContext: Manual initialization for NGO', ngoId);
      fetchNgoData(ngoId);
    }
  };
  
  const refreshGamificationData = async (ngoId) => {
    if (!ngoId) return;
    
    console.log('NgoContext: Refreshing gamification data only for NGO', ngoId);
    try {
      const API_BASE_URL = 'http://localhost:8081/api';
      const gamificationRes = await fetch(`${API_BASE_URL}/ngo-gamification/ngo/${ngoId}`);
      
      if (gamificationRes.ok) {
        const ngoGamification = await gamificationRes.json();
        console.log('NgoContext: Refreshed gamification data:', ngoGamification);
        
        const totalPoints = ngoGamification.totalPoints || 0;
        const pointsToNextLevel = calculatePointsToNextLevel(totalPoints);
        const progressPercentage = calculateProgressPercentage(totalPoints);
        
        setGamificationData({
          ...ngoGamification,
          pointsToNextLevel,
          progressPercentage
        });
      } else {
        console.warn('NgoContext: Failed to refresh gamification data, status:', gamificationRes.status);
      }
    } catch (error) {
      console.error('NgoContext: Error refreshing gamification data:', error);
    }
  };

  const updateProjectsData = (newProjects) => {
    setProjectsData(newProjects);
  };

  const updateDonationsData = (newDonations) => {
    setDonationsData(newDonations);
  };

  // Helper functions for gamification calculations
  const calculatePointsToNextLevel = (currentPoints) => {
    const levels = [100, 200, 500, 1000, 2000];
    for (let level of levels) {
      if (currentPoints < level) {
        return level - currentPoints;
      }
    }
    return 0; // Max level reached
  };

  const calculateProgressPercentage = (currentPoints) => {
    const levels = [0, 100, 200, 500, 1000, 2000];
    for (let i = 1; i < levels.length; i++) {
      if (currentPoints < levels[i]) {
        const prevLevel = levels[i - 1];
        const nextLevel = levels[i];
        const progress = ((currentPoints - prevLevel) / (nextLevel - prevLevel)) * 100;
        return Math.min(Math.max(progress, 0), 100);
      }
    }
    return 100; // Max level reached
  };

  const value = {
    ngoData,
    projectsData,
    donationsData,
    gamificationData,
    loading,
    error,
    fetchNgoData,
    refreshData,
    refreshGamificationData,
    initializeForNgo,
    updateProjectsData,
    updateDonationsData,
    setNgoData,
    setProjectsData,
    setDonationsData,
    setGamificationData
  };

  return (
    <NgoContext.Provider value={value}>
      {children}
    </NgoContext.Provider>
  );
};