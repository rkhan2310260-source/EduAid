package com.example.EduAid.controller;

import com.example.EduAid.Dto.CreateTransparencyDto;
import com.example.EduAid.service.SchoolProjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Arrays;

/**
 * Test controller to create sample transparency data for testing
 */
@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestTransparencyController {

    private final SchoolProjectService schoolProjectService;

    public TestTransparencyController(SchoolProjectService schoolProjectService) {
        this.schoolProjectService = schoolProjectService;
    }

    @PostMapping("/create-sample-transparency/{projectId}")
    public ResponseEntity<String> createSampleTransparency(@PathVariable Integer projectId) {
        try {
            CreateTransparencyDto transparencyDto = CreateTransparencyDto.builder()
                    .additionalNotes("Sample transparency data for testing. All materials purchased from verified local vendors.")
                    .beforePhotos(Arrays.asList("/uploads/fund_transparency/before/sample1.jpg", "/uploads/fund_transparency/before/sample2.jpg"))
                    .afterPhotos(Arrays.asList("/uploads/fund_transparency/after/sample1.jpg"))
                    .beneficiaryFeedback("The students and teachers are very happy with the improvements made to the classroom.")
                    .isPublic(true)
                    .quantityPurchased(new BigDecimal("50"))
                    .unitCost(new BigDecimal("25.00"))
                    .unitMeasurement("desks and chairs")
                    .utilizationId(null) // Will create new utilization
                    .build();

            schoolProjectService.createProjectTransparency(projectId, transparencyDto);
            return ResponseEntity.ok("Sample transparency data created for project " + projectId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating sample data: " + e.getMessage());
        }
    }
}