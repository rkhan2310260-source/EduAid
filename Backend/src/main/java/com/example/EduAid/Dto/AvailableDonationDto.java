package com.example.EduAid.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// DTO for showing available donations with remaining amounts in fund utilization modal
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableDonationDto {
    private Integer donationId;
    private String donorName;
    private BigDecimal amount;           // Original donation amount
    private BigDecimal utilizedAmount;   // Amount already utilized
    private BigDecimal remainingAmount;  // Calculated: amount - utilizedAmount
    private LocalDateTime donatedAt;
    private String source;               // 'Donor' or 'NGO'
}
