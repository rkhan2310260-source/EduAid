package com.example.EduAid.repository;

import com.example.EduAid.Entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Integer> {

    // Find donations by donor ID
    List<Donation> findByDonor_DonorId(Integer donorId);

    // Find donations by project ID
    List<Donation> findByProject_ProjectId(Integer projectId);

    // Find donations by student ID
    List<Donation> findByStudent_StudentId(Integer studentId);

    // Find donations by payment status
    List<Donation> findByPaymentStatus(Donation.PaymentStatus paymentStatus);

    // Custom query to get donor statistics
    @Query("SELECT SUM(d.amount) FROM Donation d WHERE d.donor.donorId = :donorId AND d.paymentStatus = 'COMPLETED'")
    BigDecimal getTotalDonatedByDonor(@Param("donorId") Integer donorId);
    
    // Count students sponsored by donor
    Long countByDonor_DonorIdAndStudentIsNotNullAndPaymentStatus(Integer donorId, Donation.PaymentStatus paymentStatus);
    
    // Count projects donated to by donor
    Long countByDonor_DonorIdAndProjectIsNotNullAndPaymentStatus(Integer donorId, Donation.PaymentStatus paymentStatus);
    
    // Count distinct projects donated to by donor
    @Query("SELECT COUNT(DISTINCT d.project.projectId) FROM Donation d WHERE d.donor.donorId = :donorId AND d.project IS NOT NULL AND d.paymentStatus = :paymentStatus")
    Long countDistinctProjectsByDonorAndPaymentStatus(@Param("donorId") Integer donorId, @Param("paymentStatus") Donation.PaymentStatus paymentStatus);
    
    // Count distinct students sponsored by donor (unique students only)
    @Query("SELECT COUNT(DISTINCT d.student.studentId) FROM Donation d WHERE d.donor.donorId = :donorId AND d.student IS NOT NULL AND d.paymentStatus = :paymentStatus")
    Long countDistinctStudentsByDonorAndPaymentStatus(@Param("donorId") Integer donorId, @Param("paymentStatus") Donation.PaymentStatus paymentStatus);

    // Find donations by donor ID ordered by date (recent first) with transaction details
    @Query(value = "SELECT d.donation_id, d.donor_id, d.project_id, d.student_id, d.amount, " +
           "d.donation_type, d.transaction_id, d.payment_status, d.purpose, d.donor_message, " +
           "d.is_anonymous, d.donated_at, d.payment_completed_at, d.created_at, d.updated_at, " +
           "COALESCE(pt.transaction_reference, CONCAT('TXN', LPAD(d.donation_id, 9, '0'))) as transaction_ref, " +
           "COALESCE(sp.project_title, s.student_name, 'General Donation') as project_name, " +
           "CASE " +
           "  WHEN d.student_id IS NOT NULL THEN CONCAT('Student: ', s.student_name) " +
           "  WHEN d.project_id IS NOT NULL THEN CONCAT('Project: ', sp.project_title) " +
           "  ELSE 'General Donation' " +
           "END as recipient_name " +
           "FROM donations d " +
           "LEFT JOIN payment_transactions pt ON d.transaction_id = pt.transaction_id " +
           "LEFT JOIN school_projects sp ON d.project_id = sp.project_id " +
           "LEFT JOIN students s ON d.student_id = s.student_id " +
           "WHERE d.donor_id = :donorId " +
           "ORDER BY COALESCE(d.donated_at, d.created_at) DESC", nativeQuery = true)
    List<Object[]> findDonationsByDonorWithDetailsOrderByDateDesc(@Param("donorId") Integer donorId);

    // Get recent donations RECEIVED by a specific school (through its students and projects)
    @Query(value = "SELECT d.donation_id, d.amount, d.payment_status, " +
           "COALESCE(d.donated_at, d.created_at) as donation_date, " +
           "COALESCE(pt.transaction_reference, CONCAT('TXN', LPAD(d.donation_id, 6, '0'))) as transaction_ref, " +
           "COALESCE(donor.donor_name, 'Anonymous Donor') as donor_name, " +
           "CASE " +
           "  WHEN d.student_id IS NOT NULL THEN CONCAT('Student: ', s.student_name) " +
           "  WHEN d.project_id IS NOT NULL THEN CONCAT('Project: ', sp.project_title) " +
           "  ELSE 'Unknown' " +
           "END as recipient_name " +
           "FROM donations d " +
           "LEFT JOIN payment_transactions pt ON d.transaction_id = pt.transaction_id " +
           "LEFT JOIN donors donor ON d.donor_id = donor.donor_id " +
           "LEFT JOIN students s ON d.student_id = s.student_id " +
           "LEFT JOIN school_projects sp ON d.project_id = sp.project_id " +
           "WHERE (s.school_id = :schoolId OR sp.school_id = :schoolId) " +
           "ORDER BY COALESCE(d.donated_at, d.created_at) DESC " +
           "LIMIT 5", nativeQuery = true)
    List<Object[]> findRecentDonationsReceivedBySchool(@Param("schoolId") Integer schoolId);

    // Get all donations RECEIVED by a specific school (for reporting page)
    @Query(value = "SELECT d.donation_id, d.amount, d.payment_status, " +
           "COALESCE(d.donated_at, d.created_at) as donation_date, " +
           "COALESCE(pt.transaction_reference, CONCAT('TXN', LPAD(d.donation_id, 6, '0'))) as transaction_ref, " +
           "COALESCE(donor.donor_name, 'Anonymous Donor') as donor_name, " +
           "CASE " +
           "  WHEN d.student_id IS NOT NULL THEN CONCAT('Student: ', s.student_name) " +
           "  WHEN d.project_id IS NOT NULL THEN CONCAT('Project: ', sp.project_title) " +
           "  ELSE 'Unknown' " +
           "END as recipient_name " +
           "FROM donations d " +
           "LEFT JOIN payment_transactions pt ON d.transaction_id = pt.transaction_id " +
           "LEFT JOIN donors donor ON d.donor_id = donor.donor_id " +
           "LEFT JOIN students s ON d.student_id = s.student_id " +
           "LEFT JOIN school_projects sp ON d.project_id = sp.project_id " +
           "WHERE (s.school_id = :schoolId OR sp.school_id = :schoolId) " +
           "ORDER BY COALESCE(d.donated_at, d.created_at) DESC", nativeQuery = true)
    List<Object[]> findAllDonationsReceivedBySchool(@Param("schoolId") Integer schoolId);

    // Get total donation amount by donor for specific project
    @Query(value = "SELECT COALESCE(SUM(d.amount), 0) FROM donations d " +
           "WHERE d.donor_id = :donorId AND d.project_id = :projectId " +
           "AND d.payment_status = 'COMPLETED'", nativeQuery = true)
    Double getTotalDonationByDonorForProject(@Param("donorId") Integer donorId, @Param("projectId") Integer projectId);

    // Find student IDs who received scholarships this month
    @Query(value = "SELECT DISTINCT d.student_id FROM donations d " +
           "WHERE d.student_id IS NOT NULL " +
           "AND d.purpose = 'STUDENT_SPONSORSHIP' " +
           "AND d.payment_status = 'COMPLETED' " +
           "AND YEAR(d.donated_at) = YEAR(CURDATE()) " +
           "AND MONTH(d.donated_at) = MONTH(CURDATE())", nativeQuery = true)
    List<Integer> findStudentIdsWithScholarshipThisMonth();
    
    // Find student IDs who received scholarships this month from ALL sources (donors + NGOs)
    @Query(value = "SELECT DISTINCT student_id FROM (" +
           "  SELECT d.student_id FROM donations d " +
           "  WHERE d.student_id IS NOT NULL " +
           "  AND d.purpose = 'STUDENT_SPONSORSHIP' " +
           "  AND d.payment_status = 'COMPLETED' " +
           "  AND YEAR(d.donated_at) = YEAR(CURDATE()) " +
           "  AND MONTH(d.donated_at) = MONTH(CURDATE()) " +
           "  UNION " +
           "  SELECT nsd.student_id FROM ngo_student_donations nsd " +
           "  WHERE nsd.student_id IS NOT NULL " +
           "  AND nsd.payment_status = 'COMPLETED' " +
           "  AND YEAR(nsd.donated_at) = YEAR(CURDATE()) " +
           "  AND MONTH(nsd.donated_at) = MONTH(CURDATE()) " +
           ") AS all_scholarships", nativeQuery = true)
    List<Integer> findAllStudentIdsWithScholarshipThisMonth();

    // Get all donations from all sources (donors + NGOs) for a specific school with proper details
    // Returns: donation_id, amount, payment_status, donated_at, transaction_ref, donor_name, project_title, student_name, donation_type, purpose, source
    @Query(value = "SELECT donation_id, amount, payment_status, donated_at, transaction_ref, " +
           "donor_name, project_title, student_name, donation_type, purpose, source FROM (" +
           "  SELECT d.donation_id, d.amount, d.payment_status, " +
           "  COALESCE(d.donated_at, d.created_at) as donated_at, " +
           "  COALESCE(pt.transaction_reference, CONCAT('DON', LPAD(d.donation_id, 6, '0'))) as transaction_ref, " +
           "  COALESCE(donor.donor_name, 'Anonymous Donor') as donor_name, " +
           "  sp.project_title, s.student_name, d.donation_type, d.purpose, 'donor' as source " +
           "  FROM donations d " +
           "  LEFT JOIN payment_transactions pt ON d.transaction_id = pt.transaction_id " +
           "  LEFT JOIN donors donor ON d.donor_id = donor.donor_id " +
           "  LEFT JOIN students s ON d.student_id = s.student_id " +
           "  LEFT JOIN school_projects sp ON d.project_id = sp.project_id " +
           "  WHERE (s.school_id = :schoolId OR sp.school_id = :schoolId) " +
           "  UNION ALL " +
           "  SELECT nsd.student_donation_id as donation_id, nsd.amount, " +
           "  nsd.payment_status, nsd.donated_at, " +
           "  CONCAT('NGOS', LPAD(nsd.student_donation_id, 6, '0')) as transaction_ref, " +
           "  COALESCE(n.ngo_name, 'NGO Donor') as donor_name, " +
           "  NULL as project_title, s.student_name, nsd.donation_type, " +
           "  'STUDENT_SPONSORSHIP' as purpose, 'ngo' as source " +
           "  FROM ngo_student_donations nsd " +
           "  LEFT JOIN ngos n ON nsd.ngo_id = n.ngo_id " +
           "  LEFT JOIN students s ON nsd.student_id = s.student_id " +
           "  WHERE s.school_id = :schoolId " +
           "  UNION ALL " +
           "  SELECT npd.project_donation_id as donation_id, npd.amount, " +
           "  npd.payment_status, npd.donated_at, " +
           "  CONCAT('NGOP', LPAD(npd.project_donation_id, 6, '0')) as transaction_ref, " +
           "  COALESCE(n.ngo_name, 'NGO Donor') as donor_name, " +
           "  sp.project_title, NULL as student_name, npd.donation_type, " +
           "  'SCHOOL_PROJECT' as purpose, 'ngo' as source " +
           "  FROM ngo_project_donations npd " +
           "  LEFT JOIN ngos n ON npd.ngo_id = n.ngo_id " +
           "  LEFT JOIN school_projects sp ON npd.project_id = sp.project_id " +
           "  WHERE sp.school_id = :schoolId " +
           ") AS all_donations " +
           "ORDER BY donated_at DESC", nativeQuery = true)
    List<Object[]> findAllDonationsFromAllSourcesBySchool(@Param("schoolId") Integer schoolId);

    // Get available donations for a project with remaining amounts (includes both donor and NGO donations)
    // Returns: donation_id, donor_name, amount, utilized_amount, remaining_amount, donated_at, source
    @Query(value = "SELECT donation_id, donor_name, amount, utilized_amount, remaining_amount, donated_at, source " +
           "FROM (" +
           "  SELECT d.donation_id, " +
           "  COALESCE(donor.donor_name, 'Anonymous') as donor_name, " +
           "  d.amount, " +
           "  COALESCE(SUM(fu.amount_used), 0) as utilized_amount, " +
           "  d.amount - COALESCE(SUM(fu.amount_used), 0) as remaining_amount, " +
           "  d.donated_at, " +
           "  'Donor' as source " +
           "  FROM donations d " +
           "  LEFT JOIN donors donor ON d.donor_id = donor.donor_id " +
           "  LEFT JOIN fund_utilization fu ON d.donation_id = fu.donation_id " +
           "  WHERE d.project_id = :projectId AND d.payment_status = 'COMPLETED' " +
           "  GROUP BY d.donation_id, donor.donor_name, d.amount, d.donated_at " +
           "  UNION ALL " +
           "  SELECT npd.project_donation_id as donation_id, " +
           "  COALESCE(n.ngo_name, 'NGO') as donor_name, " +
           "  npd.amount, " +
           "  COALESCE(SUM(fu.amount_used), 0) as utilized_amount, " +
           "  npd.amount - COALESCE(SUM(fu.amount_used), 0) as remaining_amount, " +
           "  npd.donated_at, " +
           "  'NGO' as source " +
           "  FROM ngo_project_donations npd " +
           "  LEFT JOIN ngos n ON npd.ngo_id = n.ngo_id " +
           "  LEFT JOIN fund_utilization fu ON npd.project_donation_id = fu.donation_id " +
           "  WHERE npd.project_id = :projectId AND npd.payment_status = 'COMPLETED' " +
           "  GROUP BY npd.project_donation_id, n.ngo_name, npd.amount, npd.donated_at " +
           ") AS all_available_donations " +
           "WHERE remaining_amount > 0 " +
           "ORDER BY remaining_amount DESC, donated_at DESC", nativeQuery = true)
    List<Object[]> findAvailableDonationsForProject(@Param("projectId") Integer projectId);
}