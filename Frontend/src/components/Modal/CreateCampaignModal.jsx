import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Modal for creating NGO campaigns (ngo_projects)
// Fixed: Removed projectTypeId field as it's not needed per Backend.md requirements
export default function CreateCampaignModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    projectName: '',
    projectDescription: '',
    budget: '',
    startDate: '',
    endDate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      projectName: '',
      projectDescription: '',
      budget: '',
      startDate: '',
      endDate: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Create New Campaign</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter campaign name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.projectDescription}
              onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe your campaign goals and objectives"
            />
          </div>



          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget (৳) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter budget amount"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
