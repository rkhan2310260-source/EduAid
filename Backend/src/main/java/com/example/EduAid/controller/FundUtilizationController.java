package com.example.EduAid.controller;

import com.example.EduAid.Dto.FundUtilizationDto;
import com.example.EduAid.service.FundUtilizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fund-utilization")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FundUtilizationController {

    private final FundUtilizationService fundUtilizationService;

    @GetMapping("/donor/{donorId}")
    public ResponseEntity<List<FundUtilizationDto>> getFundUtilizationByDonor(@PathVariable Integer donorId) {
        List<FundUtilizationDto> utilizations = fundUtilizationService.getFundUtilizationByDonor(donorId);
        return ResponseEntity.ok(utilizations);
    }

    @GetMapping("/ngo/{ngoId}")
    public ResponseEntity<List<FundUtilizationDto>> getFundUtilizationByNgo(@PathVariable Integer ngoId) {
        List<FundUtilizationDto> utilizations = fundUtilizationService.getFundUtilizationByNgo(ngoId);
        return ResponseEntity.ok(utilizations);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<FundUtilizationDto>> getFundUtilizationByProject(@PathVariable Integer projectId) {
        List<FundUtilizationDto> utilizations = fundUtilizationService.getFundUtilizationByProject(projectId);
        return ResponseEntity.ok(utilizations);
    }

    @GetMapping
    public ResponseEntity<List<FundUtilizationDto>> getAllFundUtilizations() {
        List<FundUtilizationDto> utilizations = fundUtilizationService.getAllFundUtilizations();
        return ResponseEntity.ok(utilizations);
    }

    @GetMapping("/donor/{donorId}/projects-total-used")
    public ResponseEntity<Double> getTotalUtilizedForDonorProjects(@PathVariable Integer donorId) {
        Double totalUsed = fundUtilizationService.getTotalUtilizedForDonorProjects(donorId);
        return ResponseEntity.ok(totalUsed != null ? totalUsed : 0.0);
    }

    @GetMapping("/ngo/{ngoId}/projects-total-used")
    public ResponseEntity<Double> getTotalUtilizedForNgoProjects(@PathVariable Integer ngoId) {
        Double totalUsed = fundUtilizationService.getTotalUtilizedForNgoProjects(ngoId);
        return ResponseEntity.ok(totalUsed != null ? totalUsed : 0.0);
    }
    
    // FIX: POST endpoint for creating fund utilization records with proper null donation handling
    @PostMapping
    public ResponseEntity<?> createFundUtilization(@RequestBody FundUtilizationDto fundUtilizationDto) {
        try {
            // Validate required input
            if (fundUtilizationDto.getProjectId() == null) {
                return ResponseEntity.badRequest().body("Project ID is required");
            }
            if (fundUtilizationDto.getAmountUsed() == null) {
                return ResponseEntity.badRequest().body("Amount used is required");
            }
            
            // FIX: Log the incoming request for debugging
            System.out.println("Creating fund utilization - ProjectId: " + fundUtilizationDto.getProjectId() + 
                             ", DonationId: " + fundUtilizationDto.getDonationId() + 
                             ", Amount: " + fundUtilizationDto.getAmountUsed());
            
            FundUtilizationDto createdUtilization = fundUtilizationService.createFundUtilization(fundUtilizationDto);
            return ResponseEntity.status(201).body(createdUtilization);
        } catch (Exception e) {
            System.err.println("Error creating fund utilization: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating fund utilization: " + e.getMessage());
        }
    }
    
    // FIX: Separate endpoint for creating fund utilization without transparency first
    @PostMapping("/basic")
    public ResponseEntity<?> createBasicFundUtilization(@RequestBody FundUtilizationDto fundUtilizationDto) {
        try {
            // Validate required input
            if (fundUtilizationDto.getProjectId() == null) {
                return ResponseEntity.badRequest().body("Project ID is required");
            }
            if (fundUtilizationDto.getAmountUsed() == null) {
                return ResponseEntity.badRequest().body("Amount used is required");
            }
            
            // Remove transparency data to create basic utilization first
            fundUtilizationDto.setTransparency(null);
            
            FundUtilizationDto createdUtilization = fundUtilizationService.createFundUtilization(fundUtilizationDto);
            return ResponseEntity.status(201).body(createdUtilization);
        } catch (Exception e) {
            System.err.println("Error creating basic fund utilization: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating fund utilization: " + e.getMessage());
        }
    }
    
    // Test endpoint to create sample fund utilization data
    @PostMapping("/create-sample-data")
    public ResponseEntity<String> createSampleFundUtilizationData() {
        try {
            fundUtilizationService.createSampleFundUtilizationData();
            return ResponseEntity.ok("Sample fund utilization data created successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating sample data: " + e.getMessage());
        }
    }
    
    // FIX: Add transparency to existing utilization
    @PostMapping("/{utilizationId}/transparency")
    public ResponseEntity<?> addTransparencyToUtilization(
            @PathVariable Integer utilizationId, 
            @RequestBody com.example.EduAid.Dto.CreateTransparencyDto transparencyDto) {
        try {
            fundUtilizationService.createTransparencyRecord(utilizationId, transparencyDto);
            return ResponseEntity.ok("Transparency record added successfully");
        } catch (Exception e) {
            System.err.println("Error adding transparency: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error adding transparency: " + e.getMessage());
        }
    }
}