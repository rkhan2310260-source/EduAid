import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Info } from 'lucide-react';

const FundTransparencyModal = ({ isOpen, onClose, utilizationId, API_BASE_URL }) => {
  const [transparency, setTransparency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  
  useEffect(() => {
    if (isOpen && utilizationId) {
      fetchTransparencyData();
    }
  }, [isOpen, utilizationId]);

  const fetchTransparencyData = async () => {
    if (!utilizationId) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/fund-transparencies/fund-transparency/${utilizationId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Transparency data received:', data);
        console.log('Before photos RAW:', data.beforePhotos);
        console.log('After photos RAW:', data.afterPhotos);
        console.log('Before photos TYPE:', typeof data.beforePhotos);
        console.log('After photos TYPE:', typeof data.afterPhotos);
        setTransparency(data);
      } else if (response.status === 404) {
        setTransparency(null);
      } else {
        throw new Error('Failed to fetch transparency data');
      }
    } catch (err) {
      console.error('Error fetching transparency data:', err);
      setError(err.message);
      setTransparency(null);
    } finally {
      setLoading(false);
    }
  };

  const parsePhotos = (photos) => {
    console.log('Parsing photos:', photos, 'Type:', typeof photos);
    if (!photos) return [];
    if (Array.isArray(photos)) {
      console.log('Photos is array:', photos);
      return photos;
    }
    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        console.log('Parsed photos from string:', parsed);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse photos JSON:', e);
        return [];
      }
    }
    return [];
  };

  const handleClose = () => {
    setSelectedImage(null);
    setTransparency(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Fund Transparency Details</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading transparency data...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">
                <Info size={48} className="mx-auto mb-4" />
                <p className="text-lg font-semibold">Error Loading Data</p>
                <p className="text-sm text-gray-600 mt-2">{error}</p>
              </div>
            </div>
          ) : !transparency ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <ImageIcon size={48} className="mx-auto mb-4" />
                <p className="text-lg font-semibold">No transparency data available</p>
                <p className="text-sm text-gray-600 mt-2">
                  Transparency information has not been recorded for this fund utilization.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Additional Notes */}
              {transparency.additionalNotes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Additional Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{transparency.additionalNotes}</p>
                  </div>
                </div>
              )}

              {/* Purchase Details */}
              {(transparency.quantityPurchased || transparency.unitCost || transparency.unitMeasurement) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Purchase Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {transparency.quantityPurchased && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <span className="text-sm text-gray-600">Quantity Purchased</span>
                        <p className="text-xl font-bold text-blue-600">
                          {parseFloat(transparency.quantityPurchased).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {transparency.unitCost && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <span className="text-sm text-gray-600">Unit Cost</span>
                        <p className="text-xl font-bold text-green-600">
                          ৳{parseFloat(transparency.unitCost).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {transparency.unitMeasurement && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <span className="text-sm text-gray-600">Unit Measurement</span>
                        <p className="text-xl font-bold text-purple-600">{transparency.unitMeasurement}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Photos Section */}
              {(parsePhotos(transparency.beforePhotos).length > 0 || parsePhotos(transparency.afterPhotos).length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Progress Photos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before Photos */}
                    {parsePhotos(transparency.beforePhotos).length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-2">Before Photos</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {parsePhotos(transparency.beforePhotos).map((url, index) => {
                            // AI FIX: Use API_BASE_URL and ensure path starts with /
                            const cleanUrl = url.startsWith('/') ? url : `/${url}`;
                            const fullUrl = `${API_BASE_URL.replace('/api', '')}${cleanUrl}`;
                            console.log('Before photo URL:', fullUrl);
                            return (
                              <img
                                key={`before-${index}`}
                                src={fullUrl}
                                alt={`Before ${index + 1}`}
                                className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedImage(fullUrl)}
                                onError={(e) => {
                                  console.error('Image load error:', e.target.src);
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* After Photos */}
                    {parsePhotos(transparency.afterPhotos).length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-2">After Photos</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {parsePhotos(transparency.afterPhotos).map((url, index) => {
                            // AI FIX: Use API_BASE_URL and ensure path starts with /
                            const cleanUrl = url.startsWith('/') ? url : `/${url}`;
                            const fullUrl = `${API_BASE_URL.replace('/api', '')}${cleanUrl}`;
                            console.log('After photo URL:', fullUrl);
                            return (
                              <img
                                key={`after-${index}`}
                                src={fullUrl}
                                alt={`After ${index + 1}`}
                                className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedImage(fullUrl)}
                                onError={(e) => {
                                  console.error('Image load error:', e.target.src);
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Beneficiary Feedback */}
              {transparency.beneficiaryFeedback && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Beneficiary Feedback</h3>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                    <p className="text-gray-700 italic">"{transparency.beneficiaryFeedback}"</p>
                  </div>
                </div>
              )}

              {/* Public Status */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">Visibility Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  transparency.isPublic 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {transparency.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-white rounded-full p-2 text-gray-600 hover:text-gray-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundTransparencyModal;