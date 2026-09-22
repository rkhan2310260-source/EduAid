package com.example.EduAid.repository;

import com.example.EduAid.Entity.NgoProjectDonations;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NgoProjectDonationsRepository extends JpaRepository<NgoProjectDonations, Integer> {

    // Find all donations by a specific project
    @Query(value = "SELECT * FROM ngo_project_donations WHERE project_id = :projectId", nativeQuery = true)
    List<NgoProjectDonations> findByProjectId(@Param("projectId") Integer projectId);

    // Find all donations by a specific NGO
    @Query(value = "SELECT * FROM ngo_project_donations WHERE ngo_id = :ngoId", nativeQuery = true)
    List<NgoProjectDonations> findByNgoId(@Param("ngoId") Integer ngoId);

    // Find donations by payment status
    @Query(value = "SELECT * FROM ngo_project_donations WHERE payment_status = :status", nativeQuery = true)
    List<NgoProjectDonations> findByPaymentStatus(@Param("status") String status);

    // Find donations within a specific date range
    @Query(value = "SELECT * FROM ngo_project_donations WHERE donated_at BETWEEN :startDate AND :endDate", nativeQuery = true)
    List<NgoProjectDonations> findByDonatedAtBetween(@Param("startDate") String startDate, @Param("endDate") String endDate);

    // Get total amount donated by NGO for a specific project
    @Query(value = "SELECT COALESCE(SUM(amount), 0) FROM ngo_project_donations WHERE ngo_id = :ngoId AND project_id = :projectId AND payment_status = 'COMPLETED'", nativeQuery = true)
    Double getNgoTotalForProject(@Param("ngoId") Integer ngoId, @Param("projectId") Integer projectId);
    
    // Find NGO ID by donation ID
    @Query(value = "SELECT ngo_id FROM ngo_project_donations WHERE donation_id = :donationId LIMIT 1", nativeQuery = true)
    Integer findNgoIdByDonationId(@Param("donationId") Integer donationId);
}
