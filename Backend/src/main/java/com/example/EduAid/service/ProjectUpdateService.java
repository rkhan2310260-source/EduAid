package com.example.EduAid.service;

import com.example.EduAid.Entity.ProjectUpdate;
import com.example.EduAid.Entity.SchoolProject;
import com.example.EduAid.repository.ProjectUpdateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectUpdateService {

    private final ProjectUpdateRepository projectUpdateRepository;

    public List<ProjectUpdate> getAllUpdates() {
        return projectUpdateRepository.findAll();
    }

    public ProjectUpdate getUpdateById(Integer id) {
        return projectUpdateRepository.findById(id).orElse(null);
    }

    @Transactional
    public ProjectUpdate createUpdate(ProjectUpdate update, Integer projectId) {
        // Validate required fields
        if (projectId == null) {
            throw new RuntimeException("Project ID is required");
        }
        
        if (update.getUpdateTitle() == null || update.getUpdateTitle().trim().isEmpty()) {
            throw new RuntimeException("Update title is required");
        }
        
        if (update.getUpdateDescription() == null || update.getUpdateDescription().trim().isEmpty()) {
            throw new RuntimeException("Update description is required");
        }
        
        // Set project relationship using projectId
        SchoolProject project = new SchoolProject();
        project.setProjectId(projectId);
        update.setProject(project);
        
        return projectUpdateRepository.save(update);
    }

    public ProjectUpdate updateUpdate(Integer id, ProjectUpdate update) {
        update.setUpdateId(id);
        return projectUpdateRepository.save(update);
    }

    public void deleteUpdate(Integer id) {
        projectUpdateRepository.deleteById(id);
    }
    
    // Get updates by project ID
    public List<ProjectUpdate> getUpdatesByProjectId(Integer projectId) {
        return projectUpdateRepository.findByProjectProjectId(projectId);
    }
}
