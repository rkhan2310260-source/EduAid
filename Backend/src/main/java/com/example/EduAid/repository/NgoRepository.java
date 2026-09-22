package com.example.EduAid.repository;

import com.example.EduAid.Entity.Ngo;
import com.example.EduAid.Entity.Ngo.VerificationStatus;
import com.example.EduAid.Entity.User;
// import com.example.EduAid.Entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NgoRepository extends JpaRepository<Ngo, Integer> {

    // Native query to get total amount donated by NGO directly from NGO donation tables
    @Query(value = "SELECT COALESCE(" +
           "  (SELECT SUM(amount) FROM ngo_student_donations WHERE ngo_id = :ngoId AND payment_status = 'COMPLETED') + " +
           "  (SELECT SUM(amount) FROM ngo_project_donations WHERE ngo_id = :ngoId AND payment_status = 'COMPLETED'), 0" +
           ")", 
           nativeQuery = true)
    Long getTotalDonatedByNgo(@Param("ngoId") Integer ngoId);
    
    // Native query to count unique students helped by NGO
    @Query(value = "SELECT COALESCE(COUNT(DISTINCT student_id), 0) " +
           "FROM ngo_student_donations " +
           "WHERE ngo_id = :ngoId AND payment_status = 'COMPLETED'", 
           nativeQuery = true)
    Long getStudentsHelpedByNgo(@Param("ngoId") Integer ngoId);
    
    // Native query to count total school projects available
    @Query(value = "SELECT COUNT(*) FROM school_projects", nativeQuery = true)
    Long getSchoolProjectsCount();
    
    // Native query to count schools reached through NGO donations
    @Query(value = "SELECT COALESCE(COUNT(DISTINCT school_id), 0) FROM (" +
           "  SELECT DISTINCT s.school_id " +
           "  FROM students st " +
           "  JOIN schools s ON st.school_id = s.school_id " +
           "  JOIN ngo_student_donations nsd ON st.student_id = nsd.student_id " +
           "  WHERE nsd.ngo_id = :ngoId AND nsd.payment_status = 'COMPLETED' " +
           "  UNION " +
           "  SELECT DISTINCT sp.school_id " +
           "  FROM school_projects sp " +
           "  JOIN ngo_project_donations npd ON sp.project_id = npd.project_id " +
           "  WHERE npd.ngo_id = :ngoId AND npd.payment_status = 'COMPLETED'" +
           ") AS combined_schools", 
           nativeQuery = true)
    Long getSchoolsReachedByNgo(@Param("ngoId") Integer ngoId);

}