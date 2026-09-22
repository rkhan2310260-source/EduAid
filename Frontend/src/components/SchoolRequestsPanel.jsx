import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Clock, Calendar, Building2, MessageCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmationModal from './Modal/ConfirmationModal';

// Response Message Form Component
function ResponseMessageForm({ requestId, onApprove, onReject }) {
  const [responseMessage, setResponseMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [actionType, setActionType] = useState(null);

  const handleSubmit = () => {
    if (actionType === 'approve') {
      onApprove(requestId, responseMessage);
    } else if (actionType === 'reject') {
      onReject(requestId, responseMessage);
    }
    setShowForm(false);
    setResponseMessage('');
    setActionType(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setResponseMessage('');
    setActionType(null);
  };

  if (!showForm) {
    return (
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <button
          onClick={() => {
            setActionType('approve');
            setShowForm(true);
          }}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <Check className="w-4 h-4" />
          Accept
        </button>
        <button
          onClick={() => {
            setActionType('reject');
            setShowForm(true);
          }}
          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <X className="w-4 h-4" />
          Decline
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2 border-t border-gray-200">
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Response Message {actionType === 'reject' ? '(Optional)' : ''}
        </label>
        <textarea
          value={responseMessage}
          onChange={(e) => setResponseMessage(e.target.value)}
          placeholder={actionType === 'approve' 
            ? 'We are excited to join this campaign and look forward to collaborating...'
            : 'Thank you for the invitation, but we cannot participate at this time because...'
          }
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
          rows={3}
          maxLength={300}
        />
        <div className="text-xs text-gray-500 mt-1">
          {responseMessage.length}/300 characters
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className={`flex-1 px-3 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-sm ${
            actionType === 'approve' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {actionType === 'approve' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {actionType === 'approve' ? 'Accept' : 'Decline'}
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// School view - shows received invitations with approve/reject actions
export default function SchoolRequestsPanel({ schoolId, API_BASE_URL }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);

  useEffect(() => {
    if (schoolId) {
      fetchRequests();
    }
  }, [schoolId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/ngo-project-requests/school/${schoolId}`);
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

  // Handle invitation approval and show modal for redirect
  const handleApprove = async (requestId, responseMessage = '') => {
    try {
      const authData = localStorage.getItem('authData');
      const userId = authData ? JSON.parse(authData).user.userId : 1;
      
      const response = await fetch(`${API_BASE_URL}/ngo-project-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseMessage: responseMessage || 'Invitation accepted',
          respondedByUserId: userId
        })
      });
      
      if (response.ok) {
        const approvedRequest = await response.json();
        toast.success('Invitation accepted successfully!');
        
        // Store ngoProjectId for auto-selection in messages page
        sessionStorage.setItem('selectedNgoProjectId', approvedRequest.ngoProjectId);
        
        // Store approval data and show modal
        setPendingApproval({
          schoolId: schoolId,
          ngoProjectId: approvedRequest.ngoProjectId,
          ngoId: approvedRequest.ngoId
        });
        setConfirmModalOpen(true);
        
        fetchRequests();
      } else {
        toast.error('Failed to accept invitation. Please try again.');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to accept invitation. Please try again.');
    }
  };
  
  // Handle redirect to messages - conversation already created by backend
  const handleGoToMessages = () => {
    if (!pendingApproval) return;
    
    // Navigate to messages page with ngoId parameter
    navigate(`/school-messages/${schoolId}?ngoId=${pendingApproval.ngoId}`);
  };

  const handleReject = async (requestId, responseMessage = '') => {
    try {
      const authData = localStorage.getItem('authData');
      const userId = authData ? JSON.parse(authData).user.userId : 1;
      
      const response = await fetch(`${API_BASE_URL}/ngo-project-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseMessage: responseMessage || 'Invitation declined',
          respondedByUserId: userId
        })
      });
      
      if (response.ok) {
        toast.success('Invitation declined.');
        fetchRequests();
      } else {
        toast.error('Failed to decline invitation.');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to decline invitation.');
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
    <>
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setPendingApproval(null);
        }}
        onConfirm={handleGoToMessages}
        title="Go to Messages?"
        message="Do you want to go to the message section now to start a conversation with the NGO?"
        confirmText="Go to Messages"
        cancelText="Stay Here"
      />
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Campaign Invitations</h2>
        <p className="text-xs text-gray-500">Invitations from NGOs to join their campaigns</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status, index) => (
          <button
            key={`filter-${status}-${index}`}
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
          <p className="text-sm">No invitations received</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-3">
          {filteredRequests.map((request, index) => (
            <div key={`request-${request.requestId}-${index}`} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">Received: {new Date(request.requestedAt).toLocaleDateString()}</span>
                    </div>
                    {request.requestedBudget && (
                      <div className="text-xs font-medium text-gray-800">
                        Budget: Tk {request.requestedBudget.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  {request.requestMessage && (
                    <div className="bg-gray-50 rounded p-2 mt-2">
                      <div className="text-xs text-gray-500 mb-1">NGO Message:</div>
                      <div className="text-xs text-gray-700">{request.requestMessage}</div>
                    </div>
                  )}
                  
                  {request.responseMessage && (
                    <div className="bg-blue-50 rounded p-2 mt-2">
                      <div className="text-xs text-gray-500 mb-1">Your Response:</div>
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
                              // Navigate to messages with ngoId parameter
                              navigate(`/school-messages/${schoolId}?ngoId=${request.ngoId}`);
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

              {/* Actions for pending requests only */}
              {request.status === 'PENDING' && (
                <ResponseMessageForm 
                  requestId={request.requestId}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
