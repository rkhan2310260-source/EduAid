import { useState, useEffect } from "react";
import { X, Upload, Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from 'react-toastify';

const ProjectRecordExpenseModal = ({ isOpen, onClose, onSubmit, project }) => {
  const [formData, setFormData] = useState({
    donationId: "",
    amountUsed: "",
    specificPurpose: "",
    detailedDescription: "",
    vendorName: "",
    billInvoiceNumber: "",
    utilizationDate: new Date().toISOString().split('T')[0],
    receiptImage: null
  });

  // AI FIX: Add transparency data state
  const [transparencyData, setTransparencyData] = useState({
    additionalNotes: "",
    beforePhotos: [],
    afterPhotos: [],
    beneficiaryFeedback: "",
    isPublic: true,
    quantityPurchased: "",
    unitCost: "",
    unitMeasurement: ""
  });

  const [showTransparency, setShowTransparency] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const [availableDonations, setAvailableDonations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch available donations when modal opens
  useEffect(() => {
    if (isOpen && project) {
      fetchAvailableDonations();
    }
  }, [isOpen, project]);

  const fetchAvailableDonations = async () => {
    const projectId = project.projectId || project.project_id;
    if (!projectId) {
      console.log('No project ID found:', project);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching donations for project:', projectId);
      const response = await fetch(`http://localhost:8081/api/donations/project/${projectId}/available`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const donations = await response.json();
        console.log('Available donations:', donations);
        setAvailableDonations(donations);
      } else {
        console.error('Failed to fetch donations, status:', response.status);
        // Fallback: allow manual entry without donation selection
        setAvailableDonations([]);
      }
    } catch (error) {
      console.error('Failed to fetch available donations:', error);
      // Fallback: allow manual entry
      setAvailableDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // FIX: Handle transparency form changes
  const handleTransparencyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTransparencyData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // FIX: Handle before/after image selection for transparency
  const handleBeforeImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.type === "image/png" || file.type === "image/jpeg"
    );

    if (validFiles.length !== files.length) {
      toast.error("Please upload only PNG or JPEG images");
      return;
    }

    setTransparencyData(prev => ({
      ...prev,
      beforePhotos: [...prev.beforePhotos, ...validFiles]
    }));
  };

  const handleAfterImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.type === "image/png" || file.type === "image/jpeg"
    );

    if (validFiles.length !== files.length) {
      toast.error("Please upload only PNG or JPEG images");
      return;
    }

    setTransparencyData(prev => ({
      ...prev,
      afterPhotos: [...prev.afterPhotos, ...validFiles]
    }));
  };

  const removeBeforeImage = (index) => {
    setTransparencyData(prev => ({
      ...prev,
      beforePhotos: prev.beforePhotos.filter((_, i) => i !== index)
    }));
  };

  const removeAfterImage = (index) => {
    setTransparencyData(prev => ({
      ...prev,
      afterPhotos: prev.afterPhotos.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      setFormData(prev => ({ ...prev, receiptImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please upload only PNG or JPEG images");
    }
  };

  // FIX: Handle receipt image upload
  const handleReceiptImageUpload = async (file) => {
    if (!file) return null;
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('images', file);
      uploadFormData.append('projectId', project.projectId || project.project_id);
      
      const response = await fetch('http://localhost:8081/api/upload/project-images', {
        method: 'POST',
        body: uploadFormData
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.imageUrls?.[0] || null;
      } else {
        throw new Error('Failed to upload receipt image');
      }
    } catch (error) {
      console.error('Error uploading receipt image:', error);
      toast.error('Failed to upload receipt image');
      return null;
    }
  };

  // FIX: Handle before/after image uploads for transparency
  const handleTransparencyImageUpload = async (files, type) => {
    if (!files || files.length === 0) return [];
    
    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach(file => {
        uploadFormData.append('images', file);
      });
      uploadFormData.append('type', type); // "before" or "after"
      uploadFormData.append('projectId', project.projectId || project.project_id);
      
      const response = await fetch('http://localhost:8081/api/upload/transparency-images', {
        method: 'POST',
        body: uploadFormData
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.imageUrls || [];
      } else {
        throw new Error('Failed to upload images');
      }
    } catch (error) {
      console.error(`Error uploading ${type} images:`, error);
      toast.error(`Failed to upload ${type} images`);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate amount against selected donation's remaining amount
    const selectedDonation = availableDonations.find(d => d.donationId === parseInt(formData.donationId || 0));
    if (selectedDonation && parseFloat(formData.amountUsed) > selectedDonation.remainingAmount) {
      toast.error(`Amount exceeds available funds! Maximum: ৳${selectedDonation.remainingAmount.toLocaleString()}`);
      return;
    }

    try {
      // FIX: Upload receipt image if provided
      let receiptImageUrl = null;
      if (formData.receiptImage) {
        receiptImageUrl = await handleReceiptImageUpload(formData.receiptImage);
      }
      
      // FIX: Upload transparency images if provided
      let beforePhotosUrls = [];
      let afterPhotosUrls = [];
      
      if (transparencyData.beforePhotos.length > 0) {
        beforePhotosUrls = await handleTransparencyImageUpload(transparencyData.beforePhotos, 'before');
      }
      
      if (transparencyData.afterPhotos.length > 0) {
        afterPhotosUrls = await handleTransparencyImageUpload(transparencyData.afterPhotos, 'after');
      }

      // FIX: Handle donation selection - use selected donation or random one from project, or null
      let selectedDonationId = null;
      if (formData.donationId && formData.donationId !== "" && formData.donationId !== "0") {
        selectedDonationId = parseInt(formData.donationId);
      } else if (availableDonations.length > 0) {
        // Use random donation from available donations for this project
        const randomDonation = availableDonations[Math.floor(Math.random() * availableDonations.length)];
        selectedDonationId = randomDonation.donationId;
      }
      
      const submitData = {
        projectId: project.projectId || project.project_id,
        donationId: selectedDonationId,
        amountUsed: parseFloat(formData.amountUsed),
        specificPurpose: formData.specificPurpose.trim(),
        detailedDescription: formData.detailedDescription ? formData.detailedDescription.trim() : null,
        vendorName: formData.vendorName ? formData.vendorName.trim() : null,
        billInvoiceNumber: formData.billInvoiceNumber ? formData.billInvoiceNumber.trim() : null,
        receiptImageUrl: receiptImageUrl,
        utilizationDate: formData.utilizationDate,
        utilizationStatus: "APPROVED"
      };
      
      console.log('Submitting expense data:', submitData);

      // Add transparency data with uploaded image URLs
      const hasTransparencyData = Object.values(transparencyData).some(value => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'boolean') return value !== true;
        return value && value.toString().trim() !== '';
      }) || beforePhotosUrls.length > 0 || afterPhotosUrls.length > 0;

      if (hasTransparencyData) {
        submitData.transparency = {
          additionalNotes: transparencyData.additionalNotes || null,
          beforePhotos: beforePhotosUrls,
          afterPhotos: afterPhotosUrls,
          beneficiaryFeedback: transparencyData.beneficiaryFeedback || null,
          isPublic: transparencyData.isPublic,
          // FIX: Ensure proper number formatting for BigDecimal fields
          quantityPurchased: transparencyData.quantityPurchased && transparencyData.quantityPurchased.toString().trim() !== '' ? parseFloat(transparencyData.quantityPurchased) : null,
          unitCost: transparencyData.unitCost && transparencyData.unitCost.toString().trim() !== '' ? parseFloat(transparencyData.unitCost) : null,
          unitMeasurement: transparencyData.unitMeasurement && transparencyData.unitMeasurement.trim() !== '' ? transparencyData.unitMeasurement : null
        };
      }

      // FIX: Only call parent onSubmit to prevent duplicate insertion
      if (onSubmit) {
        await onSubmit(submitData);
        resetForm();
        onClose();
      } else {
        toast.error('No submission handler provided');
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error('Failed to record expense. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      donationId: "",
      amountUsed: "",
      specificPurpose: "",
      detailedDescription: "",
      vendorName: "",
      billInvoiceNumber: "",
      utilizationDate: new Date().toISOString().split('T')[0],
      receiptImage: null
    });
    setTransparencyData({
      additionalNotes: "",
      beforePhotos: [],
      afterPhotos: [],
      beneficiaryFeedback: "",
      isPublic: true,
      quantityPurchased: "",
      unitCost: "",
      unitMeasurement: ""
    });
    setImagePreview(null);
    setShowTransparency(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Record Fund Utilization</h2>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Donation (Optional)
                </label>
                {loading ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500">
                    Loading donations...
                  </div>
                ) : (
                  <select
                    name="donationId"
                    value={formData.donationId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    <option value="">No specific donation (General fund)</option>
                    {availableDonations.map((donation, index) => {
                      const donatedDate = new Date(donation.donatedAt).toLocaleDateString('en-GB');
                      return (
                        // FIX: Using composite key with index to prevent duplicate key warnings
                        <option key={`${donation.donationId}-${index}`} value={donation.donationId}>
                          [{donation.source}] {donation.donorName} | {donatedDate} | ৳{donation.remainingAmount.toLocaleString()} available
                        </option>
                      );
                    })}
                  </select>
                )}
                {availableDonations.length === 0 && !loading && (
                  <p className="text-xs text-gray-500 mt-1">
                    No specific donations available. Expense will be recorded as general fund utilization.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Used (৳) *
                </label>
                <input
                  type="number"
                  name="amountUsed"
                  value={formData.amountUsed}
                  onChange={handleInputChange}
                  required
                  min="0.01"
                  step="0.01"
                  max={availableDonations.find(d => d.donationId === parseInt(formData.donationId))?.remainingAmount || undefined}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
                {formData.donationId && formData.donationId !== "" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Max: ৳{availableDonations.find(d => d.donationId === parseInt(formData.donationId))?.remainingAmount.toLocaleString() || '0'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specific Purpose *
              </label>
              <input
                type="text"
                name="specificPurpose"
                value={formData.specificPurpose}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="e.g., School supplies, Infrastructure repair"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detailed Description
              </label>
              <textarea
                name="detailedDescription"
                value={formData.detailedDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Provide detailed description of the expense"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Vendor/Supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bill/Invoice Number (Optional)
                </label>
                <input
                  type="text"
                  name="billInvoiceNumber"
                  value={formData.billInvoiceNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Invoice/Bill number (optional)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Utilization Date *
              </label>
              <input
                type="date"
                name="utilizationDate"
                value={formData.utilizationDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt/Bill Image
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg h-32 flex items-center justify-center bg-gray-100">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Receipt preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">No receipt image</span>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    id="receiptUpload"
                    accept="image/png, image/jpeg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="receiptUpload"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-green-500 transition-colors h-32"
                  >
                    <Receipt className="text-gray-400 mb-2" size={24} />
                    <p className="text-sm text-green-600 font-medium">Upload Receipt</p>
                    <p className="text-xs text-gray-500">PNG or JPEG</p>
                  </label>
                </div>
              </div>
            </div>

            {/* AI FIX: Optional Transparency Section */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowTransparency(!showTransparency)}
                className="flex items-center justify-between w-full text-left text-md font-medium text-gray-700 mb-3 hover:text-green-600 transition-colors"
              >
                <span>Add Transparency Information (Optional)</span>
                {showTransparency ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showTransparency && (
                <div className="space-y-4 border-l-4 border-green-200 pl-4">
                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      name="additionalNotes"
                      value={transparencyData.additionalNotes}
                      onChange={handleTransparencyChange}
                      rows="2"
                      placeholder="Details about fund usage, vendor information, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none text-sm"
                    />
                  </div>

                  {/* Beneficiary Feedback */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beneficiary Feedback
                    </label>
                    <textarea
                      name="beneficiaryFeedback"
                      value={transparencyData.beneficiaryFeedback}
                      onChange={handleTransparencyChange}
                      rows="2"
                      placeholder="Feedback from students, teachers, or community members"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none text-sm"
                    />
                  </div>

                  {/* Purchase Details */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantityPurchased"
                        value={transparencyData.quantityPurchased}
                        onChange={handleTransparencyChange}
                        step="0.01"
                        placeholder="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Cost (৳)
                      </label>
                      <input
                        type="number"
                        name="unitCost"
                        value={transparencyData.unitCost}
                        onChange={handleTransparencyChange}
                        step="0.01"
                        placeholder="30.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        name="unitMeasurement"
                        value={transparencyData.unitMeasurement}
                        onChange={handleTransparencyChange}
                        placeholder="bags of cement"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Before & After Images Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before Images */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Before Images
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                        <input
                          type="file"
                          id="beforeImages"
                          accept="image/png, image/jpeg"
                          multiple
                          onChange={handleBeforeImagesUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="beforeImages"
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          <Upload className="text-gray-400 mb-1" size={20} />
                          <p className="text-xs text-green-600 font-medium">Upload Before Images</p>
                          <p className="text-xs text-gray-500">PNG or JPEG</p>
                        </label>
                      </div>
                      {transparencyData.beforePhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-1 mt-2">
                          {transparencyData.beforePhotos.map((file, index) => (
                            // FIX: Using composite key to ensure uniqueness for before images
                            <div key={`before-${file.name}-${index}`} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Before ${index + 1}`}
                                className="w-full h-16 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removeBeforeImage(index)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* After Images */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        After Images
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                        <input
                          type="file"
                          id="afterImages"
                          accept="image/png, image/jpeg"
                          multiple
                          onChange={handleAfterImagesUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="afterImages"
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          <Upload className="text-gray-400 mb-1" size={20} />
                          <p className="text-xs text-green-600 font-medium">Upload After Images</p>
                          <p className="text-xs text-gray-500">PNG or JPEG</p>
                        </label>
                      </div>
                      {transparencyData.afterPhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-1 mt-2">
                          {transparencyData.afterPhotos.map((file, index) => (
                            // FIX: Using composite key to ensure uniqueness for after images
                            <div key={`after-${file.name}-${index}`} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`After ${index + 1}`}
                                className="w-full h-16 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removeAfterImage(index)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Public Visibility */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={transparencyData.isPublic}
                      onChange={handleTransparencyChange}
                      className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Make transparency information public
                    </label>
                  </div>
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
              disabled={!formData.amountUsed || !formData.specificPurpose}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {showTransparency && (Object.values(transparencyData).some(v => Array.isArray(v) ? v.length > 0 : v && v.toString().trim() !== '') || transparencyData.beforePhotos.length > 0 || transparencyData.afterPhotos.length > 0) ? 'Record Expense with Transparency' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectRecordExpenseModal;