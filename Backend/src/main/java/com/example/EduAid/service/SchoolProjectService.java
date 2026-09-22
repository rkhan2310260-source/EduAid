package com.example.EduAid.service;

import com.example.EduAid.Entity.*;
import com.example.EduAid.Dto.SchoolProjectDto;
import com.example.EduAid.Dto.CreateTransparencyDto;
import com.example.EduAid.Dto.FundTransparencyDto;
import com.example.EduAid.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SchoolProjectService {

    private final SchoolProjectRepository schoolProjectRepository;
    private final SchoolRepository schoolRepository;
    private final ProjectTypeRepository projectTypeRepository;
    private final FundUtilizationRepository fundUtilizationRepository;
    private final FundTransparencyRepository fundTransparencyRepository;

    public SchoolProjectService(SchoolProjectRepository schoolProjectRepository,
                                SchoolRepository schoolRepository,
                                ProjectTypeRepository projectTypeRepository,
                                FundUtilizationRepository fundUtilizationRepository,
                                FundTransparencyRepository fundTransparencyRepository) {
        this.schoolProjectRepository = schoolProjectRepository;
        this.schoolRepository = schoolRepository;
        this.projectTypeRepository = projectTypeRepository;
        this.fundUtilizationRepository = fundUtilizationRepository;
        this.fundTransparencyRepository = fundTransparencyRepository;
    }

    @PostConstruct
    public void initializeProjectTypes() {
        try {
            long count = projectTypeRepository.count();
            System.out.println("Current project types count: " + count);
            
            if (count == 0) {
                System.out.println("Initializing default project types...");
                // Create default project types
                ProjectType[] defaultTypes = {
                    ProjectType.builder().typeName("Infrastructure").typeCode("INFRA").typeDescription("Infrastructure development projects").isActive(true).build(),
                    ProjectType.builder().typeName("Education").typeCode("EDU").typeDescription("Educational improvement projects").isActive(true).build(),
                    ProjectType.builder().typeName("Technology").typeCode("TECH").typeDescription("Technology enhancement projects").isActive(true).build(),
                    ProjectType.builder().typeName("Health & Safety").typeCode("HEALTH").typeDescription("Health and safety projects").isActive(true).build(),
                    ProjectType.builder().typeName("Sports & Recreation").typeCode("SPORTS").typeDescription("Sports and recreation projects").isActive(true).build(),
                    ProjectType.builder().typeName("Arts & Culture").typeCode("ARTS").typeDescription("Arts and culture projects").isActive(true).build(),
                    ProjectType.builder().typeName("Environment").typeCode("ENV").typeDescription("Environmental projects").isActive(true).build()
                };
                
                for (ProjectType type : defaultTypes) {
                    ProjectType saved = projectTypeRepository.save(type);
                    System.out.println("Created project type: " + saved.getTypeName() + " with ID: " + saved.getProjectTypeId());
                }
                System.out.println("Successfully initialized " + defaultTypes.length + " project types");
            } else {
                System.out.println("Project types already exist, skipping initialization");
            }
        } catch (Exception e) {
            System.err.println("Error initializing project types: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Create or update SchoolProject
    public SchoolProjectDto saveSchoolProject(SchoolProjectDto schoolProjectDto) {
        School school = schoolRepository.findById(schoolProjectDto.getSchoolId())
                .orElseThrow(() -> new RuntimeException("School not found"));

            // Ensure project types are initialized
        initializeProjectTypes();
        
        ProjectType projectType = projectTypeRepository.findById(schoolProjectDto.getProjectTypeId())
                .orElseThrow(() -> new RuntimeException("Project type not found with ID: " + schoolProjectDto.getProjectTypeId()));

        SchoolProject schoolProject = SchoolProject.builder()
                .projectId(schoolProjectDto.getProjectId())
                .school(school)
                .projectTitle(schoolProjectDto.getProjectTitle())
                .projectDescription(schoolProjectDto.getProjectDescription())
                .projectType(projectType)
                .requiredAmount(schoolProjectDto.getRequiredAmount())
                .build();

        SchoolProject saved = schoolProjectRepository.save(schoolProject);
        return mapToDto(saved);
    }

    // Get all school projects
    public List<SchoolProjectDto> getAllSchoolProjects() {
        return schoolProjectRepository.findAllWithProjectType().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // Get school project by ID
    public SchoolProjectDto getSchoolProjectById(Integer projectId) {
        SchoolProject project = schoolProjectRepository.findByIdWithProjectType(projectId);
        if (project == null) {
            throw new RuntimeException("School project not found");
        }
        return mapToDto(project);
    }

    // Delete school project
    public void deleteSchoolProject(Integer projectId) {
        if (!schoolProjectRepository.existsById(projectId)) {
            throw new RuntimeException("School project not found");
        }
        schoolProjectRepository.deleteById(projectId);
    }
    
    // Get all project types for dropdown
    public List<ProjectType> getAllProjectTypes() {
        initializeProjectTypes();
        return projectTypeRepository.findAll();
    }

    // Get filtered projects based on search criteria
    public List<SchoolProjectDto> getFilteredProjects(String search, String type, String funding) {
        return schoolProjectRepository.findFilteredProjects(search, type, funding).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // Get project type names for filter dropdown
    public List<String> getProjectTypeNames() {
        initializeProjectTypes();
        return projectTypeRepository.findAllTypeNames();
    }
    
    // Get project completion rate
    public Integer getProjectCompletionRate(Integer projectId) {
        Double completionRate = schoolProjectRepository.getLatestCompletionRate(projectId);
        return completionRate != null ? completionRate.intValue() : 0;
    }
    
    // Get project fund statistics for a school
    public java.util.Map<String, java.math.BigDecimal> getSchoolProjectFundStats(Integer schoolId) {
        java.math.BigDecimal totalFundsReceived = schoolProjectRepository.getTotalFundsReceivedBySchool(schoolId);
        java.math.BigDecimal totalFundsUtilized = schoolProjectRepository.getTotalFundsUtilizedBySchool(schoolId);
        
        java.util.Map<String, java.math.BigDecimal> stats = new java.util.HashMap<>();
        stats.put("totalFundsReceived", totalFundsReceived != null ? totalFundsReceived : java.math.BigDecimal.ZERO);
        stats.put("totalFundsUtilized", totalFundsUtilized != null ? totalFundsUtilized : java.math.BigDecimal.ZERO);
        
        return stats;
    }

    // AI FIX: Create fund transparency for project (handles optional utilization_id)
    public FundTransparencyDto createProjectTransparency(Integer projectId, CreateTransparencyDto transparencyDto) {
        // Verify project exists
        SchoolProject project = schoolProjectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + projectId));

        FundUtilization utilization = null;
        
        // If utilization_id provided, validate it exists and belongs to this project
        if (transparencyDto.getUtilizationId() != null) {
            utilization = fundUtilizationRepository.findById(transparencyDto.getUtilizationId())
                    .orElseThrow(() -> new RuntimeException("Fund utilization not found with ID: " + transparencyDto.getUtilizationId()));
            
            // Verify utilization belongs to this project
            if (!utilization.getProject().getProjectId().equals(projectId)) {
                throw new RuntimeException("Fund utilization does not belong to the specified project");
            }
        } else {
            // Create a basic utilization record for this transparency
            utilization = FundUtilization.builder()
                    .project(project)
                    .amountUsed(java.math.BigDecimal.ZERO) // Default to zero if not specified
                    .specificPurpose("Transparency record for project: " + project.getProjectTitle())
                    .utilizationDate(java.time.LocalDate.now())
                    .utilizationStatus(FundUtilization.UtilizationStatus.PENDING)
                    .build();
            utilization = fundUtilizationRepository.save(utilization);
        }

        // Create transparency record
        FundTransparency transparency = FundTransparency.builder()
                .utilization(utilization)
                .beforePhotos(transparencyDto.getBeforePhotos())
                .afterPhotos(transparencyDto.getAfterPhotos())
                .beneficiaryFeedback(transparencyDto.getBeneficiaryFeedback())
                .quantityPurchased(transparencyDto.getQuantityPurchased())
                .unitMeasurement(transparencyDto.getUnitMeasurement())
                .unitCost(transparencyDto.getUnitCost())
                .additionalNotes(transparencyDto.getAdditionalNotes())
                .isPublic(transparencyDto.getIsPublic())
                .build();

        FundTransparency saved = fundTransparencyRepository.save(transparency);
        
        // Map to DTO and return
        return FundTransparencyDto.builder()
                .transparencyId(saved.getTransparencyId())
                .utilizationId(saved.getUtilization().getUtilizationId())
                .beforePhotos(saved.getBeforePhotos())
                .afterPhotos(saved.getAfterPhotos())
                .beneficiaryFeedback(saved.getBeneficiaryFeedback())
                .quantityPurchased(saved.getQuantityPurchased())
                .unitMeasurement(saved.getUnitMeasurement())
                .unitCost(saved.getUnitCost())
                .additionalNotes(saved.getAdditionalNotes())
                .isPublic(saved.getIsPublic())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    // Map SchoolProject entity to DTO with funding logic
    private SchoolProjectDto mapToDto(SchoolProject schoolProject) {
        java.math.BigDecimal raisedAmount = schoolProjectRepository.getTotalRaisedAmount(schoolProject.getProjectId());
        Double completionRate = schoolProjectRepository.getLatestCompletionRate(schoolProject.getProjectId());
        
        // Calculate funding percentage and check for auto-completion
        java.math.BigDecimal requiredAmount = schoolProject.getRequiredAmount();
        int fundingPercentage = 0;
        
        if (requiredAmount != null && requiredAmount.compareTo(java.math.BigDecimal.ZERO) > 0) {
            java.math.BigDecimal raised = raisedAmount != null ? raisedAmount : java.math.BigDecimal.ZERO;
            // Calculate percentage and cap at 100%
            double percentage = raised.divide(requiredAmount, 4, java.math.RoundingMode.HALF_UP)
                                    .multiply(java.math.BigDecimal.valueOf(100))
                                    .doubleValue();
            fundingPercentage = Math.min(100, (int) Math.round(percentage));
            
            // Auto-complete project if funding reaches 100% (status logic for future use)
            if (fundingPercentage >= 100) {
                schoolProject.setProjectStatus(SchoolProject.ProjectStatus.COMPLETED);
                // Note: Status is transient until DB migration, so no save needed yet
            }
        }
        
        return SchoolProjectDto.builder()
                .projectId(schoolProject.getProjectId())
                .schoolId(schoolProject.getSchool().getSchoolId())
                .schoolName(schoolProject.getSchool().getSchoolName())
                .projectTitle(schoolProject.getProjectTitle())
                .projectDescription(schoolProject.getProjectDescription())
                .projectTypeId(schoolProject.getProjectType().getProjectTypeId())
                .projectTypeName(schoolProject.getProjectType().getTypeName())
                .requiredAmount(schoolProject.getRequiredAmount())
                .raisedAmount(raisedAmount != null ? raisedAmount : java.math.BigDecimal.ZERO)
                .completionRate(completionRate != null ? completionRate : 0.0)
                .projectStatus(schoolProject.getProjectStatus() != null ? schoolProject.getProjectStatus().name() : "ACTIVE")
                .fundingPercentage(fundingPercentage)
                .createdAt(schoolProject.getCreatedAt())
                .updatedAt(schoolProject.getUpdatedAt())
                .build();
    }
}