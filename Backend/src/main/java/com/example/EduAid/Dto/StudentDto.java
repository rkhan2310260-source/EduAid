package com.example.EduAid.Dto;

import com.example.EduAid.Entity.Student.ClassLevel;
import com.example.EduAid.Entity.Student.Gender;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDto {

    private Integer studentId;
    private Integer schoolId; // Only storing school ID to avoid recursion

    private String studentName;
    private String studentIdNumber;
    private Gender gender;
    private LocalDate dateOfBirth;

    private String fatherName;
    private Boolean fatherAlive;
    private String fatherOccupation;

    private String motherName;
    private Boolean motherAlive;
    private String motherOccupation;

    private String guardianPhone;
    private String address;

    private ClassLevel classLevel;
    private BigDecimal familyMonthlyIncome;
    private Boolean hasScholarship;
    private String riskStatus; // Risk status from dropout predictions

    private String profileImage;
}
