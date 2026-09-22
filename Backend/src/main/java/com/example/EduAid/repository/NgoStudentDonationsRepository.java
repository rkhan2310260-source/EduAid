package com.example.EduAid.repository;

import com.example.EduAid.Entity.NgoStudentDonations;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NgoStudentDonationsRepository extends JpaRepository<NgoStudentDonations, Integer> {

    // Find all donations by a specific student
    @Query(value = "SELECT * FROM ngo_student_donations WHERE student_id = :studentId", nativeQuery = true)
    List<NgoStudentDonations> findByStudentId(@Param("studentId") Integer studentId);

    // Find all donations by a specific NGO
    @Query(value = "SELECT * FROM ngo_student_donations WHERE ngo_id = :ngoId", nativeQuery = true)
    List<NgoStudentDonations> findByNgoId(@Param("ngoId") Integer ngoId);

    // Find donations by payment status
    @Query(value = "SELECT * FROM ngo_student_donations WHERE payment_status = :status", nativeQuery = true)
    List<NgoStudentDonations> findByPaymentStatus(@Param("status") String status);

    // Find donations within a specific date range
    @Query(value = "SELECT * FROM ngo_student_donations WHERE donated_at BETWEEN :startDate AND :endDate", nativeQuery = true)
    List<NgoStudentDonations> findByDonatedAtBetween(@Param("startDate") String startDate, @Param("endDate") String endDate);
    
    // Find NGO ID by donation ID
    @Query(value = "SELECT ngo_id FROM ngo_student_donations WHERE donation_id = :donationId LIMIT 1", nativeQuery = true)
    Integer findNgoIdByDonationId(@Param("donationId") Integer donationId);
}
