package com.example.EduAid.controller;

import com.example.EduAid.Dto.DonationDto;
import com.example.EduAid.Entity.Donation;
import com.example.EduAid.service.DonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DonationController {

    private final DonationService donationService;

    @PostMapping
    public ResponseEntity<DonationDto> saveDonation(@Valid @RequestBody DonationDto donationDto) {
        DonationDto savedDonation = donationService.saveDonation(donationDto);
        return new ResponseEntity<>(savedDonation, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<DonationDto>> getAllDonations() {
        List<DonationDto> donations = donationService.getAllDonations();
        return ResponseEntity.ok(donations);
    }

    @GetMapping("/{donationId}")
    public ResponseEntity<DonationDto> getDonationById(@PathVariable Integer donationId) {
        DonationDto donation = donationService.getDonationById(donationId);
        return ResponseEntity.ok(donation);
    }

    @DeleteMapping("/{donationId}")
    public ResponseEntity<Void> deleteDonation(@PathVariable Integer donationId) {
        donationService.deleteDonation(donationId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{donationId}/complete-payment")
    public ResponseEntity<DonationDto> completePayment(@PathVariable Integer donationId) {
        DonationDto donation = donationService.completePayment(donationId);
        return ResponseEntity.ok(donation);
    }

    @PutMapping("/{donationId}/fail-payment")
    public ResponseEntity<DonationDto> failPayment(@PathVariable Integer donationId) {
        DonationDto donation = donationService.failPayment(donationId);
        return ResponseEntity.ok(donation);
    }

    @PutMapping("/{donationId}/payment-status")
    public ResponseEntity<DonationDto> updatePaymentStatus(@PathVariable Integer donationId,
                                                           @RequestParam Donation.PaymentStatus paymentStatus) {
        DonationDto donation = donationService.updatePaymentStatus(donationId, paymentStatus);
        return ResponseEntity.ok(donation);
    }

    @GetMapping("/donor/{donorId}")
    public ResponseEntity<List<DonationDto>> getDonationsByDonor(@PathVariable Integer donorId) {
        List<DonationDto> donations = donationService.getDonationsByDonorWithDetails(donorId);
        return ResponseEntity.ok(donations);
    }

    // Get recent donations for a specific school
    @GetMapping("/school/{schoolId}/recent")
    public ResponseEntity<List<DonationDto>> getRecentDonationsBySchool(@PathVariable Integer schoolId) {
        List<DonationDto> donations = donationService.getRecentDonationsBySchool(schoolId);
        return ResponseEntity.ok(donations);
    }

    // Get all donations for a specific school (for reporting)
    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<DonationDto>> getAllDonationsBySchool(@PathVariable Integer schoolId) {
        List<DonationDto> donations = donationService.getAllDonationsBySchool(schoolId);
        return ResponseEntity.ok(donations);
    }

    // Get total donation amount by donor for specific project
    @GetMapping("/donor/{donorId}/project/{projectId}/total")
    public ResponseEntity<Double> getTotalDonationByDonorForProject(@PathVariable Integer donorId, @PathVariable Integer projectId) {
        Double total = donationService.getTotalDonationByDonorForProject(donorId, projectId);
        return ResponseEntity.ok(total != null ? total : 0.0);
    }

    // Get all donations received by school from all sources (donors + NGOs) with proper details
    @GetMapping("/school/{schoolId}/all-sources")
    public ResponseEntity<List<DonationDto>> getAllDonationsFromAllSources(@PathVariable Integer schoolId) {
        List<DonationDto> donations = donationService.getAllDonationsFromAllSources(schoolId);
        return ResponseEntity.ok(donations);
    }

    // Get available donations for a project with remaining amounts (for fund utilization dropdown)
    @GetMapping("/project/{projectId}/available")
    public ResponseEntity<List<com.example.EduAid.Dto.AvailableDonationDto>> getAvailableDonationsForProject(@PathVariable Integer projectId) {
        List<com.example.EduAid.Dto.AvailableDonationDto> donations = donationService.getAvailableDonationsForProject(projectId);
        return ResponseEntity.ok(donations);
    }

    // AI FIX: Get all donor donations for a specific project (for analytics)
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<DonationDto>> getDonationsByProject(@PathVariable Integer projectId) {
        List<DonationDto> donations = donationService.getDonationsByProject(projectId);
        return ResponseEntity.ok(donations);
    }
}