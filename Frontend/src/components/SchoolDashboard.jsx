import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Users, Briefcase, Plus, Download, Camera, Eye } from 'lucide-react';
import Sidebar from './DashSidebar';
import { useSchool } from '../context/SchoolContext';
import StudentEnrollmentModal from './Modal/StudentEnrollmentModal';
import ProjectCreateModal from './Modal/ProjectCreateModal';
import SchoolProjectCard from './SchoolProjectCard';
import SchoolDonationTable from './SchoolDonationTable';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SchoolDashboard() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { schoolData, studentsData, projectsData, donationsData, loading, refreshData, getSchoolStats, API_BASE_URL } = useSchool();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ProjectModalOpen, setProjectModalOpen] = useState(false);
  const [recentDonations, setRecentDonations] = useState([]);
  useEffect(() => {
    if (schoolId) {
      refreshData(schoolId);
      fetchRecentDonations();
    }
  }, [schoolId]);

  // Fetch recent donations for this school using backend filtering
  const fetchRecentDonations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/donations/school/${schoolId}/recent`);
      if (response.ok) {
        const donations = await response.json();
        const processedDonations = donations.map(donation => ({
          donationId: donation.donationId,
          id: donation.donationId,
          donorName: donation.donorName || 'Anonymous Donor',
          amount: donation.amount || 0,
          donatedAt: donation.donatedAt,
          date: donation.donatedAt,
          paymentStatus: donation.paymentStatus || 'PENDING',
          status: donation.paymentStatus || 'PENDING',
          transactionRef: donation.transactionRef,
          donationType: donation.donationType || 'project_donation',
          projectTitle: donation.projectTitle,
          studentName: donation.studentName,
          recipient: donation.recipientName || 'Unknown'
        }));
        setRecentDonations(processedDonations);
      }
    } catch (error) {
      console.error('Error fetching recent donations:', error);
    }
  };

  // Use students data directly from context (already filtered for this school)
  const processedStudents = studentsData.slice(0, 3);

  // Use projects data directly from context (already filtered for this school)
  const processedProjects = projectsData;

  // Get high risk students from context data
  const highRiskStudents = studentsData
    .filter(student => student.riskStatus === 'HIGH' || 
      (student.dropoutPredictions && student.dropoutPredictions.some(p => p.riskStatus === 'HIGH')))
    .slice(0, 4);

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
        fatherOccupation: formData.get('father_occupation'),
        motherName: formData.get('mother_name') || null,
        motherAlive: formData.get('mother_alive') === 'true',
        motherOccupation: formData.get('mother_occupation'),
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

  // Get school statistics
  const schoolStats = getSchoolStats();

  const formatCurrency = (amount) => {
    return `Tk ${Math.round(Math.abs(amount)).toLocaleString()}`;
  };

  const formatClassLevel = (classLevel) => {
    return classLevel ? classLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
  };
  
  const mapClassLevel = (classLevel) => {
    const classMap = {
      '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE',
      '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINE', '10': 'TEN',
      '11': 'ELEVEN', '12': 'TWELVE'
    };
    return classMap[classLevel] || classLevel;
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'active': 'bg-green-100 text-green-700',
      'in_progress': 'bg-blue-100 text-blue-700',
      'funded': 'bg-green-600 text-white',
      'completed': 'bg-green-100 text-green-700',
      'pending': 'bg-orange-100 text-orange-700',
      'draft': 'bg-gray-100 text-gray-700',
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const getDonorLogo = (name) => {
    const firstChar = name?.charAt(0).toUpperCase() || '?';
    if (name?.toLowerCase().includes('spotify')) return '🎵';
    if (name?.toLowerCase().includes('coffee')) return '☕';
    return firstChar;
  };

  const handleStudentClick = (studentId) => {
    navigate(`/student-profile/${schoolId}/${studentId}`, { state: { from: 'dashboard' } });
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project-details/${projectId}`);
  };

  const handleProjectCreation = async (projectData) => {
    try {
      // AI FIX: Handle both regular project data and optional transparency data
      const jsonData = {
        schoolId: parseInt(schoolId),
        projectTitle: projectData.projectTitle,
        projectDescription: projectData.projectDescription,
        projectTypeId: projectData.projectTypeId,
        requiredAmount: projectData.requiredAmount
      };
      
      const response = await fetch(`${API_BASE_URL}/school-projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)
      });
      
      if (response.ok) {
        const createdProject = await response.json();
        
        // AI FIX: If transparency data exists, create transparency record
        if (projectData.transparency) {
          try {
            const transparencyResponse = await fetch(`${API_BASE_URL}/school-projects/${createdProject.projectId}/fund-transparency`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(projectData.transparency)
            });
            
            if (!transparencyResponse.ok) {
              console.error('Transparency creation failed:', await transparencyResponse.text());
              toast.error('Project created but transparency data failed to save');
            } else {
              toast.success('Project created with transparency information!');
            }
          } catch (transparencyError) {
            console.error('Error creating transparency:', transparencyError);
            toast.error('Project created but transparency data failed to save');
          }
        } else {
          toast.success('Project created successfully!');
        }
        
        setProjectModalOpen(false);
        refreshData(schoolId);
      } else {
        const errorData = await response.text();
        console.error('Project creation failed:', errorData);
        toast.error('Failed to create project: ' + errorData);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error creating project: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ToastContainer position="bottom-right" autoClose={2000} />
            <StudentEnrollmentModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={handleEnrollStudent}
            />

                 <ProjectCreateModal
              isOpen={ProjectModalOpen}
              onClose={() => setProjectModalOpen(false)}
              onSubmit={handleProjectCreation}
            />
      <Sidebar schoolData={schoolData} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 m-6 rounded-2xl p-8 flex items-center justify-between relative overflow-hidden">
          <div className="flex-1 z-10">
            <div className="text-lg text-gray-600 mb-1">Welcome back,</div>
            <div className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              {schoolData?.schoolName || schoolData?.school_name || `School ${schoolId}`}
              {schoolData && <span className="text-blue-500">✓</span>}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {schoolData ? 'Your dedication is transforming education and reducing dropouts in your community' : 'Welcome to your school dashboard'}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span>📍</span>
              {schoolData?.address || 'Address not available'}
            </div>
          </div>
          <div className="w-96 h-48 rounded-xl overflow-hidden shadow-lg relative group">
            {schoolData?.schoolImage ? (
              <img 
                src={`http://localhost:8081${schoolData.schoolImage}?t=${Date.now()}`} 
                alt="School" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-full h-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center ${schoolData?.schoolImage ? 'hidden' : ''}`}>
              <div className="text-white text-6xl opacity-20">🏫</div>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file && schoolId) {

                      
                      const formData = new FormData();
                      formData.append('image', file);
                      
                      try {
                        const response = await fetch(`${API_BASE_URL}/schools/${schoolId}/image`, {
                          method: 'POST',
                          body: formData,
                        });
                        

                        
                        if (response.ok) {
                          const data = await response.json();
                          toast.success("School image updated successfully!");
                          await refreshData(schoolId);
                          // Force image refresh
                          const imgElement = e.target.closest('.group').querySelector('img');
                          if (imgElement && data.imagePath) {
                            imgElement.src = `http://localhost:8081${data.imagePath}?t=${Date.now()}`;
                          }
                        } else {
                          const errorText = await response.text();
                          toast.error(`Upload failed: ${errorText}`);
                        }
                      } catch (error) {
                        console.error('Error uploading school image:', error);
                        toast.error(`Error uploading image: ${error.message}`);
                      }
                    }
                  }}
                  className="hidden"
                />
                <div className="bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 transition-all">
                  <Camera className="w-6 h-6 text-gray-700" />
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white border-b rounded-xl m-6">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold mb-1">Impact Overview</h1>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Funds Received</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600">💰</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatCurrency(schoolStats.totalFundsReceived)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{schoolStats.activeProjects} active projects</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{schoolStats.totalStudents}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{schoolStats.highRiskStudents} High Risk Students</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Active Projects</span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Briefcase size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{schoolStats.totalProjects}</span>
                </div>
          
              </div>

             
            </div>
          </div>
        </div>

        <div className="px-6 mb-8 mt-4">
          {/* Active Students */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-green-600">👨‍🎓</span>
              <h2 className="text-xl font-bold text-gray-800">Active Students</h2>
            </div>
            <button 
              onClick={() => navigate(`/students/${schoolId}`)}
              className="secondary !border-0 hover:!bg-gray-50 hover:!text-[#0E792E] text-sm font-medium flex items-center gap-1"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div 
           onClick={() => setIsModalOpen(true)}
            className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center min-h-[280px] hover:border-green-400 transition-colors cursor-pointer">
              <Plus className="w-12 h-12 text-gray-400 mb-4" />
              <div className="text-sm font-semibold text-gray-800 mb-1">Add New Student</div>
              <div className="text-xs text-gray-500 text-center">Add student details to ensure accurate records and streamline every learner</div>
            </div>

            {processedStudents.length > 0 ? processedStudents.map((student) => (
              <div key={student.studentId} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStudentClick(student.studentId)}>
                <div className="relative h-40 bg-gray-100">
                  {student.profileImage ? (
                    <img 
                      src={`http://localhost:8081${student.profileImage}?t=${Date.now()}`} 
                      alt="Student" 
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
                  <span className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium text-orange-600">
                    {student.riskStatus || 'At Risk'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="text-xs text-green-600 mb-1">Scholarship from @anisha3228</div>
                  <div className="text-sm font-semibold text-gray-800 mb-2">
                    {student.studentName}, {formatClassLevel(student.classLevel)}
                  </div>
                  <div className="text-xs text-gray-500 mb-4">
                    Fund Received: {formatCurrency(0)} / {formatCurrency(0)}
                  </div>
                  <button className="secondary !border-0 hover:!bg-gray-50 hover:!text-[#0E792E] w-full py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1" onClick={(e) => { e.stopPropagation(); handleStudentClick(student.studentId); }}>
                    <Eye className="w-4 h-4" /> View Details
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-3 text-center py-12 text-gray-500">
                <div className="flex flex-col items-center gap-3">
                  <span className="text-4xl">👨‍🎓</span>
                  <span className="text-lg font-medium">No students registered yet</span>
                  <span className="text-sm">Add students to start tracking their progress</span>
                </div>
              </div>
            )}
          </div>

          {/* Active Projects */}
          <div className="mb-8 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">📚</span>
              <h2 className="text-xl font-bold text-gray-800">Active Projects</h2>
            </div>
            <button 
              onClick={() => navigate(`/projects/${schoolId}`)}
              className="secondary !border-0 hover:!bg-gray-50 hover:!text-[#0E792E] text-sm font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div
            onClick={() => setProjectModalOpen(true)}
            className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center min-h-[280px] hover:border-green-400 transition-colors cursor-pointer">
              <Plus className="w-12 h-12 text-gray-400 mb-4" />
              <div className="text-sm font-semibold text-gray-800 mb-1">Create New Project</div>
              <div className="text-xs text-gray-500 text-center">Add request details to ensure accurate records and support for every learner</div>
            </div>

            {processedProjects.length > 0 ? processedProjects.slice(0, 3).map((project) => (
              <SchoolProjectCard
                key={project.projectId}
                project={project}
                onViewDetails={handleProjectClick}
                showAllButtons={false}
                showDescription={true}
                showProjectInfo={false}
              />
            )) : (
              <div className="col-span-3 text-center py-12 text-gray-500">
                <div className="flex flex-col items-center gap-3">
                  <span className="text-4xl">📚</span>
                  <span className="text-lg font-medium">No projects created yet</span>
                  <span className="text-sm">Create projects to start receiving donations</span>
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Bottom Section */}
          <div className="pb-8 grid grid-cols-3 gap-6">
          {/* Recent Donations */}
          <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Recent Donations</h2>
              <button 
                onClick={() => navigate(`/reporting/${schoolId}?tab=donations`)}
                className="secondary !border-0 hover:!bg-gray-50 hover:!text-[#0E792E] px-3 py-1.5 text-sm rounded-lg"
              >
                View report
              </button>
            </div>

            {recentDonations.length > 0 ? (
              <SchoolDonationTable 
                donations={recentDonations} 
                maxRows={5}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span className="text-sm">No donations yet</span>
                </div>
              </div>
            )}
          </div>

          {/* High Risk Students */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">High Risk Students</h2>
              <button 
                onClick={() => navigate(`/students/${schoolId}?filter=high-risk`)}
                className="secondary !border-0 hover:!bg-gray-50 hover:!text-[#0E792E] text-sm font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {highRiskStudents.length > 0 ? highRiskStudents.map((student) => (
                <div key={student.studentId} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-800">
                      {student.studentName}
                    </div>
                    <button 
                      onClick={() => handleStudentClick(student.studentId)}
                      className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View Details
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span className="text-sm">No high-risk students</span>
                    <span className="text-xs">All students are performing well</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}