package com.example.EduAid.service;

import com.example.EduAid.Dto.DonorGamificationDto;
import com.example.EduAid.Entity.Donor;
import com.example.EduAid.Entity.DonorGamification;
import com.example.EduAid.repository.DonorGamificationRepository;
import com.example.EduAid.repository.DonorRepository;
import com.example.EduAid.repository.DonationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DonorGamificationService {

    private final DonorGamificationRepository donorGamificationRepository;
    private final DonorRepository donorRepository;
    private final DonationRepository donationRepository;

    public List<DonorGamificationDto> getAllDonorGamification() {
        return donorGamificationRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public DonorGamificationDto getDonorGamificationByDonorId(Integer donorId) {
        DonorGamification gamification = donorGamificationRepository.findByDonorDonorId(donorId)
                .orElse(null);
        
        if (gamification == null) {
            // Create default gamification record if not found
            Donor donor = donorRepository.findById(donorId)
                    .orElseThrow(() -> new RuntimeException("Donor not found"));
            
            gamification = DonorGamification.builder()
                    .donor(donor)
                    .totalPoints(0)
                    .impactScore(0.0)
                    .badgesEarned(List.of("New Donor"))
                    .lastUpdated(LocalDateTime.now())
                    .build();
            
            gamification = donorGamificationRepository.save(gamification);
        }
        
        return convertToDto(gamification);
    }

    public DonorGamificationDto createOrUpdateDonorGamification(DonorGamificationDto dto) {
        Donor donor = donorRepository.findById(dto.getDonorId())
                .orElseThrow(() -> new RuntimeException("Donor not found"));

        DonorGamification gamification = donorGamificationRepository.findByDonorDonorId(dto.getDonorId())
                .orElse(DonorGamification.builder()
                        .donor(donor)
                        .totalPoints(0)
                        .impactScore(0.0)
                        .badgesEarned(new ArrayList<>())
                        .lastUpdated(LocalDateTime.now())
                        .build());

        // Update fields
        if (dto.getTotalPoints() != null) {
            gamification.setTotalPoints(dto.getTotalPoints());
        }
        if (dto.getImpactScore() != null) {
            gamification.setImpactScore(dto.getImpactScore());
        }
        if (dto.getBadgesEarned() != null) {
            gamification.setBadgesEarned(dto.getBadgesEarned());
        }
        
        gamification.setLastUpdated(LocalDateTime.now());

        DonorGamification saved = donorGamificationRepository.save(gamification);
        return convertToDto(saved);
    }

    public void deleteDonorGamification(Integer donorId) {
        DonorGamification gamification = donorGamificationRepository.findByDonorDonorId(donorId)
                .orElseThrow(() -> new RuntimeException("Donor gamification not found"));
        donorGamificationRepository.delete(gamification);
    }

    public Integer getUniqueSchoolsCountByDonor(Integer donorId) {
        // This would require a native query to count unique schools from donations
        // For now, return a default value
        return donorGamificationRepository.getUniqueSchoolsCountByDonor(donorId);
    }

    public Map<String, Object> getDonorStats(Integer donorId) {
        Map<String, Object> stats = new java.util.HashMap<>();
        
        // Get actual donation statistics from donations table
        BigDecimal totalDonated = donationRepository.getTotalDonatedByDonor(donorId);
        stats.put("totalDonated", totalDonated != null ? totalDonated.doubleValue() : 0.0);
        
        // Get unique schools count
        Integer uniqueSchools = getUniqueSchoolsCountByDonor(donorId);
        stats.put("totalSchoolsSupported", uniqueSchools != null ? uniqueSchools : 0);
        
        // Count unique students sponsored (distinct students only, excluding duplicates)
        Long studentsSponsored = donationRepository.countDistinctStudentsByDonorAndPaymentStatus(
            donorId, com.example.EduAid.Entity.Donation.PaymentStatus.COMPLETED);
        System.out.println("DEBUG: Unique students sponsored for donor " + donorId + ": " + studentsSponsored);
        stats.put("totalStudentsSponsored", studentsSponsored != null ? studentsSponsored.intValue() : 0);
        
        // Count distinct projects donated to (unique projects only)
        Long projectsDonated = donationRepository.countDistinctProjectsByDonorAndPaymentStatus(
            donorId, com.example.EduAid.Entity.Donation.PaymentStatus.COMPLETED);
        stats.put("totalProjectsDonated", projectsDonated != null ? projectsDonated.intValue() : 0);
        
        // Get gamification data if exists
        DonorGamification gamification = donorGamificationRepository.findByDonorDonorId(donorId)
                .orElse(null);
        
        if (gamification != null) {
            stats.put("totalPoints", gamification.getTotalPoints());
            stats.put("impactScore", gamification.getImpactScore());
            stats.put("badgesEarned", gamification.getBadgesEarned() != null ? gamification.getBadgesEarned().size() : 0);
            stats.put("currentLevel", calculateLevel(gamification.getTotalPoints()));
        } else {
            stats.put("totalPoints", 0);
            stats.put("impactScore", 0.0);
            stats.put("badgesEarned", 0);
            stats.put("currentLevel", "Bronze");
        }
        
        return stats;
    }

    private String calculateLevel(Integer totalPoints) {
        if (totalPoints == null || totalPoints == 0) return "Beginner";
        if (totalPoints >= 50000) return "Diamond";
        if (totalPoints >= 25000) return "Platinum";
        if (totalPoints >= 10000) return "Gold";
        if (totalPoints >= 2500) return "Silver";
        return "Bronze";
    }

    private DonorGamificationDto convertToDto(DonorGamification gamification) {
        return DonorGamificationDto.builder()
                .gamificationId(gamification.getGamificationId())
                .donorId(gamification.getDonor().getDonorId())
                .totalPoints(gamification.getTotalPoints())
                .impactScore(gamification.getImpactScore())
                .badgesEarned(gamification.getBadgesEarned())
                .lastUpdated(gamification.getLastUpdated())
                .build();
    }
}