import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Award, TrendingUp, Users, Target, Star, Heart, Briefcase, MoreVertical } from 'lucide-react';
import NgoDashSidebar from './NgoDashSidebar';

export default function NgoGamification() {
  const { ngoId } = useParams();
  const [loading, setLoading] = useState(true);
  const [gamificationData, setGamificationData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [ngoData, setNgoData] = useState(null);

  useEffect(() => {
    if (ngoId) {
      fetchGamificationData();
    }
  }, [ngoId]);

  const fetchGamificationData = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:8081/api';
      
      // Fetch NGO gamification data by ngoId
      const gamificationRes = await fetch(`${API_BASE_URL}/ngo-gamification`).catch(() => null);
      if (gamificationRes && gamificationRes.ok) {
        const allGamificationData = await gamificationRes.json();
        const currentNgoGamification = Array.isArray(allGamificationData) 
          ? allGamificationData.find(g => g.ngoId == ngoId)
          : null;
        
        if (currentNgoGamification) {
          setGamificationData(currentNgoGamification);
        } else {
          // Create gamification record if doesn't exist
          const createRes = await fetch(`${API_BASE_URL}/ngo-gamification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ngoId: parseInt(ngoId), ngoName: `NGO ${ngoId}` })
          });
          if (createRes.ok) {
            const newGamification = await createRes.json();
            setGamificationData(newGamification);
          }
        }
        
        // Set leaderboard (top 10 sorted by points)
        const sortedData = Array.isArray(allGamificationData) 
          ? allGamificationData.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
          : [];
        setLeaderboard(sortedData.slice(0, 10));
      }
      
      // Fetch NGO basic data
      const ngoRes = await fetch(`${API_BASE_URL}/ngos/${ngoId}`).catch(() => null);
      if (ngoRes && ngoRes.ok) {
        const ngo = await ngoRes.json();
        setNgoData(ngo);
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badgeName) => {
    const badges = {
      'Champion': '🏆',
      'Expert': '⭐',
      'Achiever': '🎯',
      'Starter': '🌟',
      'High Impact': '💎',
      'Good Impact': '✨',
      'Consistent Performer': '🔥'
    };
    return badges[badgeName] || '🏅';
  };

  const getLevelInfo = (points) => {
    if (points >= 10000) return { level: 'Champion', color: 'text-purple-600', bg: 'bg-purple-100', next: null };
    if (points >= 5000) return { level: 'Expert', color: 'text-yellow-600', bg: 'bg-yellow-100', next: 1000 };
    if (points >= 2000) return { level: 'Achiever', color: 'text-blue-600', bg: 'bg-blue-100', next: 500 };
    if (points >= 1000) return { level: 'Starter', color: 'text-green-600', bg: 'bg-green-100', next: 200 };
    return { level: 'Beginner', color: 'text-gray-600', bg: 'bg-gray-100', next: 100 };
  };

  const currentLevel = getLevelInfo(gamificationData?.totalPoints || 0);
  const progressPercentage = currentLevel.next 
    ? ((gamificationData?.totalPoints || 0) / currentLevel.next) * 100 
    : 100;

  const badges = gamificationData?.badgesEarned 
    ? (typeof gamificationData.badgesEarned === 'string' 
        ? JSON.parse(gamificationData.badgesEarned.replace(/\\"/g, '"')) 
        : gamificationData.badgesEarned)
    : [];

  const currentRank = leaderboard.findIndex(ngo => ngo.ngoId == ngoId) + 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gamification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <NgoDashSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 m-6 rounded-2xl p-8 flex items-center justify-between relative overflow-hidden">
          <div className="flex-1 z-10">
            <div className="text-lg text-gray-600 mb-1">Achievement Progress</div>
            <div className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              {currentLevel.level} Level NGO
              <div className={`w-8 h-8 ${currentLevel.bg} rounded-full flex items-center justify-center`}>
                <Trophy className={`w-4 h-4 ${currentLevel.color}`} />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {gamificationData?.totalPoints || 0} points earned • Impact Score: {gamificationData?.impactScore || '0.0'}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>🏆</span>
              Global Rank: #{currentRank || 1} • {badges.length} badges earned
            </div>
          </div>
          <div className="w-96 h-48 rounded-xl overflow-hidden shadow-lg">
            <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white">
              <Trophy className="w-24 h-24 opacity-20" />
            </div>
          </div>
        </div>

        <div className="bg-white border-b">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold mb-1">Impact Overview</h1>
            </div>
            <div className="grid grid-cols-4 gap-6 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Points</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Trophy size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{gamificationData?.totalPoints || 0}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{currentLevel.level} Level</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Impact Score</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{gamificationData?.impactScore || '0.0'}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Out of 10.0</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Badges Earned</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Award size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{badges.length}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Achievements unlocked</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Global Rank</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">#{currentRank || 1}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Among all NGOs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 mb-8">
          {/* Progress and Badges Section */}
          <div className="grid grid-cols-3 gap-6">
          {/* Progress Card */}
          <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Level Progress</h2>
            
            {currentLevel.next ? (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress to {getLevelInfo(currentLevel.next).level}</span>
                  <span className="font-semibold">{currentLevel.next - (gamificationData?.totalPoints || 0)} points needed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="mb-6 text-center py-4 bg-green-50 rounded-lg">
                <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 font-semibold">Maximum Level Achieved!</p>
              </div>
            )}

            <h3 className="text-lg font-bold text-gray-800 mb-4">Your Badges</h3>
            {badges.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {badges.map((badge, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="text-3xl mb-2">{getBadgeIcon(badge)}</div>
                    <div className="text-xs font-medium text-gray-700">{badge}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No badges earned yet</p>
                <p className="text-sm">Start creating projects to earn badges!</p>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">NGO Leaderboard</h2>
            <div className="space-y-3">
              {leaderboard.map((ngo, index) => (
                <div 
                  key={ngo.ngoId} 
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    ngo.ngoId == ngoId ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {ngo.ngoName || `NGO ${ngo.ngoId}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {ngo.totalPoints || 0} points
                    </div>
                  </div>
                  {index < 3 && (
                    <div className="text-lg">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}