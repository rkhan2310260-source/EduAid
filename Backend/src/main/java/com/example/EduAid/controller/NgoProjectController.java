package com.example.EduAid.controller;

import com.example.EduAid.Dto.NgoProjectDto;
import com.example.EduAid.Entity.NgoProject;
import com.example.EduAid.service.NgoProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ngo-projects")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NgoProjectController {

    private final NgoProjectService ngoProjectService;

    // GET all projects
    @GetMapping
    public ResponseEntity<List<NgoProjectDto>> getAllProjects() {
        List<NgoProjectDto> dtos = ngoProjectService.getAllProjects()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // GET project by ID
    @GetMapping("/{id}")
    public ResponseEntity<NgoProjectDto> getProjectById(@PathVariable Integer id) {
        NgoProject project = ngoProjectService.getProjectById(id);
        return ResponseEntity.ok(toDto(project));
    }

    // POST create project - Added debug logging and proper error handling
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody NgoProjectDto dto) {
        try {
            System.out.println("Received DTO: " + dto);
            
            // Validate required fields
            if (dto.getNgoId() == null) {
                return ResponseEntity.badRequest().body("NGO ID is required");
            }
            if (dto.getProjectName() == null || dto.getProjectName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Project name is required");
            }
            
            NgoProject project = fromDto(dto);
            System.out.println("Converted to entity: " + project);
            NgoProject saved = ngoProjectService.createProject(project, dto.getNgoId(), dto.getProjectTypeId());
            System.out.println("Saved project: " + saved);
            return ResponseEntity.ok(toDto(saved));
        } catch (RuntimeException e) {
            System.err.println("Runtime error creating project: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error creating project: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Internal server error: " + e.getMessage());
        }
    }

    // PUT update project
    @PutMapping("/{id}")
    public ResponseEntity<NgoProjectDto> updateProject(@PathVariable Integer id,
                                                       @RequestBody NgoProjectDto dto) {
        NgoProject project = fromDto(dto);
        NgoProject saved = ngoProjectService.updateProject(id, project);
        return ResponseEntity.ok(toDto(saved));
    }

    // DELETE project
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Integer id) {
        ngoProjectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    // --- Helper methods ---
    // Convert entity to DTO with nested NGO and User details for conversation creation
    private NgoProjectDto toDto(NgoProject project) {
        if (project == null) return null;
        
        NgoProjectDto.NgoDetailsDto ngoDetails = null;
        if (project.getNgo() != null) {
            NgoProjectDto.UserDetailsDto userDetails = null;
            if (project.getNgo().getUser() != null) {
                userDetails = NgoProjectDto.UserDetailsDto.builder()
                        .userId(project.getNgo().getUser().getUserId())
                        .username(project.getNgo().getUser().getUsername())
                        .build();
            }
            
            ngoDetails = NgoProjectDto.NgoDetailsDto.builder()
                    .ngoId(project.getNgo().getNgoId())
                    .ngoName(project.getNgo().getNgoName())
                    .user(userDetails)
                    .build();
        }
        
        return NgoProjectDto.builder()
                .ngoProjectId(project.getNgoProjectId())
                .ngoId(project.getNgo() != null ? project.getNgo().getNgoId() : null)
                .projectName(project.getProjectName())
                .projectDescription(project.getProjectDescription())
                .projectTypeId(project.getProjectType() != null ? project.getProjectType().getProjectTypeId() : null)
                .budget(project.getBudget())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus().name())
                .ngo(ngoDetails)
                .build();
    }

    private NgoProject fromDto(NgoProjectDto dto) {
        NgoProject project = new NgoProject();
        project.setProjectName(dto.getProjectName());
        project.setProjectDescription(dto.getProjectDescription());
        project.setBudget(dto.getBudget());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        if (dto.getStatus() != null) {
            try {
                project.setStatus(NgoProject.ProjectStatus.valueOf(dto.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid project status: " + dto.getStatus() + ". Valid values are: PLANNED, ACTIVE, COMPLETED, CANCELLED");
            }
        }
        return project;
    }
}
