import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Home, Users, Briefcase, FileText, Search, LogOut, X, Mail, Phone, MapPin, Calendar, MessageSquare, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import UserProfileModal from './Modal/UserProfileModal';



export default function DashSidebar() {
  const { schoolData, studentsData, projectsData, API_BASE_URL } = useApp();
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const location = useLocation();
  
  const [userData, setUserData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const navItems = [
    { name: 'Dashboard', icon: Home, badge: null, path: `/dashboard/${schoolId}` },
    { name: 'Students', icon: Users, badge: studentsData?.length?.toString() || '0', path: `/students/${schoolId}` },
    { name: 'Projects', icon: Briefcase, badge: projectsData?.length?.toString() || '0', path: `/projects/${schoolId}` },
    { name: 'NGO Campaigns', icon: Target, badge: null, path: `/school-campaigns/${schoolId}` },
    { name: 'Messages', icon: MessageSquare, badge: unreadMessagesCount > 0 ? unreadMessagesCount.toString() : null, badgeColor: 'text-orange-600', path: `/school-messages/${schoolId}` },
    { name: 'Reporting', icon: FileText, badge: null, badgeColor: 'text-red-600', path: `/reporting/${schoolId}` },
  ];

  // Fetch user data and unread messages count
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const authData = localStorage.getItem('authData');
        if (authData) {
          const parsed = JSON.parse(authData);
          setUserData(parsed.user);

          // Fetch user profile data using userId endpoint
          const userId = parsed.user.userId;
          try {
            const profileResponse = await fetch(`${API_BASE_URL}/user-profiles/user/${userId}`);
            if (profileResponse.ok) {
              const userProfile = await profileResponse.json();
              setProfileData(userProfile);
            } else {
              console.warn('User profile not found - using basic user data');
              setProfileData({
                fullName: parsed.user.username,
                status: 'ACTIVE'
              });
            }
          } catch (profileError) {
            console.warn('Failed to fetch user profile:', profileError);
            setProfileData({
              fullName: parsed.user.username,
              status: 'ACTIVE'
            });
          }
          
          // Fetch unread messages count
          try {
            const unreadResponse = await fetch(`${API_BASE_URL}/conversations/user/${userId}/unread-count`);
            if (unreadResponse.ok) {
              const count = await unreadResponse.json();
              setUnreadMessagesCount(count);
            }
          } catch (unreadError) {
            console.warn('Failed to fetch unread messages count:', unreadError);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(() => {
      const authData = localStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        const userId = parsed.user.userId;
        fetch(`${API_BASE_URL}/conversations/user/${userId}/unread-count`)
          .then(res => res.ok ? res.json() : 0)
          .then(count => setUnreadMessagesCount(count))
          .catch(() => {});
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  // Only refresh school data for school-related pages and when actually needed
  const { refreshData } = useApp();
  const isSchoolPage = location.pathname.includes('/dashboard/') || 
                      location.pathname.includes('/students/') || 
                      location.pathname.includes('/projects/') || 
                      location.pathname.includes('/project-details/') || 
                      location.pathname.includes('/school-campaigns/') || 
                      location.pathname.includes('/school-messages/') || 
                      location.pathname.includes('/reporting/');
  
  useEffect(() => {
    // Refresh data when schoolId changes or when we don't have data
    if (schoolId && isSchoolPage && (!studentsData || studentsData.length === 0 || !projectsData || projectsData.length === 0)) {
      refreshData(schoolId);
    }
  }, [schoolId, isSchoolPage, location.pathname]);

  // Remove automatic refresh on window focus to prevent infinite loops
  // useEffect(() => {
  //   const handleFocus = () => {
  //     if (schoolId) {
  //       refreshData(schoolId);
  //     }
  //   };

  //   window.addEventListener('focus', handleFocus);
  //   return () => window.removeEventListener('focus', handleFocus);
  // }, [schoolId]);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('authData');
    localStorage.removeItem('userId');
    localStorage.removeItem('donorId');
    
    // Navigate to login page
    navigate('/login');
  };

  const getActiveNav = () => {
    const path = location.pathname;
    // Check for student-related pages (students list and student profile)
    if (path.includes('/students/') || path.includes('/student-profile/')) return 'Students';
    // Check for project-related pages (projects list, project details, project analytics)
    if (path.includes('/projects/') || path.includes('/project-details/') || path.includes('/project-analytics/')) return 'Projects';
    if (path.includes('/school-campaigns/')) return 'NGO Campaigns';
    if (path.includes('/school-messages/')) return 'Messages';
    if (path.includes('/reporting/')) return 'Reporting';
    return 'Dashboard';
  };

  const activeNav = getActiveNav();

  return (
    <>
      <div className="w-64 bg-gradient-to-b from-green-50 to-green-100 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
    
          <div>
          <img src="/Eduaid institute logo.png" alt="EduAid Logo" className="h-7" />
          </div>
        </div>

        {/* User Profile Section */}
        <div className="flex items-center gap-3 mb-6 bg-white rounded-lg p-3">
          <div 
            className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 relative overflow-hidden"
            onClick={() => setIsProfileModalOpen(true)}
          >
            {profileData?.profileImageUrl ? (
              <img 
                src={`http://localhost:8081${profileData.profileImageUrl}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-full h-full bg-orange-200 rounded-full flex items-center justify-center ${profileData?.profileImageUrl ? 'hidden' : ''}`}>
              <span className="text-lg font-bold text-orange-600">
                {profileData?.fullName?.charAt(0)?.toUpperCase() || userData?.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <div className="text-sm font-semibold text-gray-800 truncate">
              {profileData?.fullName || userData?.username || 'Loading...'}
            </div>
            <div className="text-xs text-gray-500">
              {userData?.userType || 'User'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 hover:bg-red-50 rounded transition-colors group flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
          </button>
        </div>



        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.name;

           

            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  // Remove automatic refresh on navigation to prevent infinite loops
                  // Data will be refreshed by individual components when needed
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-700 hover:bg-green-200 hover:text-green-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.name}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-1 rounded-xl font-medium ${
                      item.badgeColor
                        ? `${item.badgeColor} bg-red-100`
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userData={userData}
        profileData={profileData}
      />
    </>
  );
}