package com.example.EduAid.service;

import com.example.EduAid.Entity.NgoProject;
import com.example.EduAid.Entity.Ngo;
import com.example.EduAid.Entity.ProjectType;
import com.example.EduAid.repository.NgoProjectRepository;
import com.example.EduAid.repository.NgoRepository;
import com.example.EduAid.repository.ProjectTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NgoProjectService {

    private final NgoProjectRepository ngoProjectRepository;
    private final NgoRepository ngoRepository;
    private final ProjectTypeRepository projectTypeRepository;

    // Get all projects
    public List<NgoProject> getAllProjects() {
        return ngoProjectRepository.findAll();
    }

    // Get project by ID
    public NgoProject getProjectById(Integer id) {
        return ngoProjectRepository.findById(id).orElse(null);
    }

    // Create project - Fixed: Handle missing projectTypeId by using default project type
    public NgoProject createProject(NgoProject project, Integer ngoId, Integer projectTypeId) {
        try {
            System.out.println("Creating project with ngoId: " + ngoId + ", projectTypeId: " + projectTypeId);
            
            if (ngoId != null) {
                Ngo ngo = ngoRepository.findById(ngoId)
                        .orElseThrow(() -> new RuntimeException("NGO not found with ID: " + ngoId));
                project.setNgo(ngo);
                System.out.println("Set NGO: " + ngo.getNgoId());
            }
            
            // Fixed: Use default project type if not provided
            if (projectTypeId != null) {
                ProjectType projectType = projectTypeRepository.findById(projectTypeId)
                        .orElseThrow(() -> new RuntimeException("Project Type not found with ID: " + projectTypeId));
                project.setProjectType(projectType);
                System.out.println("Set Project Type: " + projectType.getProjectTypeId());
            } else {
                // Try to find any available project type or create a default one
                ProjectType defaultProjectType = projectTypeRepository.findById(1)
                        .orElse(projectTypeRepository.findAll().stream().findFirst()
                                .orElseThrow(() -> new RuntimeException("No Project Types found. Please create at least one project type first.")));
                project.setProjectType(defaultProjectType);
                System.out.println("Set Default Project Type: " + defaultProjectType.getProjectTypeId());
            }
            
            NgoProject saved = ngoProjectRepository.save(project);
            System.out.println("Successfully saved project with ID: " + saved.getNgoProjectId());
            return saved;
        } catch (Exception e) {
            System.err.println("Error in createProject: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Update project
    public NgoProject updateProject(Integer id, NgoProject project) {
        project.setNgoProjectId(id);
        return ngoProjectRepository.save(project);
    }

    // Delete project
    public void deleteProject(Integer id) {
        ngoProjectRepository.deleteById(id);
    }
}
