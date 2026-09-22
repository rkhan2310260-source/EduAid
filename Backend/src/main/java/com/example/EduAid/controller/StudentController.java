package com.example.EduAid.controller;

import com.example.EduAid.Dto.StudentDto;
import com.example.EduAid.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public List<StudentDto> getAllStudents() {
        return studentService.getAllStudents();
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentDto> getStudentById(@PathVariable Integer id) {
        return studentService.getStudentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<StudentDto> createStudent(@RequestBody StudentDto dto) {
        return ResponseEntity.ok(studentService.createStudent(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentDto> updateStudent(@PathVariable Integer id, @RequestBody StudentDto dto) {
        return ResponseEntity.ok(studentService.updateStudent(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Integer id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }



    @PostMapping("/{id}/image")
    public ResponseEntity<Map<String, String>> uploadStudentImage(
            @PathVariable Integer id, 
            @RequestParam("image") MultipartFile file) {
        try {
            System.out.println("Received image upload request for student ID: " + id);
            System.out.println("File name: " + file.getOriginalFilename());
            System.out.println("File size: " + file.getSize());
            System.out.println("File empty: " + file.isEmpty());
            
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            
            String imagePath = studentService.updateStudentImage(id, file);
            return ResponseEntity.ok(Map.of("imagePath", imagePath));
        } catch (Exception e) {
            System.err.println("Error uploading image: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/count/school/{schoolId}")
    public ResponseEntity<Map<String, Long>> getStudentCountBySchool(@PathVariable Integer schoolId) {
        Long count = studentService.getStudentCountBySchoolId(schoolId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/sponsored/donor/{donorId}")
    public ResponseEntity<List<StudentDto>> getStudentsSponsoredByDonor(@PathVariable Integer donorId) {
        List<StudentDto> students = studentService.getStudentsSponsoredByDonor(donorId);
        return ResponseEntity.ok(students);
    }
    
    @GetMapping("/find-for-sponsorship")
    public ResponseEntity<StudentDto> findStudentForSponsorship() {
        StudentDto student = studentService.findMostSuitableStudentForSponsorship();
        if (student != null) {
            return ResponseEntity.ok(student);
        }
        return ResponseEntity.notFound().build();
    }
    
    @GetMapping("/high-risk-for-sponsorship")
    public ResponseEntity<List<StudentDto>> getHighRiskStudentsForSponsorship() {
        List<StudentDto> students = studentService.getHighRiskStudentsForSponsorship(4);
        return ResponseEntity.ok(students);
    }
    
    @PostMapping("/{id}/mark-sponsored")
    public ResponseEntity<Map<String, String>> markStudentAsSponsored(@PathVariable Integer id) {
        try {
            studentService.markStudentAsSponsored(id);
            return ResponseEntity.ok(Map.of("message", "Student marked as sponsored successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/reset-sponsorship")
    public ResponseEntity<Map<String, String>> resetStudentSponsorship(@PathVariable Integer id) {
        try {
            studentService.resetStudentSponsorship(id);
            return ResponseEntity.ok(Map.of("message", "Student sponsorship reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}
