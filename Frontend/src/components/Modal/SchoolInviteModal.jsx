import React, { useState, useEffect } from 'react';
import { X, Search, Building2, MapPin, Users } from 'lucide-react';

// School invite modal - allows NGO to select and invite schools to campaigns
export default function SchoolInviteModal({ isOpen, onClose, onInvite, campaign }) {
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [excludedSchoolIds, setExcludedSchoolIds] = useState([]);
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    if (isOpen && campaign) {
      fetchSchools();
      fetchExcludedSchools();
    }
  }, [isOpen, campaign]);

  useEffect(() => {
    let availableSchools = schools.filter(school => 
      !excludedSchoolIds.includes(school.schoolId)
    );
    
    if (searchTerm) {
      availableSchools = availableSchools.filter(school => 
        school.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.upazila?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredSchools(availableSchools);
  }, [searchTerm, schools, excludedSchoolIds]);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8081/api/schools');
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExcludedSchools = async () => {
    if (!campaign?.ngoProjectId) return;
    
    try {
      const response = await fetch(`http://localhost:8081/api/ngo-project-requests/excluded-schools/${campaign.ngoProjectId}`);
      if (response.ok) {
        const excludedIds = await response.json();
        setExcludedSchoolIds(excludedIds);
      }
    } catch (error) {
      console.error('Error fetching excluded schools:', error);
    }
  };

  const handleInvite = () => {
    if (selectedSchool && campaign) {
      const authData = localStorage.getItem('authData');
      const userId = authData ? JSON.parse(authData).user.userId : null;
      
      onInvite({
        ngoProjectId: campaign.ngoProjectId,
        schoolId: selectedSchool.schoolId,
        requestType: 'INVITE',
        status: 'PENDING',
        requestMessage: requestMessage || `We invite you to join our campaign: ${campaign.projectName}`,
        requestedBudget: campaign.budget,
        requestedByUserId: userId,
        requestedAt: new Date().toISOString()
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Invite School to Campaign</h2>
            <p className="text-sm text-gray-500 mt-1">{campaign?.projectName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Request Message */}
        <div className="px-6 py-4 border-b">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invitation Message
          </label>
          <textarea
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            placeholder={`We invite you to join our campaign: ${campaign?.projectName || 'this campaign'}. Please consider participating in this important initiative.`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={3}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {requestMessage.length}/500 characters
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search schools by name, district, or upazila..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Schools List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading schools...</p>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                {schools.length === 0 ? 'No schools found' : 'No available schools for invitation'}
              </p>
              {excludedSchoolIds.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {excludedSchoolIds.length} school(s) already have active invitations
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSchools.map((school) => (
                <div
                  key={school.schoolId}
                  onClick={() => setSelectedSchool(school)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedSchool?.schoolId === school.schoolId
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{school.schoolName}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        {school.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{school.address}</span>
                          </div>
                        )}
                      </div>
                      {school.schoolType && (
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {school.schoolType}
                        </span>
                      )}
                    </div>
                    {selectedSchool?.schoolId === school.schoolId && (
                      <div className="ml-4">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedSchool ? (
              <span>Selected: <span className="font-semibold">{selectedSchool.schoolName}</span></span>
            ) : (
              <span>Please select a school to invite</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={!selectedSchool}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Invitation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
