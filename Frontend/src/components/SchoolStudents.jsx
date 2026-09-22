import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Plus, AlertTriangle, Users as UsersIcon, Layers, Camera } from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from './DashSidebar';
import { useSchool } from '../context/SchoolContext';
import StudentEnrollmentModal from './Modal/StudentEnrollmentModal';


export default function SchoolStudents() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { schoolData, studentsData, loading, refreshData, getSchoolStats, API_BASE_URL } = useSchool();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 12;
  


  useEffect(() => {
    if (schoolId) {
      refreshData(schoolId);
    }
  }, [schoolId]);

  // Use students data directly from context (already filtered for this school)
  const processedStudents = studentsData;

  // Calculate required statistics
  const totalStudents = processedStudents.length;
  const scholarshipReceivedCount = processedStudents.filter(s => s.hasScholarship === true).length;
  const highRiskNoScholarshipCount = processedStudents.filter(s => 
    s.riskStatus === 'HIGH' && s.hasScholarship === false
  ).length;

  const handleEnrollStudent = async (formData) => {
    try {
      // Create student with JSON data first
      const jsonData = {
        schoolId: parseInt(schoolId),
        studentName: formData.get('student_name'),
        studentIdNumber: formData.get('student_id_number'),
        gender: formData.get('gender').toUpperCase(),
        dateOfBirth: formData.get('date_of_birth'),
        classLevel: mapClassLevel(formData.get('class_level')),
        fatherName: formData.get('father_name') || null,
        fatherAlive: formData.get('father_alive') === 'true',
        fatherOccupation: formData.get('father_occupation') || null,
        motherName: formData.get('mother_name') || null,
        motherAlive: formData.get('mother_alive') === 'true',
        motherOccupation: formData.get('mother_occupation') || null,
        guardianPhone: formData.get('guardian_phone'),
        address: formData.get('address') || null,
        familyMonthlyIncome: formData.get('family_monthly_income') ? parseFloat(formData.get('family_monthly_income')) : null,
        hasScholarship: false
      };
      
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)
      });
      
      if (response.ok) {
        const studentData = await response.json();
        console.log('Student created successfully:', studentData);
        
        // Upload image separately if provided
        const profileImage = formData.get('profile_image');
        if (profileImage && profileImage.size > 0) {
          const imageFormData = new FormData();
          imageFormData.append('image', profileImage);
          
          const imageResponse = await fetch(`${API_BASE_URL}/students/${studentData.studentId}/image`, {
            method: 'POST',
            body: imageFormData,
          });
          
          if (!imageResponse.ok) {
            console.error('Image upload failed:', await imageResponse.text());
          }
        }

        setIsModalOpen(false);
        refreshData(schoolId);
      } else {
        const errorData = await response.text();
        console.error('Student creation failed:', errorData);
        toast.error('Failed to create student: ' + errorData);
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
    }
  };

  const mapClassLevel = (classLevel) => {
    const mapping = {
      '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE',
      '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINE', '10': 'TEN'
    };
    return mapping[classLevel] || 'ONE';
  };
  const formatCurrency = (amount) => {
    return `$${Math.round(Math.abs(amount)).toLocaleString()}`;
  };

  const formatClassLevel = (classLevel) => {
    return classLevel ? classLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
  };

  const getStatusBadge = (student) => {
    if (student.riskStatus === 'HIGH') {
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'High Risk' };
    }
    if (!student.hasScholarship) {
      return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'No Scholarship' };
    }
    return { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' };
  };

  // Filter students
  const filteredStudents = processedStudents.filter(student => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'active' && student.hasScholarship) ||
      (statusFilter === 'unpaid' && !student.hasScholarship);
    const matchesGender = genderFilter === 'All' || student.gender?.toLowerCase() === genderFilter.toLowerCase();
    const matchesRisk = riskFilter === 'All' || 
      (riskFilter === 'High Risk' && student.riskStatus === 'HIGH') ||
      (riskFilter === 'Low Risk' && student.riskStatus !== 'HIGH');
    
    return matchesSearch && matchesStatus && matchesGender && matchesRisk;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const handleStudentClick = (studentId) => {
    navigate(`/student-profile/${schoolId}/${studentId}`);
  };

  const handleImageUpdate = (studentId, imagePath) => {
    // Refresh data to get updated image
    refreshData(schoolId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto">

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Student Overview</h1>
            <p className="text-sm text-gray-500">View your key stats at a glance</p>
          </div>

        <div className="bg-white border-b">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold mb-1">Impact Overview</h1>
            </div>
            <div className="grid grid-cols-4 gap-6 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <UsersIcon size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{totalStudents}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Enrolled students</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Scholarship Received</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Layers size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{scholarshipReceivedCount}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Students with support</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">High Risk (No Scholarship)</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{highRiskNoScholarshipCount}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Need immediate support</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Retention Rate</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm font-bold">%</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{totalStudents > 0 ? Math.round(((totalStudents - highRiskNoScholarshipCount) / totalStudents) * 100) : 0}%</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Students staying in school</p>
              </div>
            </div>
          </div>
        </div>

          <div className="p-6">
            {/* Find Students Section */}
          <div className="bg-green-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Find Students</h2>
              <button
                onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value="All">• All</option>
                <option value="active">Active</option>
                <option value="unpaid">Unpaid</option>
              </select>

              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value="All">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value="All">All</option>
                <option value="High Risk">High Risk</option>
                <option value="Low Risk">Low Risk</option>
              </select>
            </div>
          </div>

          {/* Students Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {currentStudents.length > 0 ? currentStudents.map((student) => {
              const badge = getStatusBadge(student);
              return (
                <div
                  key={student.studentId}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleStudentClick(student.studentId)}
                >
               <div className="relative h-40 bg-gray-100 flex items-center justify-center group">
  {student.profileImage ? (
    <img 
      src={`http://localhost:8081${student.profileImage}`}
      alt={student.studentName}
      className="w-full h-full object-cover"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
  ) : null}
  <div 
    className={`w-full h-full flex items-center justify-center text-gray-400 ${student.profileImage ? 'hidden' : 'flex'}`}
    style={{ display: student.profileImage ? 'none' : 'flex' }}
  >
    <div className="text-center">
      <Camera className="w-8 h-8 mx-auto mb-2" />
      <span className="text-sm">No Image</span>
    </div>
  </div>
  <span className={`absolute top-3 right-3 ${badge.bg} ${badge.text} px-2 py-1 rounded-full text-xs font-medium`}>
    • {badge.label}
  </span>

</div>
                  <div className="p-4">
                    <div className="text-xs text-green-600 mb-1">{student.hasScholarship ? 'Has Scholarship' : 'No Scholarship'}</div>
                    <div className="text-sm font-semibold text-gray-800 mb-2">
                      {student.studentName}, {formatClassLevel(student.classLevel)}
                    </div>
                    <div className="text-xs text-gray-500 mb-4">
                      Income: {formatCurrency(student.familyMonthlyIncome || 0)}
                    </div>
                    <button
                      className="w-full py-2 text-sm text-green-600 bg-white rounded-lg hover:bg-green-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student-profile/${schoolId}/${student.studentId}`);
                      }}
                    >
                     View Details
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-4 text-center py-12 text-gray-500">
                <div className="flex flex-col items-center gap-3">
                  <span className="text-4xl">👨‍🎓</span>
                  <span className="text-lg font-medium">No students found</span>
                  <span className="text-sm">Try adjusting your filters</span>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <div className="flex gap-2">
                {[...Array(Math.min(10, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm ${
                        currentPage === pageNum
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 10 && <span className="px-2 py-1">...</span>}
                {totalPages > 10 && (
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-8 h-8 rounded-lg text-sm ${
                      currentPage === totalPages
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {totalPages}
                  </button>
                )}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
      <StudentEnrollmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleEnrollStudent}
      />
    </div>
  );
}