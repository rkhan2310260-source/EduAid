package com.example.EduAid.Dto;

import com.example.EduAid.Entity.Donation;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationDto {

    private Integer donationId;

    @NotNull(message = "Donor ID is required")
    private Integer donorId;

    private Integer projectId;

    private Integer studentId;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotNull(message = "Donation type is required")
    private Donation.DonationType donationType;

    private Integer transactionId;

    @Builder.Default
    private Donation.PaymentStatus paymentStatus = Donation.PaymentStatus.PENDING;

    @NotNull(message = "Purpose is required")
    private Donation.DonationPurpose purpose;

    private String donorMessage;

    @Builder.Default
    private Boolean isAnonymous = false;

    private LocalDateTime donatedAt;

    private LocalDateTime paymentCompletedAt;



    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Additional fields for reporting with transaction and project details
    private String transactionRef;
    private String projectName;
    private String donorName;
    private String recipientName;
    
    // Additional fields for all-sources donation reporting (donor + NGO donations)
    private String projectTitle;  // Project title for project donations
    private String studentName;   // Student name for student sponsorships
    private String source;        // Source of donation: 'donor' or 'ngo'
}