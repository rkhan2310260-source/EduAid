import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Search, MapPin, GraduationCap, Calendar, X, FileText, User, Home as HomeIcon, Phone, Award } from "lucide-react";
import { useNgo } from "../context/NgoContext";
import NgoDashSidebar from './NgoDashSidebar';

export default function NgoStudentsView() {
  const { ngoId } = useParams();
  const { ngoData, donationsData, loading, refreshData } = useNgo();
  const [studentsData, setStudentsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [marksheets, setMarksheets] = useState([]);
  const [schoolsData, setSchoolsData] = useState([]);

  useEffect(() => {
    if (ngoId) {
      refreshData(ngoId);
      fetchSponsoredStudents();
      fetchSchools();
    }
  }, [ngoId]);

  const fetchSponsoredStudents = async () => {
    try {
      // Get NGO student donations to find sponsored students
      const studentDonationsResponse = await fetch(`http://localhost:8081/api/ngo-student-donations/ngo/${ngoId}`);
      if (studentDonationsResponse.ok) {
        const donations = await studentDonationsResponse.json();
        
        // Get unique student IDs from completed donations
        const sponsoredStudentIds = [...new Set(donations
          .filter(d => d.paymentStatus === 'COMPLETED')
          .map(d => d.studentId))];
        
        // Fetch student details for each sponsored student
        const studentsPromises = sponsoredStudentIds.map(async (studentId) => {
          try {
            const response = await fetch(`http://localhost:8081/api/students/${studentId}`);
            if (response.ok) {
              return await response.json();
            }
          } catch (error) {
            console.error(`Error fetching student ${studentId}:`, error);
          }
          return null;
        });
        
        const students = await Promise.all(studentsPromises);
        const validStudents = students.filter(student => student !== null);
        
        console.log('Sponsored students:', validStudents);
        setStudentsData(validStudents);
      }
    } catch (error) {
      console.error('Error fetching sponsored students:', error);
      setStudentsData([]);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/schools');
      if (response.ok) {
        const schools = await response.json();
        setSchoolsData(Array.isArray(schools) ? schools : []);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  // Fetch marksheets for selected student
  const fetchMarksheets = async (studentId, schoolId) => {
    try {
      const response = await fetch(`http://localhost:8081/api/school-documents`);
      if (response.ok) {
        const data = await response.json();
        const studentMarksheets = data.filter(doc => 
          doc.schoolId == schoolId &&
          doc.documentType === 'PERFORMANCE' && 
          doc.documentDescription?.includes(`Student ID: ${studentId}`)
        );
        setMarksheets(studentMarksheets);
      }
    } catch (error) {
      console.error('Error fetching marksheets:', error);
      setMarksheets([]);
    }
  };

  const getSchoolName = (schoolId) => {
    const school = schoolsData?.find(s => s.schoolId === schoolId);
    return school?.schoolName || 'Unknown School';
  };

  const filterStudents = () => {
    return studentsData.filter(
      (student) =>
        (student.studentName || student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.schoolId || '').toString().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <NgoDashSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  const handleViewProgress = (student) => {
    setSelectedStudent(student);
    // Fetch marksheets when student is selected
    fetchMarksheets(student.studentId || student.id, student.schoolId);
  };

  const closeStudentView = () => {
    setSelectedStudent(null);
    setMarksheets([]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <NgoDashSidebar />
      <div className="flex-1 overflow-auto bg-white">
      <div className="border-b">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-1">Sponsored Students</h1>
          <p className="text-gray-600 text-sm">
            Students you have sponsored through donations
          </p>

          <div className="relative mt-6 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search students or schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-6">
          {/* Students List - Left Side */}
          <div className={`${selectedStudent ? "w-1/3 min-w-[400px]" : "w-full"} transition-all duration-300`}>
            <div className="grid gap-4">
              {filterStudents().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No sponsored students found.</p>
                  <p className="text-sm text-gray-400 mt-2">Students you sponsor will appear here.</p>
                </div>
              ) : (
                filterStudents().map((student) => (
                <div
                  key={student.studentId || student.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStudent?.studentId === student.studentId
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleViewProgress(student)}
                >
                  <div className="flex gap-4">
                    <img
                      src={student.profileImage ? `http://localhost:8081${student.profileImage}` : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop'}
                      alt={student.studentName || student.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{student.studentName}</h3>
                      <p className="text-sm text-gray-600 mb-2">Class {student.classLevel}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{getSchoolName(student.schoolId)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar size={14} />
                        <span>{student.dateOfBirth ? new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear() : 'N/A'} years old</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProgress(student);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 h-fit flex-shrink-0"
                    >
                      View Progress
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>

          {/* Student Details Panel - Right Side */}
          {selectedStudent && (
            <div className="w-2/3 border-l pl-6 transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Student Profile & Progress</h2>
                <button
                  onClick={closeStudentView}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Student Header */}
                <div className="flex gap-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                  <img
                    src={selectedStudent.profileImage ? `http://localhost:8081${selectedStudent.profileImage}` : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w-300&h=300&fit=crop'}
                    alt={selectedStudent.studentName || selectedStudent.name}
                    className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold mb-2">{selectedStudent.studentName}</h3>
                    <p className="text-gray-600 mb-4">Class {selectedStudent.classLevel}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="flex-shrink-0" />
                        <span className="truncate">{getSchoolName(selectedStudent.schoolId)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <GraduationCap size={16} />
                        <span>Age: {selectedStudent.dateOfBirth ? new Date().getFullYear() - new Date(selectedStudent.dateOfBirth).getFullYear() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <User size={20} className="text-green-600" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Student Name</p>
                      <p className="font-semibold">{selectedStudent.studentName || selectedStudent.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Class</p>
                      <p className="font-semibold">Class {selectedStudent.classLevel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">School</p>
                      <p className="font-semibold flex items-center gap-1">
                        <GraduationCap size={14} className="flex-shrink-0" />
                        <span className="truncate">{getSchoolName(selectedStudent.schoolId)}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-semibold">{selectedStudent.dateOfBirth ? new Date().getFullYear() - new Date(selectedStudent.dateOfBirth).getFullYear() : 'N/A'} years</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-semibold flex items-center gap-1">
                        <User size={14} />
                        {selectedStudent.gender || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Progress */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Award size={20} className="text-green-600" />
                    Academic Progress
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Enrollment Status</p>
                      <p className="text-lg font-bold text-blue-600">
                        Active
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Class</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedStudent.classLevel || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">School</p>
                      <p className="text-lg font-bold text-purple-600 truncate" title={getSchoolName(selectedStudent.schoolId)}>
                        {getSchoolName(selectedStudent.schoolId)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Progress & Marksheets */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-green-600" />
                    Academic Progress & Marksheets
                  </h4>
                  
                  {marksheets.length > 0 ? (
                    <div className="space-y-3">
                      {marksheets.map((doc) => (
                        <div key={doc.documentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-blue-600" />
                            <div>
                              <p className="font-semibold">{doc.documentTitle}</p>
                              <p className="text-sm text-gray-500">
                                Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => window.open(`http://localhost:8081${doc.fileUrl}`, '_blank')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <FileText size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No marksheets available</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Academic records will appear here when uploaded by the school
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}