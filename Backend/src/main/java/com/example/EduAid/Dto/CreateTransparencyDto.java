package com.example.EduAid.Dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * AI FIX: DTO for creating transparency from project creation workflow
 * Allows optional utilization_id and handles image arrays as JSON
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTransparencyDto {

    private List<String> beforePhotos;

    private List<String> afterPhotos;

    private String beneficiaryFeedback;

    @DecimalMin(value = "0.0", message = "Quantity purchased must be non-negative")
    private BigDecimal quantityPurchased;

    private String unitMeasurement;

    @DecimalMin(value = "0.0", message = "Unit cost must be non-negative")
    private BigDecimal unitCost;

    private String additionalNotes;

    // Optional - can be null if no existing utilization
    private Integer utilizationId;

    @Builder.Default
    private Boolean isPublic = true;
}