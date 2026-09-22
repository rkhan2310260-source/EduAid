package com.example.EduAid.controller;

import com.example.EduAid.Dto.SchoolProjectDto;
import com.example.EduAid.service.SchoolProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/school-projects")
@CrossOrigin(origins = "*")
public class SchoolProjectController {

    private final SchoolProjectService schoolProjectService;

    public SchoolProjectController(SchoolProjectService schoolProjectService) {
        this.schoolProjectService = schoolProjectService;
    }

    // Create new school project
    @PostMapping
    public ResponseEntity<SchoolProjectDto> createSchoolProject(@Valid @RequestBody SchoolProjectDto schoolProjectDto) {
        SchoolProjectDto createdProject = schoolProjectService.saveSchoolProject(schoolProjectDto);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    // Get all school projects
    @GetMapping
    public ResponseEntity<List<SchoolProjectDto>> getAllSchoolProjects() {
        List<SchoolProjectDto> projects = schoolProjectService.getAllSchoolProjects();
        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    // Get filtered school projects
    @GetMapping("/filter")
    public ResponseEntity<List<SchoolProjectDto>> getFilteredProjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String funding) {
        List<SchoolProjectDto> projects = schoolProjectService.getFilteredProjects(search, type, funding);
        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    // Get project type names for filter dropdown
    @GetMapping("/type-names")
    public ResponseEntity<List<String>> getProjectTypeNames() {
        List<String> typeNames = schoolProjectService.getProjectTypeNames();
        return new ResponseEntity<>(typeNames, HttpStatus.OK);
    }

    // Get school project by ID
    @GetMapping("/{projectId}")
    public ResponseEntity<SchoolProjectDto> getSchoolProjectById(@PathVariable Integer projectId) {
        SchoolProjectDto project = schoolProjectService.getSchoolProjectById(projectId);
        return new ResponseEntity<>(project, HttpStatus.OK);
    }

    // Update school project
    @PutMapping("/{projectId}")
    public ResponseEntity<SchoolProjectDto> updateSchoolProject(@PathVariable Integer projectId,
                                                                @Valid @RequestBody SchoolProjectDto schoolProjectDto) {
        schoolProjectDto.setProjectId(projectId);
        SchoolProjectDto updatedProject = schoolProjectService.saveSchoolProject(schoolProjectDto);
        return new ResponseEntity<>(updatedProject, HttpStatus.OK);
    }

    // Delete school project
    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteSchoolProject(@PathVariable Integer projectId) {
        schoolProjectService.deleteSchoolProject(projectId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    // Get all project types
    @GetMapping("/types")
    public ResponseEntity<List<com.example.EduAid.Entity.ProjectType>> getProjectTypes() {
        List<com.example.EduAid.Entity.ProjectType> projectTypes = schoolProjectService.getAllProjectTypes();
        return new ResponseEntity<>(projectTypes, HttpStatus.OK);
    }
    
    // Initialize project types (for testing)
    @PostMapping("/init-types")
    public ResponseEntity<String> initializeProjectTypes() {
        schoolProjectService.initializeProjectTypes();
        return new ResponseEntity<>("Project types initialized", HttpStatus.OK);
    }
    
    // Get project completion rate
    @GetMapping("/{projectId}/completion-rate")
    public ResponseEntity<Integer> getProjectCompletionRate(@PathVariable Integer projectId) {
        Integer completionRate = schoolProjectService.getProjectCompletionRate(projectId);
        return new ResponseEntity<>(completionRate, HttpStatus.OK);
    }
    
    // Get project fund statistics for a school
    @GetMapping("/school/{schoolId}/fund-stats")
    public ResponseEntity<java.util.Map<String, java.math.BigDecimal>> getSchoolProjectFundStats(@PathVariable Integer schoolId) {
        java.util.Map<String, java.math.BigDecimal> fundStats = schoolProjectService.getSchoolProjectFundStats(schoolId);
        return new ResponseEntity<>(fundStats, HttpStatus.OK);
    }

    // AI FIX: Create fund transparency for project (safer separate endpoint)
    @PostMapping("/{projectId}/fund-transparency")
    public ResponseEntity<com.example.EduAid.Dto.FundTransparencyDto> createProjectTransparency(
            @PathVariable Integer projectId,
            @Valid @RequestBody com.example.EduAid.Dto.CreateTransparencyDto transparencyDto) {
        
        // Create transparency record linked to project
        com.example.EduAid.Dto.FundTransparencyDto createdTransparency = 
            schoolProjectService.createProjectTransparency(projectId, transparencyDto);
        
        return new ResponseEntity<>(createdTransparency, HttpStatus.CREATED);
    }

}

// Add a separate controller for general project access
@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
class ProjectController {
    
    private final SchoolProjectService schoolProjectService;
    
    public ProjectController(SchoolProjectService schoolProjectService) {
        this.schoolProjectService = schoolProjectService;
    }
    
    // Get project by ID (general endpoint)
    @GetMapping("/{projectId}")
    public ResponseEntity<SchoolProjectDto> getProjectById(@PathVariable Integer projectId) {
        SchoolProjectDto project = schoolProjectService.getSchoolProjectById(projectId);
        return new ResponseEntity<>(project, HttpStatus.OK);
    }
    
    // Get all projects (general endpoint)
    @GetMapping
    public ResponseEntity<List<SchoolProjectDto>> getAllProjects() {
        List<SchoolProjectDto> projects = schoolProjectService.getAllSchoolProjects();
        return new ResponseEntity<>(projects, HttpStatus.OK);
    }
}