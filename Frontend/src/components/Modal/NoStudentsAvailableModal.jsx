import React from 'react';
import { X, Heart, CheckCircle } from 'lucide-react';

const NoStudentsAvailableModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Great News!
          </h2>
          
          <p className="text-gray-600 mb-6">
            All students currently have scholarships! Thanks to generous donors like you, 
            no students need sponsorship at this moment.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <Heart className="w-4 h-4" />
              <span className="font-semibold">Your Impact Matters</span>
            </div>
            <p className="text-sm text-green-600">
              Check back later or consider supporting school projects to continue making a difference.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoStudentsAvailableModal;