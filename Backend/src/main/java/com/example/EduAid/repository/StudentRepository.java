package com.example.EduAid.repository;

import com.example.EduAid.Entity.Student;
import com.example.EduAid.Entity.Student.ClassLevel;
import com.example.EduAid.Entity.Student.Gender;
import com.example.EduAid.Entity.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Integer> {

    // Find all students by school
    List<Student> findBySchool(School school);

    // Find students by class level
    List<Student> findByClassLevel(ClassLevel classLevel);

    // Find students by gender
    List<Student> findByGender(Gender gender);

    // Find students born after a specific date
    List<Student> findByDateOfBirthAfter(LocalDate date);

    // Find students with a specific father alive status
    List<Student> findByFatherAlive(Boolean fatherAlive);

    // Find by unique student ID number
    Optional<Student> findByStudentIdNumber(String studentIdNumber);

    // Example custom query: search by partial name
    @Query("SELECT s FROM Student s WHERE s.studentName LIKE %:name%")
    List<Student> searchByName(@Param("name") String name);

    // ✅ New: Find students by profile image URL
    Optional<Student> findByProfileImage(String profileImage);

    // ✅ New: Find students where profile image is not null (students with images)
    List<Student> findByProfileImageIsNotNull();
    
    // ✅ Count students by school ID
    @Query(value = "SELECT COUNT(*) FROM students WHERE school_id = :schoolId", nativeQuery = true)
    Long countStudentsBySchoolId(@Param("schoolId") Integer schoolId);

    // Find students sponsored by a specific donor
    @Query("SELECT DISTINCT d.student FROM Donation d WHERE d.donor.donorId = :donorId AND d.student IS NOT NULL")
    List<Student> findStudentsSponsoredByDonor(@Param("donorId") Integer donorId);

    // Native query to get students sponsored by donor with school info
    @Query(value = """
        SELECT DISTINCT 
            s.student_id,
            s.student_name,
            s.student_id_number,
            s.gender,
            s.date_of_birth,
            s.class_level,
            s.profile_image,
            s.family_monthly_income,
            s.has_scholarship,
            sch.school_name,
            sch.school_id
        FROM students s
        JOIN donations don ON s.student_id = don.student_id
        JOIN schools sch ON s.school_id = sch.school_id
        WHERE don.donor_id = :donorId 
        AND don.payment_status = 'COMPLETED'
        ORDER BY s.student_name
        """, nativeQuery = true)
    List<Object[]> findSponsoredStudentsWithSchoolByDonorId(@Param("donorId") Integer donorId);
    
    // Find high-risk student without scholarship for sponsorship using dropout predictions
    // Excludes students who received any completed sponsorship donations
    @Query(value = """
        SELECT s.* FROM students s 
        LEFT JOIN dropout_predictions dp ON s.student_id = dp.student_id 
        WHERE s.has_scholarship = false 
        AND dp.risk_status = 'HIGH'
        AND s.student_id NOT IN (
            SELECT DISTINCT d.student_id 
            FROM donations d 
            WHERE d.student_id IS NOT NULL 
            AND d.donation_type = 'STUDENT_SPONSORSHIP'
            AND d.payment_status = 'COMPLETED'
        )
        AND s.student_id NOT IN (
            SELECT DISTINCT nsd.student_id 
            FROM ngo_student_donations nsd 
            WHERE nsd.student_id IS NOT NULL 
            AND nsd.payment_status = 'COMPLETED'
        )
        ORDER BY s.family_monthly_income ASC 
        LIMIT 1
        """, nativeQuery = true)
    Optional<Student> findHighRiskStudentForSponsorship();
    
    // Find student with lowest family income without scholarship if no high-risk found
    // Excludes students who received any completed sponsorship donations
    @Query(value = """
        SELECT s.* FROM students s 
        WHERE s.has_scholarship = false 
        AND s.family_monthly_income IS NOT NULL
        AND s.student_id NOT IN (
            SELECT DISTINCT d.student_id 
            FROM donations d 
            WHERE d.student_id IS NOT NULL 
            AND d.donation_type = 'STUDENT_SPONSORSHIP'
            AND d.payment_status = 'COMPLETED'
        )
        AND s.student_id NOT IN (
            SELECT DISTINCT nsd.student_id 
            FROM ngo_student_donations nsd 
            WHERE nsd.student_id IS NOT NULL 
            AND nsd.payment_status = 'COMPLETED'
        )
        ORDER BY s.family_monthly_income ASC 
        LIMIT 1
        """, nativeQuery = true)
    Optional<Student> findNeedyStudentForSponsorship();
    
    // Find multiple high-risk students for sponsorship display
    // Excludes students who received any completed sponsorship donations
    @Query(value = """
        SELECT s.* FROM students s 
        LEFT JOIN dropout_predictions dp ON s.student_id = dp.student_id 
        WHERE s.has_scholarship = false 
        AND (dp.risk_status = 'HIGH' OR s.family_monthly_income < 15000)
        AND s.student_id NOT IN (
            SELECT DISTINCT d.student_id 
            FROM donations d 
            WHERE d.student_id IS NOT NULL 
            AND d.donation_type = 'STUDENT_SPONSORSHIP'
            AND d.payment_status = 'COMPLETED'
        )
        AND s.student_id NOT IN (
            SELECT DISTINCT nsd.student_id 
            FROM ngo_student_donations nsd 
            WHERE nsd.student_id IS NOT NULL 
            AND nsd.payment_status = 'COMPLETED'
        )
        ORDER BY 
            CASE WHEN dp.risk_status = 'HIGH' THEN 1 ELSE 2 END,
            s.family_monthly_income ASC 
        LIMIT :limit
        """, nativeQuery = true)
    List<Student> findHighRiskStudentsForSponsorship(@Param("limit") int limit);

    // Update scholarship status for students who received donations in current month
    @Modifying
    @Query(value = """
        UPDATE students 
        SET has_scholarship = CASE 
            WHEN student_id IN (
                SELECT DISTINCT student_id FROM (
                    SELECT d.student_id 
                    FROM donations d 
                    WHERE d.student_id IS NOT NULL 
                    AND d.payment_status = 'COMPLETED'
                    AND MONTH(d.payment_completed_at) = MONTH(CURRENT_DATE)
                    AND YEAR(d.payment_completed_at) = YEAR(CURRENT_DATE)
                    UNION
                    SELECT nsd.student_id 
                    FROM ngo_student_donations nsd 
                    WHERE nsd.student_id IS NOT NULL 
                    AND nsd.payment_status = 'COMPLETED'
                    AND MONTH(nsd.payment_completed_at) = MONTH(CURRENT_DATE)
                    AND YEAR(nsd.payment_completed_at) = YEAR(CURRENT_DATE)
                ) AS current_month_donations
            ) THEN 1 
            ELSE 0 
        END
        """, nativeQuery = true)
    void updateScholarshipStatus();

    // One-time fix: Update scholarship status for all students with any completed donations
    @Modifying
    @Query(value = """
        UPDATE students 
        SET has_scholarship = CASE 
            WHEN student_id IN (
                SELECT DISTINCT student_id FROM (
                    SELECT d.student_id 
                    FROM donations d 
                    WHERE d.student_id IS NOT NULL 
                    AND d.payment_status = 'COMPLETED'
                    UNION
                    SELECT nsd.student_id 
                    FROM ngo_student_donations nsd 
                    WHERE nsd.student_id IS NOT NULL 
                    AND nsd.payment_status = 'COMPLETED'
                ) AS all_donations
            ) THEN 1 
            ELSE 0 
        END
        """, nativeQuery = true)
    void fixExistingDonations();

    // Get scholarship status summary
    @Query(value = """
        SELECT 
            COUNT(*) as total_students,
            SUM(CASE WHEN has_scholarship = 1 THEN 1 ELSE 0 END) as students_with_scholarship,
            SUM(CASE WHEN has_scholarship = 0 THEN 1 ELSE 0 END) as students_without_scholarship
        FROM students
        """, nativeQuery = true)
    Object[] getScholarshipStatusSummary();

    // Update only profile image field to avoid constraint violations
    @Modifying
    @Query("UPDATE Student s SET s.profileImage = :profileImage WHERE s.studentId = :studentId")
    int updateStudentProfileImage(@Param("studentId") Integer studentId, @Param("profileImage") String profileImage);

}
