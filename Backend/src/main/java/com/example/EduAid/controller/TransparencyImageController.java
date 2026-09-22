package com.example.EduAid.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * AI FIX: Controller for handling transparency image uploads
 * Creates folder structure: fund_transparency/before|after/projectId_transparencyId_filename
 */
@RestController
@RequestMapping("/api/transparency-images")
@CrossOrigin(origins = "*")
public class TransparencyImageController {

    // AI FIX: Upload to static resources folder so Spring Boot can serve the images
    private static final String UPLOAD_DIR = "src/main/resources/static/uploads/project_transparency/";

    @PostMapping("/upload/{projectId}")
    public ResponseEntity<List<String>> uploadTransparencyImages(
            @PathVariable Integer projectId,
            @RequestParam("type") String type, // "before" or "after"
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "transparencyId", required = false) Integer transparencyId) {

        // Validate type parameter
        if (!type.equals("before") && !type.equals("after")) {
            return ResponseEntity.badRequest().build();
        }

        List<String> uploadedUrls = new ArrayList<>();

        try {
            // Create directory structure: fund_transparency/before|after/
            String typeDir = UPLOAD_DIR + type + "/";
            Path uploadPath = Paths.get(typeDir);
            Files.createDirectories(uploadPath);

            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    // Generate unique filename: projectId_transparencyId_uuid_originalname
                    String originalFilename = file.getOriginalFilename();
                    String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    String uniqueFilename = projectId + "_" + 
                                          (transparencyId != null ? transparencyId : "temp") + "_" + 
                                          UUID.randomUUID().toString() + extension;

                    Path filePath = uploadPath.resolve(uniqueFilename);
                    Files.copy(file.getInputStream(), filePath);

                    // Return relative URL for storage in database
                    String fileUrl = "/uploads/project_transparency/" + type + "/" + uniqueFilename;
                    uploadedUrls.add(fileUrl);
                }
            }

            return ResponseEntity.ok(uploadedUrls);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteTransparencyImage(@RequestParam String imageUrl) {
        try {
            // Extract filename from URL and delete file
            String filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            String type = imageUrl.contains("/before/") ? "before" : "after";
            
            Path filePath = Paths.get(UPLOAD_DIR + type + "/" + filename);
            Files.deleteIfExists(filePath);
            
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}