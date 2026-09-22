package com.example.EduAid.service;

import com.example.EduAid.Entity.School;
import com.example.EduAid.Entity.Student;
import com.example.EduAid.Dto.StudentDto;
import com.example.EduAid.repository.SchoolRepository;
import com.example.EduAid.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;
    private final SchoolRepository schoolRepository;

    // Convert Entity -> DTO
    private StudentDto convertToDTO(Student student) {
        // Get latest risk status from dropout predictions
        String riskStatus = "LOW"; // Default
        if (student.getDropoutPredictions() != null && !student.getDropoutPredictions().isEmpty()) {
            // Get the most recent prediction
            riskStatus = student.getDropoutPredictions().stream()
                .max((p1, p2) -> p1.getLastCalculated().compareTo(p2.getLastCalculated()))
                .map(p -> p.getRiskStatus().toString())
                .orElse("LOW");
        }
        
        return StudentDto.builder()
                .studentId(student.getStudentId())
                .schoolId(student.getSchool().getSchoolId())
                .studentName(student.getStudentName())
                .studentIdNumber(student.getStudentIdNumber())
                .gender(student.getGender())
                .dateOfBirth(student.getDateOfBirth())
                .fatherName(student.getFatherName())
                .fatherAlive(student.getFatherAlive())
                .fatherOccupation(student.getFatherOccupation())
                .motherName(student.getMotherName())
                .motherAlive(student.getMotherAlive())
                .motherOccupation(student.getMotherOccupation())
                .guardianPhone(student.getGuardianPhone())
                .address(student.getAddress())
                .classLevel(student.getClassLevel())
                .familyMonthlyIncome(student.getFamilyMonthlyIncome())
                .hasScholarship(student.getHasScholarship())
                .riskStatus(riskStatus)
                .profileImage(student.getProfileImage())
                .build();
    }

    // Convert DTO -> Entity
    private Student convertToEntity(StudentDto dto) {
        School school = schoolRepository.findById(dto.getSchoolId())
                .orElseThrow(() -> new RuntimeException("School not found"));

        return Student.builder()
                .studentId(dto.getStudentId())
                .school(school)
                .studentName(dto.getStudentName())
                .studentIdNumber(dto.getStudentIdNumber())
                .gender(dto.getGender())
                .dateOfBirth(dto.getDateOfBirth())
                .fatherName(dto.getFatherName())
                .fatherAlive(dto.getFatherAlive())
                .fatherOccupation(dto.getFatherOccupation())
                .motherName(dto.getMotherName())
                .motherAlive(dto.getMotherAlive())
                .motherOccupation(dto.getMotherOccupation())
                .guardianPhone(dto.getGuardianPhone())
                .address(dto.getAddress())
                .classLevel(dto.getClassLevel())
                .familyMonthlyIncome(dto.getFamilyMonthlyIncome())
                .hasScholarship(dto.getHasScholarship())
                .profileImage(dto.getProfileImage())
                .build();
    }

    public List<StudentDto> getAllStudents() {
        return studentRepository.findAll()
                .stream().map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<StudentDto> getStudentById(Integer id) {
        return studentRepository.findById(id).map(this::convertToDTO);
    }

    public StudentDto createStudent(StudentDto dto) {
        Student student = convertToEntity(dto);
        return convertToDTO(studentRepository.save(student));
    }

    @Transactional
    public StudentDto updateStudent(Integer id, StudentDto dto) {
        return studentRepository.findById(id).map(existing -> {
            // Update existing entity fields instead of creating new entity
            if (dto.getStudentName() != null) existing.setStudentName(dto.getStudentName());
            if (dto.getGender() != null) existing.setGender(dto.getGender());
            if (dto.getDateOfBirth() != null) existing.setDateOfBirth(dto.getDateOfBirth());
            if (dto.getClassLevel() != null) existing.setClassLevel(dto.getClassLevel());
            if (dto.getFatherName() != null) existing.setFatherName(dto.getFatherName());
            if (dto.getMotherName() != null) existing.setMotherName(dto.getMotherName());
            if (dto.getGuardianPhone() != null) existing.setGuardianPhone(dto.getGuardianPhone());
            if (dto.getAddress() != null) existing.setAddress(dto.getAddress());
            if (dto.getFamilyMonthlyIncome() != null) existing.setFamilyMonthlyIncome(dto.getFamilyMonthlyIncome());
            if (dto.getFatherAlive() != null) existing.setFatherAlive(dto.getFatherAlive());
            if (dto.getMotherAlive() != null) existing.setMotherAlive(dto.getMotherAlive());
            if (dto.getHasScholarship() != null) existing.setHasScholarship(dto.getHasScholarship());
            // Only update profile image if provided
            if (dto.getProfileImage() != null) existing.setProfileImage(dto.getProfileImage());
            
            return convertToDTO(studentRepository.save(existing));
        }).orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));
    }

    public void deleteStudent(Integer id) {
        studentRepository.deleteById(id);
    }

