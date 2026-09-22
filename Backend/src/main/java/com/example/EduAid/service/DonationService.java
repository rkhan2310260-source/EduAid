package com.example.EduAid.service;

import com.example.EduAid.Entity.*;
import com.example.EduAid.Dto.DonationDto;
import com.example.EduAid.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class DonationService {

    private final DonationRepository donationRepository;
    private final DonorRepository donorRepository;
    private final SchoolProjectRepository schoolProjectRepository;
    private final StudentRepository studentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final NgoGamificationService ngoGamificationService;
    private final NgoStudentDonationsRepository ngoStudentDonationsRepository;
    private final NgoProjectDonationsRepository ngoProjectDonationsRepository;
    private final StudentService studentService;
    private final ScholarshipStatusService scholarshipStatusService;

    public DonationService(DonationRepository donationRepository,
                           DonorRepository donorRepository,
                           SchoolProjectRepository schoolProjectRepository,
                           StudentRepository studentRepository,
                           PaymentTransactionRepository paymentTransactionRepository,
                           NgoGamificationService ngoGamificationService,
                           NgoStudentDonationsRepository ngoStudentDonationsRepository,
                           NgoProjectDonationsRepository ngoProjectDonationsRepository,
                           StudentService studentService,
                           ScholarshipStatusService scholarshipStatusService) {
        this.donationRepository = donationRepository;
        this.donorRepository = donorRepository;
        this.schoolProjectRepository = schoolProjectRepository;
        this.studentRepository = studentRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.ngoGamificationService = ngoGamificationService;
        this.ngoStudentDonationsRepository = ngoStudentDonationsRepository;
        this.ngoProjectDonationsRepository = ngoProjectDonationsRepository;
        this.studentService = studentService;
        this.scholarshipStatusService = scholarshipStatusService;
    }

    // Create or update Donation
    public DonationDto saveDonation(DonationDto donationDto) {
        Donor donor = donorRepository.findById(donationDto.getDonorId())
                .orElseThrow(() -> new RuntimeException("Donor not found"));

        SchoolProject project = null;
        if (donationDto.getProjectId() != null) {
            project = schoolProjectRepository.findById(donationDto.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found"));
        }

        Student student = null;
        if (donationDto.getStudentId() != null) {
            student = studentRepository.findById(donationDto.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));
        }

        PaymentTransaction transaction = null;
        if (donationDto.getTransactionId() != null) {
            transaction = paymentTransactionRepository.findById(donationDto.getTransactionId())
                    .orElse(null); // Make transaction optional
        }

        Donation donation;
        if (donationDto.getDonationId() != null && donationDto.getDonationId() > 0) {
            // Try to update existing donation, create new if not found
            donation = donationRepository.findById(donationDto.getDonationId())
                    .orElse(null);
            
            if (donation != null) {
                // Update existing donation
                donation.setDonor(donor);
                donation.setProject(project);
                donation.setStudent(student);
                donation.setAmount(donationDto.getAmount());
                donation.setDonationType(donationDto.getDonationType());
                donation.setTransaction(transaction);
                donation.setPaymentStatus(donationDto.getPaymentStatus() != null ?
                        donationDto.getPaymentStatus() : Donation.PaymentStatus.PENDING);
                donation.setPurpose(donationDto.getPurpose());
                donation.setDonorMessage(donationDto.getDonorMessage());
                donation.setIsAnonymous(donationDto.getIsAnonymous() != null ?
                        donationDto.getIsAnonymous() : false);
                donation.setDonatedAt(donationDto.getDonatedAt() != null ?
                        donationDto.getDonatedAt() : LocalDateTime.now());
                donation.setPaymentCompletedAt(donationDto.getPaymentCompletedAt());
            } else {
                // Create new donation if existing not found
                donation = Donation.builder()
                        .donor(donor)
                        .project(project)
                        .student(student)
                        .amount(donationDto.getAmount())
                        .donationType(donationDto.getDonationType())
                        .transaction(transaction)
                        .paymentStatus(donationDto.getPaymentStatus() != null ?
                                donationDto.getPaymentStatus() : Donation.PaymentStatus.PENDING)
                        .purpose(donationDto.getPurpose())
                        .donorMessage(donationDto.getDonorMessage())
                        .isAnonymous(donationDto.getIsAnonymous() != null ?
                                donationDto.getIsAnonymous() : false)
                        .donatedAt(donationDto.getDonatedAt() != null ?
                                donationDto.getDonatedAt() : LocalDateTime.now())
                        .paymentCompletedAt(donationDto.getPaymentCompletedAt())
                        .build();
            }
        } else {
            // Create new donation
            donation = Donation.builder()
                    .donor(donor)
                    .project(project)
                    .student(student)
                    .amount(donationDto.getAmount())
                    .donationType(donationDto.getDonationType())
                    .transaction(transaction)
                    .paymentStatus(donationDto.getPaymentStatus() != null ?
                            donationDto.getPaymentStatus() : Donation.PaymentStatus.PENDING)
                    .purpose(donationDto.getPurpose())
                    .donorMessage(donationDto.getDonorMessage())
                    .isAnonymous(donationDto.getIsAnonymous() != null ?
                            donationDto.getIsAnonymous() : false)
                    .donatedAt(donationDto.getDonatedAt() != null ?
                            donationDto.getDonatedAt() : LocalDateTime.now())
                    .paymentCompletedAt(donationDto.getPaymentCompletedAt())
                    .build();
        }

        Donation saved = donationRepository.save(donation);
        
        // Mark student as sponsored if this is a completed student sponsorship
        if (saved.getPaymentStatus() == Donation.PaymentStatus.COMPLETED && 
            saved.getStudent() != null && 
            saved.getPurpose() == Donation.DonationPurpose.STUDENT_SPONSORSHIP) {
            try {
                System.out.println("Marking student " + saved.getStudent().getStudentId() + " as sponsored after completed donation");
                studentService.markStudentAsSponsored(saved.getStudent().getStudentId());
                // Update scholarship status for all students after donation completion
                scholarshipStatusService.updateScholarshipStatus();
            } catch (Exception e) {
                System.err.println("Failed to mark student as sponsored: " + e.getMessage());
            }
        }
        
        // Update NGO gamification if this is an NGO donation
        updateNgoGamificationIfNeeded(saved);
        
        return mapToDto(saved);
    }

    // Get all donations
    public List<DonationDto> getAllDonations() {
        return donationRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // Get donation by ID
    public DonationDto getDonationById(Integer donationId) {
        return donationRepository.findById(donationId)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Donation not found"));
    }

    // Delete donation
    public void deleteDonation(Integer donationId) {
        if (!donationRepository.existsById(donationId)) {
            throw new RuntimeException("Donation not found");
        }
        donationRepository.deleteById(donationId);
    }

    // Update payment status
    public DonationDto updatePaymentStatus(Integer donationId, Donation.PaymentStatus paymentStatus) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new RuntimeException("Donation not found"));

        donation.setPaymentStatus(paymentStatus);
        if (paymentStatus == Donation.PaymentStatus.COMPLETED) {
            donation.setPaymentCompletedAt(LocalDateTime.now());
        }

        Donation saved = donationRepository.save(donation);
        
        // Mark student as sponsored if this is a completed student sponsorship
        if (paymentStatus == Donation.PaymentStatus.COMPLETED && 
            saved.getStudent() != null && 
            saved.getPurpose() == Donation.DonationPurpose.STUDENT_SPONSORSHIP) {
            try {
                System.out.println("Marking student " + saved.getStudent().getStudentId() + " as sponsored after payment completion");
                studentService.markStudentAsSponsored(saved.getStudent().getStudentId());
                // Update scholarship status for all students after payment completion
                scholarshipStatusService.updateScholarshipStatus();
            } catch (Exception e) {
                System.err.println("Failed to mark student as sponsored: " + e.getMessage());
            }
        }
        
        // Update NGO gamification if payment completed
        if (paymentStatus == Donation.PaymentStatus.COMPLETED) {
            updateNgoGamificationIfNeeded(saved);
        }
        
        return mapToDto(saved);
    }

    // Complete payment
    public DonationDto completePayment(Integer donationId) {
        return updatePaymentStatus(donationId, Donation.PaymentStatus.COMPLETED);
    }

    // Fail payment
    public DonationDto failPayment(Integer donationId) {
        return updatePaymentStatus(donationId, Donation.PaymentStatus.FAILED);
    }

    // Get donations by donor ID
    public List<DonationDto> getDonationsByDonor(Integer donorId) {
        return donationRepository.findByDonor_DonorId(donorId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // Get donations by donor ID with transaction details and proper ordering (recent first)
    public List<DonationDto> getDonationsByDonorWithDetails(Integer donorId) {
        List<Object[]> results = donationRepository.findDonationsByDonorWithDetailsOrderByDateDesc(donorId);
        return results.stream()
                .map(this::mapResultToDto)
                .collect(Collectors.toList());
    }

    // Map Donation entity to DTO
    private DonationDto mapToDto(Donation donation) {
        return DonationDto.builder()
                .donationId(donation.getDonationId())
                .donorId(donation.getDonor().getDonorId())
                .projectId(donation.getProject() != null ? donation.getProject().getProjectId() : null)
                .studentId(donation.getStudent() != null ? donation.getStudent().getStudentId() : null)
                .amount(donation.getAmount())
                .donationType(donation.getDonationType())
                .transactionId(donation.getTransaction() != null ? donation.getTransaction().getTransactionId() : null)
                .paymentStatus(donation.getPaymentStatus())
                .purpose(donation.getPurpose())
                .donorMessage(donation.getDonorMessage())
                .isAnonymous(donation.getIsAnonymous())
                .donatedAt(donation.getDonatedAt())
                .paymentCompletedAt(donation.getPaymentCompletedAt())
                .createdAt(donation.getCreatedAt())
                .updatedAt(donation.getUpdatedAt())
                .build();
    }

    // Map native query result to DTO with transaction and project details
    private DonationDto mapResultToDto(Object[] result) {
        return DonationDto.builder()
                .donationId((Integer) result[0])
                .donorId((Integer) result[1])
                .projectId((Integer) result[2])
                .studentId((Integer) result[3])
                .amount(result[4] != null ? new BigDecimal(result[4].toString()) : null)
                .donationType(result[5] != null ? Donation.DonationType.valueOf((String) result[5]) : null)
                .transactionId((Integer) result[6])
                .paymentStatus(result[7] != null ? Donation.PaymentStatus.valueOf((String) result[7]) : Donation.PaymentStatus.PENDING)
                .purpose(result[8] != null ? Donation.DonationPurpose.valueOf((String) result[8]) : null)
                .donorMessage((String) result[9])
                .isAnonymous((Boolean) result[10])
                .donatedAt(result[11] != null ? ((java.sql.Timestamp) result[11]).toLocalDateTime() : null)
                .paymentCompletedAt(result[12] != null ? ((java.sql.Timestamp) result[12]).toLocalDateTime() : null)
                .createdAt(result[13] != null ? ((java.sql.Timestamp) result[13]).toLocalDateTime() : null)
                .updatedAt(result[14] != null ? ((java.sql.Timestamp) result[14]).toLocalDateTime() : null)
                .transactionRef((String) result[15]) // Transaction reference from native query
                .projectName((String) result[16]) // Project name from native query
                .recipientName((String) result[17]) // Recipient name from native query
                .build();
    }

    // Get recent donations RECEIVED by a specific school using native query
    public List<DonationDto> getRecentDonationsBySchool(Integer schoolId) {
        List<Object[]> results = donationRepository.findRecentDonationsReceivedBySchool(schoolId);
        return results.stream()
                .map(this::mapSchoolDonationResultToDto)
                .collect(Collectors.toList());
    }

    // Get all donations RECEIVED by a specific school using native query
    public List<DonationDto> getAllDonationsBySchool(Integer schoolId) {
        List<Object[]> results = donationRepository.findAllDonationsReceivedBySchool(schoolId);
        return results.stream()
                .map(this::mapSchoolDonationResultToDto)
                .collect(Collectors.toList());
    }

    // Map school donation native query result to DTO
    private DonationDto mapSchoolDonationResultToDto(Object[] result) {
        return DonationDto.builder()
                .donationId((Integer) result[0])
                .amount(result[1] != null ? new BigDecimal(result[1].toString()) : BigDecimal.ZERO)
                .paymentStatus(result[2] != null ? Donation.PaymentStatus.valueOf((String) result[2]) : Donation.PaymentStatus.PENDING)
                .donatedAt(result[3] != null ? ((java.sql.Timestamp) result[3]).toLocalDateTime() : null)
                .transactionRef((String) result[4])
                .donorName((String) result[5])
                .recipientName((String) result[6])
                .build();
    }

    // Get total donation amount by donor for specific project
    public Double getTotalDonationByDonorForProject(Integer donorId, Integer projectId) {
        return donationRepository.getTotalDonationByDonorForProject(donorId, projectId);
    }
    
    // Update NGO gamification if this donation is from an NGO
    private void updateNgoGamificationIfNeeded(Donation donation) {
        // NGO donations are handled separately through NgoStudentDonationsService and NgoProjectDonationsService
        // This method is kept for potential future use but currently not needed
        // since NGO donations don't go through the main donations table directly
    }

    // Get all donations from all sources (donors + NGOs) for a specific school
    public List<DonationDto> getAllDonationsFromAllSources(Integer schoolId) {
        List<Object[]> results = donationRepository.findAllDonationsFromAllSourcesBySchool(schoolId);
        return results.stream()
                .map(this::mapAllSourcesDonationResultToDto)
                .collect(Collectors.toList());
    }

    // Get school reporting statistics using existing methods
    public Map<String, Object> getSchoolReportingStats(Integer schoolId) {
        Map<String, Object> stats = new HashMap<>();
        
        // Get basic donation statistics from existing methods
        List<DonationDto> allDonations = getAllDonationsBySchool(schoolId);
        double totalReceived = allDonations.stream()
                .filter(d -> d.getPaymentStatus() == Donation.PaymentStatus.COMPLETED)
                .mapToDouble(d -> d.getAmount().doubleValue())
                .sum();
        
        stats.put("totalReceived", totalReceived);
        stats.put("totalDonations", allDonations.size());
        stats.put("completedAmount", totalReceived);
        
        // Basic placeholder values for other stats
        stats.put("totalStudents", 0);
        stats.put("highRiskStudents", 0);
        stats.put("totalProjects", 0);
        stats.put("purposeBreakdown", new HashMap<String, Double>());
        
        return stats;
    }

    // Map all sources donation native query result to DTO
    private DonationDto mapAllSourcesDonationResultToDto(Object[] result) {
        return DonationDto.builder()
                .donationId((Integer) result[0])
                .amount(result[1] != null ? new BigDecimal(result[1].toString()) : BigDecimal.ZERO)
                .paymentStatus(result[2] != null ? Donation.PaymentStatus.valueOf((String) result[2]) : Donation.PaymentStatus.COMPLETED)
                .donatedAt(result[3] != null ? ((java.sql.Timestamp) result[3]).toLocalDateTime() : null)
                .transactionRef((String) result[4])
                .donorName((String) result[5])
                .projectTitle((String) result[6])
                .studentName((String) result[7])
                .donationType(result[8] != null ? Donation.DonationType.valueOf((String) result[8]) : null)
                .purpose(result[9] != null ? Donation.DonationPurpose.valueOf((String) result[9]) : null)
                .source((String) result[10])
                .build();
    }

    // Get available donations for a project with remaining amounts calculated dynamically
    public List<com.example.EduAid.Dto.AvailableDonationDto> getAvailableDonationsForProject(Integer projectId) {
        List<Object[]> results = donationRepository.findAvailableDonationsForProject(projectId);
        return results.stream()
                .map(this::mapToAvailableDonationDto)
                .collect(Collectors.toList());
    }

    // Map native query result to AvailableDonationDto
    // Query returns: donation_id, donor_name, amount, utilized_amount, remaining_amount, donated_at, source
    private com.example.EduAid.Dto.AvailableDonationDto mapToAvailableDonationDto(Object[] result) {
        return com.example.EduAid.Dto.AvailableDonationDto.builder()
                .donationId((Integer) result[0])
                .donorName((String) result[1])
                .amount(result[2] != null ? new BigDecimal(result[2].toString()) : BigDecimal.ZERO)
                .utilizedAmount(result[3] != null ? new BigDecimal(result[3].toString()) : BigDecimal.ZERO)
                .remainingAmount(result[4] != null ? new BigDecimal(result[4].toString()) : BigDecimal.ZERO)
                .donatedAt(result[5] != null ? ((java.sql.Timestamp) result[5]).toLocalDateTime() : null)
                .source((String) result[6])
                .build();
    }

    // AI FIX: Get all donations for a specific project (for analytics)
    public List<DonationDto> getDonationsByProject(Integer projectId) {
        List<Donation> donations = donationRepository.findAll();
        return donations.stream()
                .filter(d -> d.getProject() != null && d.getProject().getProjectId().equals(projectId))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
}
