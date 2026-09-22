package com.example.EduAid.Dto;

import com.example.EduAid.Entity.NgoProject;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NgoProjectDto {

    private Integer ngoProjectId;
    private Integer ngoId;
    private String projectName;
    private String projectDescription;
    private Integer projectTypeId;
    private BigDecimal budget;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // PLANNED, ACTIVE, COMPLETED, CANCELLED
    
    // Nested NGO details for conversation creation
    private NgoDetailsDto ngo;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NgoDetailsDto {
        private Integer ngoId;
        private String ngoName;
        private UserDetailsDto user;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDetailsDto {
        private Integer userId;
        private String username;
    }
}