public String saveStudentImageWithSchool(MultipartFile file, Integer studentId, Integer schoolId) {
    try {
        System.out.println("Saving image for student ID: " + studentId + ", school ID: " + schoolId);
        
        // Validate file
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty or null");
        }
        
        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("File must be an image");
        }
        
        String uploadDir = "src/main/resources/static/images/students/";
        Path uploadPath = Paths.get(uploadDir);
        
        System.out.println("Upload directory: " + uploadPath.toAbsolutePath());
        
        if (!Files.exists(uploadPath)) {
            System.out.println("Creating directory: " + uploadPath);
            Files.createDirectories(uploadPath);
        }
        
        String fileExtension = getFileExtension(file.getOriginalFilename());
        String fileName = "school_" + schoolId + "_student_" + studentId + fileExtension;
        Path filePath = uploadPath.resolve(fileName);
        
        System.out.println("Saving file to: " + filePath.toAbsolutePath());
        Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        System.out.println("File saved successfully");
        
        return "/images/students/" + fileName;
    } catch (IOException e) {
        System.err.println("IOException while saving image: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Failed to save image: " + e.getMessage(), e);
    } catch (Exception e) {
        System.err.println("Unexpected error while saving image: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Failed to save image: " + e.getMessage(), e);
    }
}

public String saveStudentImage(MultipartFile file, Integer studentId) {
    try {
        System.out.println("Saving image for student ID: " + studentId);
        String uploadDir = "src/main/resources/static/images/students/";
        Path uploadPath = Paths.get(uploadDir);
        
        System.out.println("Upload directory: " + uploadPath.toAbsolutePath());
        
        if (!Files.exists(uploadPath)) {
            System.out.println("Creating directory: " + uploadPath);
            Files.createDirectories(uploadPath);
        }
        
        String fileExtension = getFileExtension(file.getOriginalFilename());
        String fileName = "student_" + studentId + fileExtension;
        Path filePath = uploadPath.resolve(fileName);
        
        System.out.println("Saving file to: " + filePath.toAbsolutePath());
        Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        System.out.println("File saved successfully");
        
        return "/images/students/" + fileName;
    } catch (IOException e) {
        System.err.println("IOException while saving image: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Failed to save image: " + e.getMessage());
    }
}
    public String saveUserImage(MultipartFile file, Integer userId) {
        try {
            String uploadDir = "src/main/resources/static/images/users/";
            Path uploadPath = Paths.get(uploadDir);
            
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            String fileExtension = getFileExtension(file.getOriginalFilename());
            String fileName = "user_" + userId + fileExtension;
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);
            
            return "/static/images/users/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save image: " + e.getMessage());
        }
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return ".png";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    @Transactional
    public String updateStudentImage(Integer studentId, MultipartFile file) {
        System.out.println("Updating image for student ID: " + studentId);
        
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty or null");
        }
        
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));
        
        try {
            // First save the file
            String imagePath = saveStudentImageWithSchool(file, studentId, student.getSchool().getSchoolId());
            System.out.println("Image saved at path: " + imagePath);
            
            // Update only the profile image field using repository update method
            int updatedRows = studentRepository.updateStudentProfileImage(studentId, imagePath);
            if (updatedRows == 0) {
                throw new RuntimeException("Failed to update student profile image in database");
            }
            
            System.out.println("Student profile image updated successfully. Path: " + imagePath);
            return imagePath;
        } catch (Exception e) {
            System.err.println("Error updating student image: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update student image: " + e.getMessage(), e);
        }
    }
    
    public Long getStudentCountBySchoolId(Integer schoolId) {
        return studentRepository.countStudentsBySchoolId(schoolId);
    }

    public List<StudentDto> getStudentsSponsoredByDonor(Integer donorId) {
        return studentRepository.findStudentsSponsoredByDonor(donorId)
                .stream().map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public StudentDto findMostSuitableStudentForSponsorship() {
        System.out.println("Finding most suitable student for sponsorship...");
        
        // First try to find high-risk students without scholarship
        Optional<Student> highRiskStudent = studentRepository.findHighRiskStudentForSponsorship();
        if (highRiskStudent.isPresent()) {
            Student student = highRiskStudent.get();
            System.out.println("Found high-risk student for sponsorship: ID=" + student.getStudentId() + 
                              ", Name=" + student.getStudentName() + 
                              ", Income=" + student.getFamilyMonthlyIncome());
            return convertToDTO(student);
        }
        
        System.out.println("No high-risk student found, looking for needy student...");
        
        // If no high-risk student found, find student with lowest family income without scholarship
        Optional<Student> needyStudent = studentRepository.findNeedyStudentForSponsorship();
        if (needyStudent.isPresent()) {
            Student student = needyStudent.get();
            System.out.println("Found needy student for sponsorship: ID=" + student.getStudentId() + 
                              ", Name=" + student.getStudentName() + 
                              ", Income=" + student.getFamilyMonthlyIncome());
            return convertToDTO(student);
        }
        
        System.out.println("No suitable student found for sponsorship");
        return null;
    }
    
    public List<StudentDto> getHighRiskStudentsForSponsorship(int limit) {
        System.out.println("Finding " + limit + " high-risk students for sponsorship display...");
        List<Student> students = studentRepository.findHighRiskStudentsForSponsorship(limit);
        System.out.println("Found " + students.size() + " high-risk students for sponsorship");
        
        for (Student student : students) {
            System.out.println("Student: ID=" + student.getStudentId() + 
                              ", Name=" + student.getStudentName() + 
                              ", Income=" + student.getFamilyMonthlyIncome() + 
                              ", HasScholarship=" + student.getHasScholarship());
        }
        
        return students.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    // Method to mark student as sponsored (set hasScholarship = true)
    public void markStudentAsSponsored(Integer studentId) {
        System.out.println("Marking student " + studentId + " as sponsored...");
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setHasScholarship(true);
            studentRepository.save(student);
            System.out.println("Student " + studentId + " (" + student.getStudentName() + ") marked as sponsored");
        } else {
            System.err.println("Student " + studentId + " not found when trying to mark as sponsored");
            throw new RuntimeException("Student not found");
        }
    }
    
    // Method to reset student sponsorship (set hasScholarship = false) - for testing
    public void resetStudentSponsorship(Integer studentId) {
        System.out.println("Resetting sponsorship for student " + studentId + "...");
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setHasScholarship(false);
            studentRepository.save(student);
            System.out.println("Student " + studentId + " (" + student.getStudentName() + ") sponsorship reset");
        } else {
            System.err.println("Student " + studentId + " not found when trying to reset sponsorship");
            throw new RuntimeException("Student not found");
        }
    }

}
