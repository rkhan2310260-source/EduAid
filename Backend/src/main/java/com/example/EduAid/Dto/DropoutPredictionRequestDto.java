package com.example.EduAid.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DropoutPredictionRequestDto {
    
    private Integer studentId;
    private Double attendanceRate;
}