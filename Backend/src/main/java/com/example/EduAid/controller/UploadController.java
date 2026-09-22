package com.example.EduAid.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class UploadController {

    private static final String UPLOAD_DIR = "src/main/resources/static/uploads/school_projects/";

    @PostMapping("/project-images")
    public ResponseEntity<Map<String, Object>> uploadProjectImages(
            @RequestParam("images") MultipartFile[] images,
            @RequestParam("projectId") Integer projectId) {
        
        Map<String, Object> response = new HashMap<>();
        List<String> imageUrls = new ArrayList<>();
        
        try {
            // Create directory structure: uploads/school_projects/school_{schoolId}/updates/project_{projectId}/
            String projectDir = UPLOAD_DIR + "project_" + projectId + "/updates/";
            Path uploadPath = Paths.get(projectDir);
            
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    // Generate unique filename
                    String originalFilename = image.getOriginalFilename();
                    String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    String filename = UUID.randomUUID().toString() + extension;
                    
                    // Save file
                    Path filePath = uploadPath.resolve(filename);
                    Files.copy(image.getInputStream(), filePath);
                    
                    // Create URL (relative to static resources)
                    String imageUrl = "/uploads/school_projects/project_" + projectId + "/updates/" + filename;
                    imageUrls.add(imageUrl);
                }
            }
            
            response.put("success", true);
            response.put("imageUrls", imageUrls);
            response.put("message", "Images uploaded successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Failed to upload images: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // FIX: New endpoint for fund transparency images
    @PostMapping("/transparency-images")
    public ResponseEntity<Map<String, Object>> uploadTransparencyImages(
            @RequestParam("images") MultipartFile[] images,
            @RequestParam("type") String type, // "before" or "after"
            @RequestParam("projectId") Integer projectId) {
        
        Map<String, Object> response = new HashMap<>();
        List<String> imageUrls = new ArrayList<>();
        
        try {
            // Create directory structure: src/main/resources/static/uploads/project_transparency/before/ or after/
            String transparencyDir = "src/main/resources/static/uploads/project_transparency/" + type + "/";
            Path uploadPath = Paths.get(transparencyDir);
            
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    // Generate unique filename
                    String originalFilename = image.getOriginalFilename();
                    String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    String filename = UUID.randomUUID().toString() + extension;
                    
                    // Save file
                    Path filePath = uploadPath.resolve(filename);
                    Files.copy(image.getInputStream(), filePath);
                    
                    // Create URL (relative to static resources)
                    String imageUrl = "/uploads/project_transparency/" + type + "/" + filename;
                    imageUrls.add(imageUrl);
                }
            }
            
            response.put("success", true);
            response.put("imageUrls", imageUrls);
            response.put("message", "Transparency images uploaded successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Failed to upload transparency images: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}