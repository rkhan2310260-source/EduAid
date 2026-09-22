import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Home, Users, Briefcase, FileText, LogOut, Heart, Trophy, MessageSquare } from 'lucide-react';
import UserProfileModal from './Modal/UserProfileModal';
import { useNgo } from '../context/NgoContext';

export default function NgoDashSidebar() {
  const navigate = useNavigate();
  const { ngoId } = useParams();
  const location = useLocation();
  const { refreshData, projectsData, donationsData } = useNgo();
  
  const [userData, setUserData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [projectsCount, setProjectsCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const navItems = [
    { name: 'Home', icon: Home, badge: null, path: `/ngo-dashboard/${ngoId}` },
    { name: 'Projects', icon: Briefcase, badge: projectsCount.toString(), path: `/ngo-projects/${ngoId}` },
    { name: 'Students', icon: Users, badge: studentsCount.toString(), path: `/ngo-students/${ngoId}` },
    { name: 'My Campaigns', icon: Briefcase, badge: (projectsData || []).length.toString(), path: `/ngo-Campaigns/${ngoId}` },
    { name: 'Donations', icon: Heart, badge: null, path: `/ngo-donations/${ngoId}` },
    { name: 'Messages', icon: MessageSquare, badge: unreadMessagesCount > 0 ? unreadMessagesCount.toString() : null, badgeColor: 'text-orange-600', path: `/ngo-messages/${ngoId}` },
    { name: 'Reporting', icon: FileText, badge: null, path: `/ngo-reporting/${ngoId}` },
    { name: 'Gamification', icon: Trophy, badge: null, path: `/ngo-gamification/${ngoId}` },
  ];

  // Update counts when context data changes
  useEffect(() => {
    // Projects count = unique school projects that NGO has donated to
    const uniqueSchoolProjects = new Set();
    (donationsData || []).forEach(donation => {
      if (donation.projectId) {
        uniqueSchoolProjects.add(donation.projectId);
      }
    });
    setProjectsCount(uniqueSchoolProjects.size);
    
    // Update students count from donations data (unique students sponsored)
    const uniqueStudents = new Set();
    (donationsData || []).forEach(donation => {
      if (donation.studentId) {
        uniqueStudents.add(donation.studentId);
      }
    });
    setStudentsCount(uniqueStudents.size);
  }, [projectsData, donationsData]);

  // Remove automatic data refresh to prevent infinite loops
  // Data will be refreshed by individual components when needed
  // useEffect(() => {
  //   if (ngoId) {
  //     refreshData(ngoId);
  //   }
  // }, [ngoId]);

  // Remove window focus refresh to prevent infinite loops
  // useEffect(() => {
  //   const handleFocus = () => {
  //     if (ngoId) {
  //       refreshData(ngoId);
  //     }
  //   };

  //   window.addEventListener('focus', handleFocus);
  //   return () => window.removeEventListener('focus', handleFocus);
  // }, [ngoId]);

  // Fetch user data and unread messages count
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const authData = localStorage.getItem('authData');
        if (!authData) {
          console.warn('No auth data found in NgoDashSidebar');
          return;
        }

        const parsed = JSON.parse(authData);
        const userId = parsed?.user?.userId;
        
        if (!userId) {
          console.warn('No userId found in auth data');
          return;
        }

        setUserData(parsed.user);

        // Fetch user profile data using userId endpoint
        try {
          const profileResponse = await fetch(`http://localhost:8081/api/user-profiles/user/${userId}`);
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
          const unreadResponse = await fetch(`http://localhost:8081/api/conversations/user/${userId}/unread-count`);
          if (unreadResponse.ok) {
            const count = await unreadResponse.json();
            setUnreadMessagesCount(count);
          }
        } catch (unreadError) {
          console.warn('Failed to fetch unread messages count:', unreadError);
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
        try {
          const parsed = JSON.parse(authData);
          const userId = parsed?.user?.userId;
          if (userId) {
            fetch(`http://localhost:8081/api/conversations/user/${userId}/unread-count`)
              .then(res => res.ok ? res.json() : 0)
              .then(count => setUnreadMessagesCount(count))
              .catch(() => {});
          }
        } catch (error) {
          console.error('Error in unread count refresh:', error);
        }
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authData');
    localStorage.removeItem('userId');
    localStorage.removeItem('ngoId');
    navigate('/login');
  };

  const getActiveNav = () => {
    const path = location.pathname;
    // Check for project-related pages (projects list, project view, project analytics)
    if (path.includes('/ngo-projects/') || path.includes('/ngo-project-view/') || path.includes('/ngo-project-analytics/')) return 'Projects';
    // Check for student-related pages (students list and student profile)
    if (path.includes('/ngo-students/') || path.includes('/student-profile/')) return 'Students';
    if (path.includes('/ngo-Campaigns/')) return 'My Campaigns';
    if (path.includes('/ngo-donations/')) return 'Donations';
    if (path.includes('/ngo-messages/')) return 'Messages';
    if (path.includes('/ngo-reporting/')) return 'Reporting';
    if (path.includes('/ngo-gamification/')) return 'Gamification';
    return 'Home';
  };

  const activeNav = getActiveNav();

  return (
    <>
      <div className="w-64 bg-gradient-to-b from-green-50 to-green-100 p-6 flex flex-col">
        <div className="flex justify-center items-center gap-2 mb-4">
          <div>
            <img src="/logo.svg" alt="EduAid Logo" className="h-8" />
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
            <div className={`w-full h-full bg-green-200 rounded-full flex items-center justify-center ${profileData?.profileImageUrl ? 'hidden' : ''}`}>
              <span className="text-lg font-bold text-green-600">
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
              NGO
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.name}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-1 rounded-xl font-medium ${
                      item.badgeColor
                        ? `${item.badgeColor} bg-orange-100`
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