import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DonorContext = createContext();

export const useDonor = () => {
  const context = useContext(DonorContext);
  if (!context) {
    throw new Error('useDonor must be used within DonorProvider');
  }
  return context;
};

export const DonorProvider = ({ children }) => {

  const [donorData, setDonorData] = useState(null);
  const [donationsData, setDonationsData] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [schoolsData, setSchoolsData] = useState([]);
  const [sponsoredStudentsData, setSponsoredStudentsData] = useState([]);
  const [highRiskStudentsData, setHighRiskStudentsData] = useState([]);
  const [gamificationData, setGamificationData] = useState(null);
  const [donorStats, setDonorStats] = useState(null);
  const [uniqueSchoolsCount, setUniqueSchoolsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const loadingRef = React.useRef(false); // Track loading state to prevent multiple calls

  const API_BASE_URL = 'http://localhost:8081/api';

  const fetchDonorData = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/donors/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDonorData(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching donor data:', error);
    }
    return null;
  };

  const fetchDonationsData = async (donorId = null) => {
    try {
      const endpoint = donorId ? `${API_BASE_URL}/donations/donor/${donorId}` : `${API_BASE_URL}/donations`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setDonationsData(Array.isArray(data) ? data : []);
        return data;
      }
    } catch (error) {
      console.error('Error fetching donations data:', error);
    }
    return [];
  };

  const fetchProjectsData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/school-projects`);
     
      if (response.ok) {
        const data = await response.json();
        
        const projects = Array.isArray(data) ? data : [];
        setProjectsData(projects);
     
        return data;
      } else {
        console.error('Projects API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching projects data:', error);
    }
    return [];
  };

  const fetchFilteredProjects = async (search, type, funding) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type && type !== 'all') params.append('type', type);
      if (funding && funding !== 'all') params.append('funding', funding);
      
      const url = `${API_BASE_URL}/school-projects/filter${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
     
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } else {
        console.error('Filtered projects API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching filtered projects:', error);
    }
    return [];
  };

  const fetchProjectTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/school-projects/type-names`);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } else {
        console.error('Project types API error:', response.status, response.statusText);
        // Return fallback types if API fails
        return ['Infrastructure', 'Education', 'Technology', 'Health & Safety', 'Sports & Recreation', 'Arts & Culture', 'Environment'];
      }
    } catch (error) {
      console.error('Error fetching project types:', error);
      // Return fallback types if API fails
      return ['Infrastructure', 'Education', 'Technology', 'Health & Safety', 'Sports & Recreation', 'Arts & Culture', 'Environment'];
    }
  };

  const fetchSchoolsData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/schools`);
      if (response.ok) {
        const data = await response.json();
        setSchoolsData(Array.isArray(data) ? data : []);
        return data;
      }
    } catch (error) {
      console.error('Error fetching schools data:', error);
    }
    return [];
  };

  const fetchSponsoredStudentsData = async (donorId) => {
    if (!donorId) {
      return [];
    }
    
    try {
      const url = `${API_BASE_URL}/students/sponsored/donor/${donorId}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const students = Array.isArray(data) ? data : [];
        setSponsoredStudentsData(students);
        return data;
      } else {
        console.error('Error fetching sponsored students:', response.status);
      }
    } catch (error) {
      console.error('Error fetching sponsored students:', error);
    }
    return [];
  };

  const fetchHighRiskStudentsData = async () => {
    try {
      const url = `${API_BASE_URL}/students/high-risk-for-sponsorship`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const students = Array.isArray(data) ? data : [];
        setHighRiskStudentsData(students);
        return data;
      } else {
        console.error('Error fetching high-risk students:', response.status);
      }
    } catch (error) {
      console.error('Error fetching high-risk students:', error);
    }
    return [];
  };
const fetchGamificationData = async (donorId) => {
    if (!donorId) {
      return null;
    }
    
    try {
      const url = `${API_BASE_URL}/donor-gamifications/donor/${donorId}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setGamificationData(data);
        return data;
      } else {
        console.error('Error fetching gamification data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    }
    return null;
  };

  const fetchUniqueSchoolsCount = async (donorId) => {
    if (!donorId) {
      return 0;
    }
    
    try {
      const url = `${API_BASE_URL}/donor-gamifications/donor/${donorId}/unique-schools`;
      const response = await fetch(url);
      
      if (response.ok) {
        const count = await response.json();
        setUniqueSchoolsCount(count);
        return count;
      } else {
        console.error('Error fetching unique schools count:', response.status);
      }
    } catch (error) {
      console.error('Error fetching unique schools count:', error);
    }
    return 0;
  };

  const fetchDonorStats = async (donorId) => {
    if (!donorId) {
      return null;
    }
    
    try {
      const url = `${API_BASE_URL}/donor-gamifications/donor/${donorId}/stats`;
      const response = await fetch(url);
      
      if (response.ok) {
        const stats = await response.json();
        setDonorStats(stats); // Set the stats in state
        return stats;
      } else {
        console.error('Error fetching donor stats:', response.status);
      }
    } catch (error) {
      console.error('Error fetching donor statistics:', error);
    }
    return null;
  };

  const createDonation = async (donationData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData),
      });
      if (response.ok) {
        const data = await response.json();
        // Refresh all related data after donation using the helper function
        await refreshDonorData(); // This will refresh all data including gamification
        return data;
      }
    } catch (error) {
      console.error('Error creating donation:', error);
    }
    return null;
  };

  // Helper function to get userId from localStorage with expiration check
  const getUserIdFromStorage = () => {
    try {
      const storedUserId = localStorage.getItem('userId');
      if (!storedUserId) {
        console.log('No userId found in localStorage');
        return null;
      }
      
      const userIdData = JSON.parse(storedUserId);
      
      // Check if data has expired
      if (userIdData.expiresAt && new Date().getTime() > userIdData.expiresAt) {
        console.log('UserId data has expired, clearing localStorage');
        localStorage.removeItem('userId');
        localStorage.removeItem('authData');
        localStorage.removeItem('donorId');
        return null;
      }
      
      return userIdData.userId;
    } catch (error) {
      console.error('Error parsing userId from localStorage:', error);
      // If parsing fails, try to use the value directly (fallback for old format)
      const directUserId = localStorage.getItem('userId');
      return directUserId && !directUserId.startsWith('{') ? directUserId : null;
    }
  };

  const refreshDonorData = useCallback(async (userIdParam) => {
    // Get userId from parameter or localStorage
    const userId = userIdParam || getUserIdFromStorage();
    
    if (!userId) {
      console.log('No donor ID found for user:', userIdParam || 'from localStorage');
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log('DonorContext: Already loading, skipping refresh for user:', userId);
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    try {
      const donor = await fetchDonorData(userId);
      const donorId = donor?.donorId || donor?.id;
      
      if (donorId) {
        // Fetch all data in parallel for better performance
        await Promise.all([
          fetchDonationsData(donorId),
          fetchProjectsData(),
          fetchSchoolsData(),
          fetchSponsoredStudentsData(donorId),
          fetchHighRiskStudentsData(),
          fetchGamificationData(donorId),
          fetchUniqueSchoolsCount(donorId),
          fetchDonorStats(donorId)
        ]);
      } else {
        console.log('No donor ID found for user:', userId);
      }
    } catch (error) {
      console.error('Error refreshing donor data:', error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []); // Remove loading dependency to prevent infinite loops

  // Initialize data on provider mount
  const initializeDonorData = async () => {
    console.log('Initializing donor data...');
    await Promise.all([
      fetchProjectsData(),
      fetchSchoolsData(),
      fetchDonationsData(),
      fetchGamificationData()
    ]);
  };

  // Quick refresh function for components to use
  const quickRefresh = useCallback(() => {
    refreshDonorData(); // Use the updated function that handles userId internally
  }, [refreshDonorData]);

  const value = {
    donorData,
    donationsData,
    projectsData,
    schoolsData,
    sponsoredStudentsData,
    highRiskStudentsData,
    gamificationData,
    donorStats,
    uniqueSchoolsCount,
    loading,
    fetchDonorData,
    fetchDonationsData,
    fetchProjectsData,
    fetchFilteredProjects,
    fetchProjectTypes,
    fetchSchoolsData,
    fetchSponsoredStudentsData,
    fetchGamificationData,
    createDonation,
    refreshDonorData,
    quickRefresh, // Easy refresh function
    initializeDonorData,
    API_BASE_URL,
    // Helper functions for filtered data
    getDonorProjects: () => projectsData,
    getDonorDonations: () => donationsData,
    getDonorStats: () => {
      const totalDonated = donationsData.reduce((sum, d) => sum + (d.amount || 0), 0);
      const uniqueSchools = gamificationData?.schoolsSupported || 0;
      const activeProjects = projectsData.filter(p => p.status === 'ACTIVE').length;
      return { totalDonated, uniqueSchools, activeProjects };
    },
    getUserIdFromStorage // Export the helper function for other components to use
  };

  return (
    <DonorContext.Provider value={value}>
      {children}
    </DonorContext.Provider>
  );
};