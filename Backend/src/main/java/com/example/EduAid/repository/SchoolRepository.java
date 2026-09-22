package com.example.EduAid.repository;

import com.example.EduAid.Entity.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolRepository extends JpaRepository<School, Integer> {

    Optional<School> findByRegistrationNumber(String registrationNumber);

    List<School> findBySchoolNameContainingIgnoreCase(String name);

    List<School> findByStatus(School.SchoolStatus status);

    List<School> findByVerificationStatus(School.VerificationStatus verificationStatus);

    List<School> findBySchoolType(School.SchoolType schoolType);

    @Query("SELECT s FROM School s WHERE s.division.divisionId = :divisionId")
    List<School> findByDivisionId(@Param("divisionId") Integer divisionId);

    @Query("SELECT s FROM School s WHERE s.district.districtId = :districtId")
    List<School> findByDistrictId(@Param("districtId") Integer districtId);

    @Query("SELECT s FROM School s WHERE s.upazila.upazilaId = :upazilaId")
    List<School> findByUpazilaId(@Param("upazilaId") Integer upazilaId);

    @Query("SELECT s FROM School s WHERE s.verificationStatus = :status AND s.status = :schoolStatus")
    List<School> findByVerificationStatusAndStatus(
            @Param("status") School.VerificationStatus verificationStatus,
            @Param("schoolStatus") School.SchoolStatus schoolStatus
    );

    Optional<School> findByUser_UserId(Integer userId);

    boolean existsByRegistrationNumber(String registrationNumber);

    // AI FIX: Calculate total funds received from all donation sources using native SQL
    @Query(value = """
        SELECT COALESCE(
            (SELECT SUM(d.amount) FROM donations d 
             JOIN school_projects sp ON d.project_id = sp.project_id 
             WHERE sp.school_id = :schoolId AND d.payment_status = 'COMPLETED') +
            (SELECT SUM(npd.amount) FROM ngo_project_donations npd 
             JOIN school_projects sp ON npd.project_id = sp.project_id 
             WHERE sp.school_id = :schoolId AND npd.payment_status = 'COMPLETED') +
            (SELECT SUM(nsd.amount) FROM ngo_student_donations nsd 
             JOIN students s ON nsd.student_id = s.student_id 
             WHERE s.school_id = :schoolId AND nsd.payment_status = 'COMPLETED'),
            0.0
        ) as total_funds
        """, nativeQuery = true)
    Double getTotalFundsReceivedBySchool(@Param("schoolId") Integer schoolId);
}