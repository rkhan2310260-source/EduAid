package com.example.EduAid.repository;

import com.example.EduAid.Entity.SchoolProject;
import com.example.EduAid.Entity.School;
import com.example.EduAid.Entity.User;
import com.example.EduAid.Entity.ProjectType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchoolProjectRepository extends JpaRepository<SchoolProject, Integer> {

    @Query("SELECT sp FROM SchoolProject sp JOIN FETCH sp.projectType WHERE sp.projectId = :projectId")
    SchoolProject findByIdWithProjectType(@Param("projectId") Integer projectId);
    
    @Query("SELECT sp FROM SchoolProject sp JOIN FETCH sp.projectType")
    List<SchoolProject> findAllWithProjectType();
    
    @Query(value = "SELECT COALESCE(pu.progress_percentage, 0.0) FROM project_updates pu WHERE pu.project_id = :projectId AND pu.progress_percentage IS NOT NULL ORDER BY pu.created_at DESC LIMIT 1", nativeQuery = true)
    Double getLatestCompletionRate(@Param("projectId") Integer projectId);
    
    // Get total raised amount for a project (includes both donor and NGO donations)
    @Query(value = "SELECT COALESCE(SUM(amount), 0.0) FROM (" +
           "  SELECT d.amount FROM donations d " +
           "  WHERE d.project_id = :projectId AND d.payment_status = 'COMPLETED' " +
           "  UNION ALL " +
           "  SELECT npd.amount FROM ngo_project_donations npd " +
           "  WHERE npd.project_id = :projectId AND npd.payment_status = 'COMPLETED' " +
           ") AS all_donations", nativeQuery = true)
    java.math.BigDecimal getTotalRaisedAmount(@Param("projectId") Integer projectId);
    
    // Get total funds received for all projects of a school (includes both donor and NGO donations)
    @Query(value = "SELECT COALESCE(SUM(amount), 0.0) FROM (" +
           "  SELECT d.amount FROM donations d " +
           "  JOIN school_projects sp ON d.project_id = sp.project_id " +
           "  WHERE sp.school_id = :schoolId AND d.payment_status = 'COMPLETED' " +
           "  UNION ALL " +
           "  SELECT npd.amount FROM ngo_project_donations npd " +
           "  JOIN school_projects sp ON npd.project_id = sp.project_id " +
           "  WHERE sp.school_id = :schoolId AND npd.payment_status = 'COMPLETED' " +
           ") AS all_school_donations", nativeQuery = true)
    java.math.BigDecimal getTotalFundsReceivedBySchool(@Param("schoolId") Integer schoolId);
    
    // Get total funds utilized for all projects of a school (from fund_utilization.amount_used)
    @Query(value = "SELECT COALESCE(SUM(fu.amount_used), 0.0) FROM fund_utilization fu " +
           "JOIN school_projects sp ON fu.project_id = sp.project_id " +
           "WHERE sp.school_id = :schoolId", nativeQuery = true)
    java.math.BigDecimal getTotalFundsUtilizedBySchool(@Param("schoolId") Integer schoolId);

    // Comprehensive filtering query for donor dashboard (includes both donor and NGO donations)
    @Query(value = """
        SELECT sp.*, pt.type_name, s.school_name,
               COALESCE(total_raised.raised_amount, 0) as raised_amount,
               CASE 
                   WHEN sp.required_amount > 0 THEN (COALESCE(total_raised.raised_amount, 0) / sp.required_amount) * 100
                   ELSE 0
               END as funding_percentage
        FROM school_projects sp
        LEFT JOIN project_types pt ON sp.project_type_id = pt.project_type_id
        LEFT JOIN schools s ON sp.school_id = s.school_id
        LEFT JOIN (
            SELECT project_id, SUM(amount) as raised_amount FROM (
                SELECT project_id, amount FROM donations WHERE payment_status = 'COMPLETED'
                UNION ALL
                SELECT project_id, amount FROM ngo_project_donations WHERE payment_status = 'COMPLETED'
            ) AS all_donations
            GROUP BY project_id
        ) AS total_raised ON sp.project_id = total_raised.project_id
        WHERE (:search IS NULL OR 
               LOWER(sp.project_title) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(sp.project_description) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(s.school_name) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:type IS NULL OR pt.type_name = :type)
        HAVING (:funding IS NULL OR
                (:funding = 'low' AND funding_percentage <= 25) OR
                (:funding = 'medium' AND funding_percentage > 25 AND funding_percentage <= 75) OR
                (:funding = 'high' AND funding_percentage > 75))
        ORDER BY sp.created_at DESC
        """, nativeQuery = true)
    List<SchoolProject> findFilteredProjects(@Param("search") String search, 
                                           @Param("type") String type, 
                                           @Param("funding") String funding);

}