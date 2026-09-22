import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2, Upload } from 'lucide-react';

const ProjectTransparencyCard = ({ projectId, userRole = 'school', onUpdate }) => {
  const [transparency, setTransparency] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = 'http://localhost:8081/api';

  useEffect(() => {
    fetchTransparencyData();
  }, [projectId]);

  const fetchTransparencyData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fund-transparencies/by-project/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Transparency data received:', data); // Debug log
        if (data.length > 0) {
          const transparencyData = data[0]; // Get first transparency record
          setTransparency({
            ...transparencyData,
            beforePhotos: Array.isArray(transparencyData.beforePhotos) 
              ? transparencyData.beforePhotos 
              : (transparencyData.beforePhotos ? JSON.parse(transparencyData.beforePhotos) : []),
            afterPhotos: Array.isArray(transparencyData.afterPhotos) 
              ? transparencyData.afterPhotos 
              : (transparencyData.afterPhotos ? JSON.parse(transparencyData.afterPhotos) : [])
          });
        } else {
          console.log('No transparency data found for project:', projectId);
        }
      } else {
        console.log('Failed to fetch transparency data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching transparency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageDelete = async (imageUrl, type) => {
    if (userRole !== 'school') return;
    
    try {
      await fetch(`${API_BASE_URL}/transparency-images/delete?imageUrl=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE'
      });
      
      // Update local state
      setTransparency(prev => ({
        ...prev,
        [type]: prev[type].filter(url => url !== imageUrl)
      }));
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleImageUpload = async (e, type) => {
    if (userRole !== 'school') return;
    
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('type', type);
      formData.append('transparencyId', transparency?.transparencyId || 'temp');

      const response = await fetch(`${API_BASE_URL}/transparency-images/upload/${projectId}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const uploadedUrls = await response.json();
        setTransparency(prev => ({
          ...prev,
          [type]: [...(prev[type] || []), ...uploadedUrls]
        }));
        
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  };

  const formatNumber = (value) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  // Always show card, even if no transparency data
  const hasTransparencyData = transparency && (transparency.additionalNotes || transparency.beneficiaryFeedback || 
    (transparency.beforePhotos && transparency.beforePhotos.length > 0) || 
    (transparency.afterPhotos && transparency.afterPhotos.length > 0));

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 mb-6">
      <div 
        className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">Transparency</h3>
          {transparency?.isPublic && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
              Public
            </span>
          )}
          {!hasTransparencyData && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              No data
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {!hasTransparencyData && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No transparency information available for this project.</p>
              {userRole === 'school' && (
                <p className="text-sm">Transparency information can be added during project creation or through fund utilization records.</p>
              )}
            </div>
          )}
          
          {hasTransparencyData && (
            <>
              {/* Additional Notes */}
          {transparency.additionalNotes && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Notes</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{transparency.additionalNotes}</p>
            </div>
          )}

          {/* Purchase Details */}
          {(transparency.quantityPurchased || transparency.unitCost || transparency.unitMeasurement) && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Purchase Details</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {transparency.quantityPurchased && (
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <p className="font-medium">{formatNumber(transparency.quantityPurchased)}</p>
                  </div>
                )}
                {transparency.unitCost && (
                  <div>
                    <span className="text-gray-500">Unit Cost:</span>
                    <p className="font-medium">৳{formatNumber(transparency.unitCost)}</p>
                  </div>
                )}
                {transparency.unitMeasurement && (
                  <div>
                    <span className="text-gray-500">Unit:</span>
                    <p className="font-medium">{transparency.unitMeasurement}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Before Photos */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Before Photos</h4>
              {userRole === 'school' && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'beforePhotos')}
                    className="hidden"
                  />
                  <Upload size={16} className="text-gray-500 hover:text-gray-700" />
                </label>
              )}
            </div>
            {transparency.beforePhotos?.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {transparency.beforePhotos.map((url, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    <img 
                      src={`http://localhost:8081${url}`}
                      alt={`Before ${index + 1}`}
                      className="w-32 h-24 object-cover rounded border"
                    />
                    {userRole === 'school' && (
                      <button
                        onClick={() => handleImageDelete(url, 'beforePhotos')}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No before photos available</p>
            )}
          </div>

          {/* After Photos */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">After Photos</h4>
              {userRole === 'school' && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'afterPhotos')}
                    className="hidden"
                  />
                  <Upload size={16} className="text-gray-500 hover:text-gray-700" />
                </label>
              )}
            </div>
            {transparency.afterPhotos?.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {transparency.afterPhotos.map((url, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    <img 
                      src={`http://localhost:8081${url}`}
                      alt={`After ${index + 1}`}
                      className="w-32 h-24 object-cover rounded border"
                    />
                    {userRole === 'school' && (
                      <button
                        onClick={() => handleImageDelete(url, 'afterPhotos')}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No after photos available</p>
            )}
          </div>

              {/* Beneficiary Feedback */}
              {transparency.beneficiaryFeedback && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Beneficiary Feedback</h4>
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded italic">"{transparency.beneficiaryFeedback}"</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectTransparencyCard;