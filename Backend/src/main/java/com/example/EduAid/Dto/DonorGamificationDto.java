package com.example.EduAid.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonorGamificationDto {
    private Integer gamificationId;
    private Integer donorId;
    private Integer totalPoints;
    private Double impactScore;
    private List<String> badgesEarned;
    private LocalDateTime lastUpdated;
}