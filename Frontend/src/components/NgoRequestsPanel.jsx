import React, { useState, useEffect } from 'react';
import { Clock, Check, X, Calendar, Building2, MessageCircle } from 'lucide-react';

// NGO view - shows sent invitations with their status (read-only, no approve/reject)
export default function NgoRequestsPanel({ ngoProjectId, API_BASE_URL }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [schools, setSchools] = useState({});

  useEffect(() => {
    fetchRequests();
  }, [ngoProjectId]);

  const fetchRequests = async () => {
    if (!ngoProjectId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/ngo-project-requests/ngo-project/${ngoProjectId}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
        
        // Fetch school names for all requests
        const schoolIds = [...new Set(data.map(r => r.schoolId))];
        const schoolsData = {};
        await Promise.all(
          schoolIds.map(async (schoolId) => {
            try {
              const schoolRes = await fetch(`${API_BASE_URL}/schools/${schoolId}`);
              if (schoolRes.ok) {
                const school = await schoolRes.json();
                schoolsData[schoolId] = school.schoolName;
              }
            } catch (err) {
              console.error('Error fetching school:', err);
            }
          })
        );
        setSchools(schoolsData);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: Check },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: X }
    };
    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;
    return (
      <span className={`${badge.bg} ${badge.text} px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  // Sort requests by date (latest first) and filter
  const filteredRequests = requests
    .filter(req => filter === 'ALL' || req.status === filter)
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              filter === status
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">
            {requests.length === 0 ? 'No invitations sent yet' : `No ${filter.toLowerCase()} invitations`}
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-3">
          {filteredRequests.map((request) => (
            <div key={request.requestId} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {schools[request.schoolId] || `School #${request.schoolId}`}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">Sent: {new Date(request.requestedAt).toLocaleDateString()}</span>
                    </div>
                    {request.requestedBudget && (
                      <div className="text-xs font-medium text-gray-800">
                        Budget: Tk {request.requestedBudget.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  {request.requestMessage && (
                    <div className="bg-gray-50 rounded p-2 mt-2">
                      <div className="text-xs text-gray-700">{request.requestMessage}</div>
                    </div>
                  )}
                  
                  {request.responseMessage && (
                    <div className="bg-blue-50 rounded p-2 mt-2">
                      <div className="text-xs text-gray-500 mb-1">School Response:</div>
                      <div className="text-xs text-gray-700">{request.responseMessage}</div>
                      {request.respondedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(request.respondedAt).toLocaleDateString()}
                        </div>
                      )}
                      {request.status === 'APPROVED' && (
                        <div className="mt-2">
                          <button 
                            onClick={() => {
                              const authData = localStorage.getItem('authData');
                              const ngoId = authData ? JSON.parse(authData).user.ngoId : null;
                              window.location.href = `/ngo-messages/${ngoId}`;
                            }}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                          >
                            Go to Messages
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
