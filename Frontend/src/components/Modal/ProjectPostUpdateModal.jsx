import { useState, useEffect } from "react";
import { X, Upload, Image } from "lucide-react";
import { toast } from 'react-toastify';

const ProjectUpdateModal = ({ isOpen, onClose, onSubmit, project }) => {
  const [formData, setFormData] = useState({
    updateTitle: "",
    updateDescription: "",
    progressPercentage: "",
    amountUtilized: "",
    images: []
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState("");
  const [lastProgressPercentage, setLastProgressPercentage] = useState(0); // Track last progress

  // AI FIX: Fetch last progress percentage when modal opens
  useEffect(() => {
    const fetchLastProgress = async () => {
      if (!isOpen || !project?.projectId) return;
      
      try {
        const response = await fetch(`http://localhost:8081/api/project-updates/project/${project.projectId}`);
        if (response.ok) {
          const updates = await response.json();
          if (updates.length > 0) {
            // Get the highest progress percentage from all updates
            const maxProgress = Math.max(...updates.map(u => u.progressPercentage || 0));
            setLastProgressPercentage(maxProgress);
          }
        }
      } catch (err) {
        console.error('Error fetching last progress:', err);
      }
    };
    
    fetchLastProgress();
  }, [isOpen, project]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // AI FIX: Validate progress percentage
    if (name === 'progressPercentage' && value) {
      const newProgress = parseFloat(value);
      if (newProgress <= lastProgressPercentage) {
        setError(`Progress must be greater than ${lastProgressPercentage}%`);
      } else if (newProgress > 100) {
        setError('Progress cannot exceed 100%');
      } else {
        setError('');
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.type === "image/png" || file.type === "image/jpeg"
    );

    if (validFiles.length !== files.length) {
      toast.error("Please upload only PNG or JPEG images");
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      let imageUrls = [];
      
      // Upload images if any
      if (formData.images.length > 0) {
        const uploadFormData = new FormData();
        formData.images.forEach((image, index) => {
          uploadFormData.append('images', image);
        });
        uploadFormData.append('projectId', project.projectId || project.project_id);
        
        const uploadResponse = await fetch('http://localhost:8081/api/upload/project-images', {
          method: 'POST',
          body: uploadFormData
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          imageUrls = uploadResult.imageUrls || [];
        } else {
          throw new Error('Failed to upload images');
        }
      }

      const submitData = {
        projectId: project.projectId || project.project_id,
        updateTitle: formData.updateTitle,
        updateDescription: formData.updateDescription,
        progressPercentage: formData.progressPercentage ? parseFloat(formData.progressPercentage) : null,
        amountUtilized: formData.amountUtilized ? parseFloat(formData.amountUtilized) : null,
        imagesUrls: imageUrls
      };

      // FIX: Only call parent onSubmit to prevent duplicate insertion
      if (onSubmit) {
        await onSubmit(submitData);
        resetForm();
        onClose();
        toast.success('Update posted successfully!');
      } else {
        toast.error('No submission handler provided');
      }
    } catch (err) {
      console.error('Error submitting update:', err);
      setError(err.message);
      toast.error(`Failed to post update: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      updateTitle: "",
      updateDescription: "",
      progressPercentage: "",
      amountUtilized: "",
      images: []
    });
    setImagePreviews([]);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Post Project Update</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Project: {project?.projectTitle || project?.project_name}
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Title *
              </label>
              <input
                type="text"
                name="updateTitle"
                value={formData.updateTitle}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Enter update title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Description *
              </label>
              <textarea
                name="updateDescription"
                value={formData.updateDescription}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Describe the progress and activities"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress Percentage {lastProgressPercentage > 0 && <span className="text-gray-500 text-xs">(Last: {lastProgressPercentage}%)</span>}
                </label>
                <input
                  type="number"
                  name="progressPercentage"
                  value={formData.progressPercentage}
                  onChange={handleInputChange}
                  min={lastProgressPercentage}
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder={`${lastProgressPercentage}-100`}
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Utilized (৳)
                </label>
                <input
                  type="number"
                  name="amountUtilized"
                  value={formData.amountUtilized}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress Images
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/png, image/jpeg"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="imageUpload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-green-600 font-medium">Click to upload images</p>
                  <p className="text-xs text-gray-500">PNG or JPEG (multiple files allowed)</p>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.updateTitle || !formData.updateDescription || error || (formData.progressPercentage && parseFloat(formData.progressPercentage) <= lastProgressPercentage)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Post Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectUpdateModal;