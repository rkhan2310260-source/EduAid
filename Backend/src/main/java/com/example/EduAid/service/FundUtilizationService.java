package com.example.EduAid.service;

import com.example.EduAid.Dto.DonationDto;
import com.example.EduAid.Dto.FundUtilizationDto;
import com.example.EduAid.Dto.SchoolProjectDto;
import com.example.EduAid.Dto.CreateTransparencyDto;
import com.example.EduAid.Entity.FundUtilization;
import com.example.EduAid.Entity.FundTransparency;
import com.example.EduAid.Entity.Donation;
import com.example.EduAid.Entity.SchoolProject;
import com.example.EduAid.repository.FundUtilizationRepository;
import com.example.EduAid.repository.FundTransparencyRepository;
import com.example.EduAid.repository.DonationRepository;
import com.example.EduAid.repository.SchoolProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FundUtilizationService {

    private final FundUtilizationRepository fundUtilizationRepository;
    private final FundTransparencyRepository fundTransparencyRepository;
    private final DonationRepository donationRepository;
    private final SchoolProjectRepository schoolProjectRepository;
    private final DonationService donationService;
    private final SchoolProjectService schoolProjectService;

    public List<FundUtilizationDto> getFundUtilizationByDonor(Integer donorId) {
        List<FundUtilization> utilizations = fundUtilizationRepository.findByDonorId(donorId);
        return utilizations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<FundUtilizationDto> getFundUtilizationByNgo(Integer ngoId) {
        List<FundUtilization> utilizations = fundUtilizationRepository.findByNgoId(ngoId);
        return utilizations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<FundUtilizationDto> getFundUtilizationByProject(Integer projectId) {
        List<FundUtilization> utilizations = fundUtilizationRepository.findByProjectProjectId(projectId);
        return utilizations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<FundUtilizationDto> getAllFundUtilizations() {
        List<FundUtilization> utilizations = fundUtilizationRepository.findAll();
        return utilizations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public Double getTotalUtilizedForDonorProjects(Integer donorId) {
        return fundUtilizationRepository.getTotalUtilizedForDonorProjects(donorId);
    }

    public Double getTotalUtilizedForNgoProjects(Integer ngoId) {
        return fundUtilizationRepository.getTotalUtilizedForNgoProjects(ngoId);
    }
    
    // FIX: Create new fund utilization record with proper null handling for donation_id
    @Transactional
    public FundUtilizationDto createFundUtilization(FundUtilizationDto dto) {
        try {
            // Validate required fields
            if (dto.getAmountUsed() == null || dto.getAmountUsed().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Amount used must be greater than zero");
            }
            
            if (dto.getProjectId() == null) {
                throw new RuntimeException("Project ID is required");
            }
            
            // Validate project exists
            if (!schoolProjectRepository.existsById(dto.getProjectId())) {
                throw new RuntimeException("Project not found with ID: " + dto.getProjectId());
            }
            
            // Create new utilization entity without loading full entities to avoid Hibernate conflicts
            FundUtilization utilization = new FundUtilization();
            utilization.setAmountUsed(dto.getAmountUsed());
            utilization.setSpecificPurpose(dto.getSpecificPurpose());
            utilization.setDetailedDescription(dto.getDetailedDescription());
            utilization.setVendorName(dto.getVendorName());
            utilization.setBillInvoiceNumber(dto.getBillInvoiceNumber());
            utilization.setReceiptImageUrl(dto.getReceiptImageUrl());
            utilization.setUtilizationDate(dto.getUtilizationDate());
            utilization.setUtilizationStatus(dto.getUtilizationStatus() != null ? dto.getUtilizationStatus() : FundUtilization.UtilizationStatus.APPROVED);
            
            // Set project reference using builder to avoid loading full entity
            utilization.setProject(SchoolProject.builder().projectId(dto.getProjectId()).build());
            
            // FIX: Only set donation relationship if donationId is valid
            if (dto.getDonationId() != null && dto.getDonationId() > 0) {
                if (donationRepository.existsById(dto.getDonationId())) {
                    utilization.setDonation(Donation.builder().donationId(dto.getDonationId()).build());
                }
            }
            
            // Save utilization record
            FundUtilization savedUtilization = fundUtilizationRepository.save(utilization);
            System.out.println("Fund utilization saved with ID: " + savedUtilization.getUtilizationId());
            
            // Create transparency record in separate method if provided
            if (dto.getTransparency() != null) {
                try {
                    createTransparencyRecord(savedUtilization.getUtilizationId(), dto.getTransparency());
                } catch (Exception e) {
                    System.err.println("Warning: Failed to create transparency record: " + e.getMessage());
                    // Don't fail the whole operation if transparency creation fails
                }
            }
            
            return convertToBasicDto(savedUtilization);
        } catch (Exception e) {
            System.err.println("Error in createFundUtilization: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create fund utilization: " + e.getMessage());
        }
    }

    // FIX: Basic DTO converter without loading related entities
    private FundUtilizationDto convertToBasicDto(FundUtilization utilization) {
        return FundUtilizationDto.builder()
                .utilizationId(utilization.getUtilizationId())
                .donationId(utilization.getDonation() != null ? utilization.getDonation().getDonationId() : null)
                .projectId(utilization.getProject() != null ? utilization.getProject().getProjectId() : null)
                .amountUsed(utilization.getAmountUsed())
                .specificPurpose(utilization.getSpecificPurpose())
                .detailedDescription(utilization.getDetailedDescription())
                .vendorName(utilization.getVendorName())
                .billInvoiceNumber(utilization.getBillInvoiceNumber())
                .receiptImageUrl(utilization.getReceiptImageUrl())
                .utilizationDate(utilization.getUtilizationDate())
                .utilizationStatus(utilization.getUtilizationStatus())
                .createdAt(utilization.getCreatedAt())
                .updatedAt(utilization.getUpdatedAt())
                .build();
    }

    private FundUtilizationDto convertToDto(FundUtilization utilization) {
        FundUtilizationDto dto = FundUtilizationDto.builder()
                .utilizationId(utilization.getUtilizationId())
                .donationId(utilization.getDonation() != null ? utilization.getDonation().getDonationId() : null)
                .projectId(utilization.getProject() != null ? utilization.getProject().getProjectId() : null)
                .amountUsed(utilization.getAmountUsed())
                .specificPurpose(utilization.getSpecificPurpose())
                .detailedDescription(utilization.getDetailedDescription())
                .vendorName(utilization.getVendorName())
                .billInvoiceNumber(utilization.getBillInvoiceNumber())
                .receiptImageUrl(utilization.getReceiptImageUrl())
                .utilizationDate(utilization.getUtilizationDate())
                .utilizationStatus(utilization.getUtilizationStatus())
                .createdAt(utilization.getCreatedAt())
                .updatedAt(utilization.getUpdatedAt())
                .build();

        // Add related entity data safely
        if (utilization.getDonation() != null) {
            try {
                DonationDto donationDto = donationService.getDonationById(utilization.getDonation().getDonationId());
                dto.setDonation(donationDto);
            } catch (Exception e) {
                // Handle case where donation might not be found
            }
        }

        if (utilization.getProject() != null) {
            try {
                SchoolProjectDto projectDto = schoolProjectService.getSchoolProjectById(utilization.getProject().getProjectId());
                dto.setProject(projectDto);
            } catch (Exception e) {
                // Handle case where project might not be found
            }
        }

        return dto;
    }
    
    // AI FIX: Create transparency record for utilization in separate transaction
    @Transactional
    public void createTransparencyRecord(Integer utilizationId, CreateTransparencyDto transparencyDto) {
        try {
            // Validate utilization exists
            if (!fundUtilizationRepository.existsById(utilizationId)) {
                throw new RuntimeException("Utilization not found with ID: " + utilizationId);
            }
            
            // Create transparency entity without loading full utilization entity
            FundTransparency transparency = new FundTransparency();
            transparency.setUtilization(FundUtilization.builder().utilizationId(utilizationId).build());
            transparency.setBeforePhotos(transparencyDto.getBeforePhotos());
            transparency.setAfterPhotos(transparencyDto.getAfterPhotos());
            transparency.setBeneficiaryFeedback(transparencyDto.getBeneficiaryFeedback());
            transparency.setQuantityPurchased(transparencyDto.getQuantityPurchased());
            transparency.setUnitMeasurement(transparencyDto.getUnitMeasurement());
            transparency.setUnitCost(transparencyDto.getUnitCost());
            transparency.setAdditionalNotes(transparencyDto.getAdditionalNotes());
            transparency.setIsPublic(transparencyDto.getIsPublic() != null ? transparencyDto.getIsPublic() : true);
            
            FundTransparency savedTransparency = fundTransparencyRepository.save(transparency);
            System.out.println("Transparency record saved with ID: " + savedTransparency.getTransparencyId());
        } catch (Exception e) {
            System.err.println("Failed to create transparency record: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    // Method to create sample fund utilization data for testing
    public void createSampleFundUtilizationData() {
        try {
            // Get some existing donations and projects to create sample utilizations
            List<DonationDto> donations = donationService.getAllDonations();
            List<SchoolProjectDto> projects = schoolProjectService.getAllSchoolProjects();
            
            if (donations.isEmpty() || projects.isEmpty()) {
                throw new RuntimeException("No donations or projects found to create sample data");
            }
            
            // Create sample utilizations for the first few donations/projects
            for (int i = 0; i < Math.min(3, donations.size()) && i < projects.size(); i++) {
                DonationDto donation = donations.get(i);
                SchoolProjectDto project = projects.get(i);
                
                // Only create if donation is completed and has a project
                if (donation.getPaymentStatus() == com.example.EduAid.Entity.Donation.PaymentStatus.COMPLETED 
                    && donation.getProjectId() != null) {
                    
                    FundUtilization utilization = FundUtilization.builder()
                            .amountUsed(java.math.BigDecimal.valueOf(donation.getAmount().doubleValue() * 0.3)) // Use 30% of donation
                            .specificPurpose("Infrastructure Development")
                            .detailedDescription("Sample fund utilization for " + project.getProjectTitle())
                            .vendorName("Sample Vendor " + (i + 1))
                            .billInvoiceNumber("INV-" + System.currentTimeMillis() + "-" + i)
                            .utilizationDate(java.time.LocalDate.now().minusDays(i * 7))
                            .utilizationStatus(FundUtilization.UtilizationStatus.COMPLETED)
                            .build();
                    
                    // Set relationships
                    utilization.setDonation(Donation.builder().donationId(donation.getDonationId()).build());
                    utilization.setProject(SchoolProject.builder().projectId(donation.getProjectId()).build());
                    
                    fundUtilizationRepository.save(utilization);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error creating sample fund utilization data: " + e.getMessage());
        }
    }
}