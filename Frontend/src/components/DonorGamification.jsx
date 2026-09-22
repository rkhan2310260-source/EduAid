import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Award, TrendingUp, Users, Target, Star, Heart, Coins, MoreVertical, TrendingUp as ChartUp } from 'lucide-react';
import DonorDashSidebar from './DonorDashSidebar';
import { useDonor } from '@/context/DonorContext';

export default function DonorGamification() {
  const { id: donorId } = useParams();
  const { 
    donorData, 
    gamificationData, 
    donorStats, 
    loading, 
    refreshDonorData 
  } = useDonor();

  useEffect(() => {
    if (donorId && !loading && (!gamificationData || !donorStats)) {
      refreshDonorData(donorId);
    }
  }, [donorId]); // Only refresh if data is not already loaded

  const getBadgeIcon = (badgeName) => {
    const badges = {
      'First Donation': '🎉',
      'Regular Supporter': '⭐',
      'Dedicated Donor': '🏆',
      'Major Contributor': '💎',
      'Project Champion': '🚀',
      'Student Guardian': '👨‍🎓',
      'Top Supporter': '✨',
      'New Donor': '🌟'
    };
    return badges[badgeName] || '🏅';
  };

  const getLevelInfo = (points) => {
    if (points >= 50000) return { level: 'Diamond', color: 'text-purple-600', bg: 'bg-purple-100', next: null };
    if (points >= 25000) return { level: 'Platinum', color: 'text-gray-600', bg: 'bg-gray-100', next: 50000 };
    if (points >= 10000) return { level: 'Gold', color: 'text-yellow-600', bg: 'bg-yellow-100', next: 25000 };
    if (points >= 2500) return { level: 'Silver', color: 'text-gray-500', bg: 'bg-gray-200', next: 10000 };
    if (points >= 500) return { level: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-100', next: 2500 };
    return { level: 'Beginner', color: 'text-green-600', bg: 'bg-green-100', next: 500 };
  };

  const currentLevel = getLevelInfo(donorStats?.totalPoints || 0);
  const progressPercentage = currentLevel.next 
    ? ((donorStats?.totalPoints || 0) / currentLevel.next) * 100 
    : 100;

  const badges = gamificationData?.badgesEarned || ['New Donor'];

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
      <DonorDashSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 m-6 rounded-2xl p-8 flex items-center justify-between relative overflow-hidden">
          <div className="flex-1 z-10">
            <div className="text-lg text-gray-600 mb-1">Achievement Progress</div>
            <div className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              {currentLevel.level} Level Donor
              <div className={`w-8 h-8 ${currentLevel.bg} rounded-full flex items-center justify-center`}>
                <Award className={`w-4 h-4 ${currentLevel.color}`} />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {donorStats?.totalPoints || 0} points earned • Impact Score: {gamificationData?.impactScore || '0.0'}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>🏆</span>
              Rank: #{gamificationData?.rankingPosition || 1} • {badges.length} badges earned
            </div>
          </div>
          <div className="w-96 h-48 rounded-xl overflow-hidden shadow-lg">
            <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white">
              <Trophy className="w-24 h-24 opacity-20" />
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="px-6 mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Impact Overview</h2>
            <p className="text-sm text-gray-500">Track your donations and achievements</p>
          </div>
          
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-600" />
                </div>
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-sm text-gray-500 mb-1">Total Points</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">{donorStats?.totalPoints || 0}</div>
              <div className="text-xs text-green-600">{currentLevel.level} Level</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Coins className="w-5 h-5 text-green-600" />
                </div>
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-sm text-gray-500 mb-1">Total Donated</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">৳{Number(donorStats?.totalDonated || 0).toLocaleString()}</div>
              <div className="text-xs text-green-600">Lifetime donations</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-sm text-gray-500 mb-1">Badges Earned</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">{badges.length}</div>
              <div className="text-xs text-green-600">Achievements unlocked</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-sm text-gray-500 mb-1">Regional Rank</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">#{gamificationData?.rankingPosition || 1}</div>
              <div className="text-xs text-green-600">Among all donors</div>
            </div>
          </div>
        </div>

        {/* Progress and Badges Section */}
        <div className="px-6 pb-8 grid grid-cols-3 gap-6">
          {/* Progress Card */}
          <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Level Progress</h2>
            
            {currentLevel.next ? (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress to {getLevelInfo(currentLevel.next).level}</span>
                  <span className="font-semibold">{currentLevel.next - (donorStats?.totalPoints || 0)} points needed</span>
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
                <p className="text-sm">Start donating to earn badges!</p>
              </div>
            )}
          </div>

          {/* Impact Stats */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Impact Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Schools Supported</div>
                  <div className="text-xl font-bold text-gray-800">{donorStats?.totalSchoolsSupported || 0}</div>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Students Sponsored</div>
                  <div className="text-xl font-bold text-gray-800">{donorStats?.totalStudentsSponsored || 0}</div>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Projects Supported</div>
                  <div className="text-xl font-bold text-gray-800">{donorStats?.totalProjectsDonated || 0}</div>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}