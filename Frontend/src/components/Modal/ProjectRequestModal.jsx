import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

export default function ProjectRequestModal({ isOpen, onClose, onSubmit, requestType, projectData, schoolId, ngoProjectId }) {
  const [formData, setFormData] = useState({
    requestMessage: '',
    requestedBudget: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const requestData = {
      ngoProjectId: ngoProjectId,
      schoolId: schoolId,
      requestType: requestType, // 'JOIN_REQUEST' or 'INVITE'
      status: 'PENDING',
      requestMessage: formData.requestMessage,
      requestedBudget: formData.requestedBudget ? parseFloat(formData.requestedBudget) : null,
      requestedAt: new Date().toISOString(),
      requestedByUserId: 1 // TODO: Get from auth context
    };
    
    onSubmit(requestData);
    setFormData({ requestMessage: '', requestedBudget: '' });
  };

  const isInvite = requestType === 'INVITE';
  const title = isInvite ? 'Invite School to Project' : 'Request to Join Project';
  const description = isInvite 
    ? 'Send an invitation to this school to participate in your NGO project'
    : 'Send a request to join this NGO project';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Project Info */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Project</div>
            <div className="font-semibold text-gray-800">
              {projectData?.projectTitle || projectData?.projectName || 'Project'}
            </div>
            {projectData?.projectDescription && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                {projectData.projectDescription}
              </div>
            )}
          </div>

          {/* Request Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.requestMessage}
              onChange={(e) => setFormData({ ...formData, requestMessage: e.target.value })}
              required
              rows={4}
              placeholder={isInvite ? "Explain why this school would be a great fit..." : "Explain why you want to join this project..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Requested Budget */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Budget (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
              <input
                type="number"
                value={formData.requestedBudget}
                onChange={(e) => setFormData({ ...formData, requestedBudget: e.target.value })}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
