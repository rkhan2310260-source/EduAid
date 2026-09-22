import React from 'react';
import { X, Calendar, DollarSign, Target } from 'lucide-react';

// Campaign view modal - shows campaign details without transparency/utilization/donation sections
export default function CampaignViewModal({ isOpen, onClose, campaign }) {
  if (!isOpen || !campaign) return null;

  const getStatusColor = (status) => {
    const statusMap = {
      'planned': 'bg-green-100 text-green-700',
      'active': 'bg-green-100 text-green-700',
      'in_progress': 'bg-orange-100 text-orange-700',
      'completed': 'bg-green-600 text-white',
      'paused': 'bg-gray-100 text-gray-700',
      'cancelled': 'bg-red-100 text-red-700',
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Campaign Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Campaign Name & Status */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-2xl font-bold text-gray-800">{campaign.projectName}</h3>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                {campaign.status || 'Active'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
            <p className="text-gray-600 leading-relaxed">{campaign.projectDescription}</p>
          </div>

          {/* Budget */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h4 className="text-sm font-semibold text-gray-700">Budget</h4>
            </div>
            <p className="text-2xl font-bold text-green-600">
              Tk {(campaign.budget || 0).toLocaleString()}
            </p>
          </div>

          {/* Project Type */}
          {campaign.projectTypeId && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Project Type</h4>
              <p className="text-gray-600">Type ID: {campaign.projectTypeId}</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {campaign.createdAt && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-700">Created</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  {new Date(campaign.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {campaign.updatedAt && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-700">Last Updated</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  {new Date(campaign.updatedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
