import React, { useState, useEffect } from 'react';
import { Check, X, Clock, MessageSquare, Calendar, User } from 'lucide-react';

export default function ProjectRequestsPanel({ schoolId, ngoProjectId, API_BASE_URL }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED

  useEffect(() => {
    fetchRequests();
  }, [schoolId, ngoProjectId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const endpoint = schoolId 
        ? `${API_BASE_URL}/ngo-project-requests/school/${schoolId}`
        : `${API_BASE_URL}/ngo-project-requests/ngo-project/${ngoProjectId}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ngo-project-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseMessage: 'Request approved',
          respondedByUserId: 1 // TODO: Get from auth
        })
      });
      
      if (response.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      const response = await fetch(`${API_BASE_URL}/ngo-project-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseMessage: reason || 'Request rejected',
          respondedByUserId: 1 // TODO: Get from auth
        })
      });
      
      if (response.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
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
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const filteredRequests = requests.filter(req => 
    filter === 'ALL' || req.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Project Requests</h2>
          <p className="text-sm text-gray-500">Manage incoming and outgoing requests</p>
        </div>
        
        {/* Filter */}
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === status
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No requests found</p>
          <p className="text-sm">Requests will appear here when received</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request.requestId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      request.requestType === 'INVITE' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {request.requestType}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Requested: {new Date(request.requestedAt).toLocaleDateString()}</span>
                    </div>
                    {request.requestedBudget && (
                      <div className="font-medium text-gray-800">
                        Budget: ৳{request.requestedBudget.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  {request.requestMessage && (
                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <div className="text-xs text-gray-500 mb-1">Message:</div>
                      <div className="text-sm text-gray-700">{request.requestMessage}</div>
                    </div>
                  )}
                  
                  {request.responseMessage && (
                    <div className="bg-blue-50 rounded p-3">
                      <div className="text-xs text-blue-600 mb-1">Response:</div>
                      <div className="text-sm text-gray-700">{request.responseMessage}</div>
                      {request.respondedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Responded: {new Date(request.respondedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions for pending requests */}
              {request.status === 'PENDING' && (
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(request.requestId)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.requestId)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
