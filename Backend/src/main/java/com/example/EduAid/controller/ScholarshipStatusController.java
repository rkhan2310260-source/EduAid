package com.example.EduAid.controller;

import com.example.EduAid.service.ScholarshipStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for managing scholarship status updates
 */
@RestController
@RequestMapping("/api/scholarship-status")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ScholarshipStatusController {

    private final ScholarshipStatusService scholarshipStatusService;

    /**
     * Manually trigger scholarship status update for all students
     * Updates has_scholarship based on current month donations
     */
    @PostMapping("/update")
    public ResponseEntity<String> updateScholarshipStatus() {
        try {
            log.info("Manual scholarship status update requested");
            scholarshipStatusService.updateScholarshipStatus();
            return ResponseEntity.ok("Scholarship status updated successfully for all students");
        } catch (Exception e) {
            log.error("Failed to update scholarship status: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                .body("Failed to update scholarship status: " + e.getMessage());
        }
    }

    /**
     * One-time fix to update scholarship status for all existing donations
     * Sets has_scholarship = true for students who have any completed donations
     */
    @PostMapping("/fix-existing")
    public ResponseEntity<String> fixExistingDonations() {
        try {
            log.info("One-time fix for existing donations requested");
            scholarshipStatusService.fixExistingDonations();
            return ResponseEntity.ok("Scholarship status fixed for all existing donations");
        } catch (Exception e) {
            log.error("Failed to fix existing donations: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                .body("Failed to fix existing donations: " + e.getMessage());
        }
    }

    /**
     * Get current scholarship status summary
     */
    @GetMapping("/status")
    public ResponseEntity<String> getScholarshipStatus() {
        try {
            String status = scholarshipStatusService.getScholarshipStatusSummary();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Failed to get scholarship status: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                .body("Failed to get scholarship status: " + e.getMessage());
        }
    }
}