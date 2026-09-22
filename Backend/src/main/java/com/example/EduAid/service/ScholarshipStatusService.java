package com.example.EduAid.service;

import com.example.EduAid.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service to manage scholarship status updates for students
 * Updates has_scholarship field based on donations received in current month
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScholarshipStatusService {

    private final StudentRepository studentRepository;

    /**
     * Updates scholarship status for all students
     * Sets has_scholarship = 1 if student received donation in current month, otherwise 0
     */
    @Transactional
    public void updateScholarshipStatus() {
        try {
            log.info("Starting scholarship status update for all students");
            studentRepository.updateScholarshipStatus();
            log.info("Successfully updated scholarship status for all students");
        } catch (Exception e) {
            log.error("Error updating scholarship status: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update scholarship status", e);
        }
    }

    /**
     * Scheduled task to run scholarship status update daily at midnight
     * Ensures scholarship status is always current
     */
    @Scheduled(cron = "0 0 0 * * *") // Run daily at midnight
    public void scheduledScholarshipStatusUpdate() {
        log.info("Running scheduled scholarship status update");
        updateScholarshipStatus();
    }

    /**
     * One-time fix to update scholarship status for all existing donations
     * Sets has_scholarship = true for students who have any completed donations
     */
    @Transactional
    public void fixExistingDonations() {
        try {
            log.info("Starting one-time fix for existing donations");
            studentRepository.fixExistingDonations();
            log.info("Successfully fixed scholarship status for all existing donations");
        } catch (Exception e) {
            log.error("Error fixing existing donations: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fix existing donations", e);
        }
    }

    /**
     * Get scholarship status summary
     */
    public String getScholarshipStatusSummary() {
        try {
            Object[] result = studentRepository.getScholarshipStatusSummary();
            if (result != null && result.length >= 3) {
                long totalStudents = ((Number) result[0]).longValue();
                long withScholarship = ((Number) result[1]).longValue();
                long withoutScholarship = ((Number) result[2]).longValue();
                
                return String.format(
                    "Scholarship Status Summary:\n" +
                    "Total Students: %d\n" +
                    "Students with Scholarship: %d\n" +
                    "Students without Scholarship: %d",
                    totalStudents, withScholarship, withoutScholarship
                );
            }
            return "No data available";
        } catch (Exception e) {
            log.error("Error getting scholarship status summary: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get scholarship status summary", e);
        }
    }
}