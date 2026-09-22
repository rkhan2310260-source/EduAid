package com.example.EduAid.service;

import com.example.EduAid.Entity.NgoProjectDonations;
import com.example.EduAid.Dto.NgoProjectDonationsDTO;
import com.example.EduAid.repository.NgoProjectDonationsRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NgoProjectDonationsService {

    private final NgoProjectDonationsRepository repository;
    private final NgoGamificationService gamificationService;

    public NgoProjectDonationsService(NgoProjectDonationsRepository repository,
                                     NgoGamificationService gamificationService) {
        this.repository = repository;
        this.gamificationService = gamificationService;
    }

    // ===================== CREATE =====================
    public NgoProjectDonationsDTO create(NgoProjectDonationsDTO dto) {
        NgoProjectDonations entity = mapToEntity(dto);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());

        NgoProjectDonations saved = repository.save(entity);
        
        // Update gamification data after successful donation
        try {
            System.out.println("Project donation created successfully for NGO " + dto.getNgoId() + ", updating gamification...");
            gamificationService.updateGamificationAfterDonation(dto.getNgoId());
            System.out.println("Gamification update completed for NGO " + dto.getNgoId());
        } catch (Exception e) {
            // Log error but don't fail the donation
            System.err.println("Failed to update gamification for NGO " + dto.getNgoId() + ": " + e.getMessage());
            e.printStackTrace();
        }
        
        return mapToDTO(saved);
    }

    // ===================== UPDATE =====================
    public NgoProjectDonationsDTO update(Integer id, NgoProjectDonationsDTO dto) {
        NgoProjectDonations entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Donation not found"));

        entity.setAmount(dto.getAmount());
        entity.setDonatedAt(dto.getDonatedAt());
        entity.setDonationType(dto.getDonationType() != null ? NgoProjectDonations.DonationType.valueOf(dto.getDonationType()) : null);
        entity.setMessage(dto.getMessage());
        entity.setPaymentCompletedAt(dto.getPaymentCompletedAt());
        entity.setPaymentStatus(dto.getPaymentStatus() != null ? NgoProjectDonations.PaymentStatus.valueOf(dto.getPaymentStatus()) : null);
        entity.setProjectId(dto.getProjectId());
        entity.setNgoId(dto.getNgoId());
        entity.setTransactionId(dto.getTransactionId());
        entity.setUpdatedAt(LocalDateTime.now());

        NgoProjectDonations updated = repository.save(entity);
        
        // Update gamification data after successful update
        try {
            System.out.println("Project donation updated successfully for NGO " + dto.getNgoId() + ", updating gamification...");
            gamificationService.updateGamificationAfterDonation(dto.getNgoId());
            System.out.println("Gamification update completed for NGO " + dto.getNgoId());
        } catch (Exception e) {
            // Log error but don't fail the update
            System.err.println("Failed to update gamification for NGO " + dto.getNgoId() + ": " + e.getMessage());
            e.printStackTrace();
        }
        
        return mapToDTO(updated);
    }

    // ===================== GET BY ID =====================
    public NgoProjectDonationsDTO getById(Integer id) {
        NgoProjectDonations entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Donation not found"));
        return mapToDTO(entity);
    }

    // ===================== GET ALL =====================
    public List<NgoProjectDonationsDTO> getAll() {
        return repository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ===================== GET BY NGO ID =====================
    public List<NgoProjectDonationsDTO> getByNgoId(Integer ngoId) {
        return repository.findAll()
                .stream()
                .filter(donation -> donation.getNgoId().equals(ngoId))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ===================== GET NGO TOTAL FOR PROJECT =====================
    public Double getNgoTotalForProject(Integer ngoId, Integer projectId) {
        return repository.getNgoTotalForProject(ngoId, projectId);
    }

    // ===================== DELETE =====================
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    // ===================== MAPPER METHODS =====================
    private NgoProjectDonationsDTO mapToDTO(NgoProjectDonations entity) {
        return NgoProjectDonationsDTO.builder()
                .projectDonationId(entity.getProjectDonationId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .amount(entity.getAmount())
                .donatedAt(entity.getDonatedAt())
                .donationType(entity.getDonationType() != null ? entity.getDonationType().name() : null)
                .message(entity.getMessage())
                .paymentCompletedAt(entity.getPaymentCompletedAt())
                .paymentStatus(entity.getPaymentStatus() != null ? entity.getPaymentStatus().name() : null)
                .projectId(entity.getProjectId())
                .ngoId(entity.getNgoId())
                .transactionId(entity.getTransactionId())
                .build();
    }

    private NgoProjectDonations mapToEntity(NgoProjectDonationsDTO dto) {
        return NgoProjectDonations.builder()
                .amount(dto.getAmount())
                .donatedAt(dto.getDonatedAt())
                .donationType(dto.getDonationType() != null ? NgoProjectDonations.DonationType.valueOf(dto.getDonationType()) : null)
                .message(dto.getMessage())
                .paymentCompletedAt(dto.getPaymentCompletedAt())
                .paymentStatus(dto.getPaymentStatus() != null ? NgoProjectDonations.PaymentStatus.valueOf(dto.getPaymentStatus()) : null)
                .projectId(dto.getProjectId())
                .ngoId(dto.getNgoId())
                .transactionId(dto.getTransactionId())
                .build();
    }

    // AI FIX: Get all NGO donations for a specific project (for analytics)
    public List<NgoProjectDonationsDTO> getByProjectId(Integer projectId) {
        return repository.findAll().stream()
                .filter(d -> d.getProjectId().equals(projectId))
                .map(this::mapToDTO)
                .collect(java.util.stream.Collectors.toList());
    }
}
