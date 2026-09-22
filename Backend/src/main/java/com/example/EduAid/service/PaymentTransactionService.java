package com.example.EduAid.service;

import com.example.EduAid.Entity.Donor;
import com.example.EduAid.Entity.DonorGamification;
import com.example.EduAid.Entity.Ngo;
import com.example.EduAid.Entity.PaymentTransaction;
import com.example.EduAid.Entity.Donation;
import com.example.EduAid.Dto.PaymentTransactionDto;
import com.example.EduAid.Dto.DonationDto;
import com.example.EduAid.repository.DonorGamificationRepository;
import com.example.EduAid.repository.DonorRepository;
import com.example.EduAid.repository.NgoRepository;
import com.example.EduAid.repository.PaymentTransactionRepository;
import com.example.EduAid.repository.DonationRepository;
import com.example.EduAid.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentTransactionService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final DonorRepository donorRepository;
    private final NgoRepository ngoRepository;
    private final DonorGamificationRepository gamificationRepository;
    private final DonationService donationService;
    private final StudentService studentService;
    private final DonationRepository donationRepository;
    private final StudentRepository studentRepository;
    private final NgoProjectDonationsService ngoProjectDonationsService;
    private final NgoStudentDonationsService ngoStudentDonationsService;
    
    @Value("${sslcommerz.store.id}")
    private String storeId;
    
    @Value("${sslcommerz.store.password}")
    private String storePassword;
    
    @Value("${sslcommerz.sandbox.url}")
    private String sandboxUrl;
    
    @Value("${sslcommerz.success.url}")
    private String successUrl;
    
    @Value("${sslcommerz.fail.url}")
    private String failUrl;
    
    @Value("${sslcommerz.cancel.url}")
    private String cancelUrl;
    
    @Value("${sslcommerz.ipn.url}")
    private String ipnUrl;

    // Create
    public PaymentTransactionDto create(PaymentTransactionDto dto) {
        Donor donor = dto.getDonorId() != null 
                ? donorRepository.findById(dto.getDonorId()).orElse(null) 
                : null;
        Ngo ngo = dto.getNgoId() != null 
                ? ngoRepository.findById(dto.getNgoId()).orElse(null) 
                : null;

        PaymentTransaction transaction = PaymentTransaction.builder()
                .donor(donor)
                .ngo(ngo)
                .transactionReference(dto.getTransactionReference())
                .amount(dto.getAmount())
                .currency(dto.getCurrency())
                .transactionType(dto.getTransactionType())
                .paymentMethod(dto.getPaymentMethod())
                .status(dto.getStatus())
                .gatewayResponseCode(dto.getGatewayResponseCode())
                .gatewayResponseMessage(dto.getGatewayResponseMessage())
                .customerName(dto.getCustomerName())
                .customerEmail(dto.getCustomerEmail())
                .customerPhone(dto.getCustomerPhone())
                .initiatedAt(dto.getInitiatedAt())
                .completedAt(dto.getCompletedAt())
                .build();

        return toDTO(paymentTransactionRepository.save(transaction));
    }

    // Get all
    public List<PaymentTransactionDto> getAll() {
        return paymentTransactionRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Get by ID
    public PaymentTransactionDto getById(Integer id) {
        return paymentTransactionRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow();
    }

    // Update
    public PaymentTransactionDto update(Integer id, PaymentTransactionDto dto) {
        PaymentTransaction transaction = paymentTransactionRepository.findById(id).orElseThrow();

        transaction.setTransactionReference(dto.getTransactionReference());
        transaction.setAmount(dto.getAmount());
        transaction.setCurrency(dto.getCurrency());
        transaction.setTransactionType(dto.getTransactionType());
        transaction.setPaymentMethod(dto.getPaymentMethod());
        transaction.setStatus(dto.getStatus());
        transaction.setGatewayResponseCode(dto.getGatewayResponseCode());
        transaction.setGatewayResponseMessage(dto.getGatewayResponseMessage());
        transaction.setCustomerName(dto.getCustomerName());
        transaction.setCustomerEmail(dto.getCustomerEmail());
        transaction.setCustomerPhone(dto.getCustomerPhone());
        transaction.setInitiatedAt(dto.getInitiatedAt());
        transaction.setCompletedAt(dto.getCompletedAt());

        return toDTO(paymentTransactionRepository.save(transaction));
    }

    // Delete
    public void delete(Integer id) {
        paymentTransactionRepository.deleteById(id);
    }

    // Mapper
    private PaymentTransactionDto toDTO(PaymentTransaction transaction) {
        return PaymentTransactionDto.builder()
                .transactionId(transaction.getTransactionId())
                .donorId(transaction.getDonor() != null ? transaction.getDonor().getDonorId() : null)
                .ngoId(transaction.getNgo() != null ? transaction.getNgo().getNgoId() : null)
                .transactionReference(transaction.getTransactionReference())
                .amount(transaction.getAmount())
                .currency(transaction.getCurrency())
                .transactionType(transaction.getTransactionType())
                .paymentMethod(transaction.getPaymentMethod())
                .status(transaction.getStatus())
                .gatewayResponseCode(transaction.getGatewayResponseCode())
                .gatewayResponseMessage(transaction.getGatewayResponseMessage())
                .customerName(transaction.getCustomerName())
                .customerEmail(transaction.getCustomerEmail())
                .customerPhone(transaction.getCustomerPhone())
                .initiatedAt(transaction.getInitiatedAt())
                .completedAt(transaction.getCompletedAt())
                .build();
    }
    
    // SSLCommerz Integration Methods
    public Map<String, Object> initiateSSLCommerzPayment(Integer donorId, Integer ngoId, BigDecimal amount, 
                                                        String productName, String productCategory,
                                                        Integer projectId, Integer studentId) {
        try {
            System.out.println("Initiating payment for donorId: " + donorId + ", ngoId: " + ngoId);
            
            Donor donor = null;
            Ngo ngo = null;
            String customerName;
            String customerEmail;
            String customerPhone;
            
            if (donorId != null) {
                donor = donorRepository.findById(donorId)
                        .orElseThrow(() -> new RuntimeException("Donor not found with ID: " + donorId));
                customerName = donor.getDonorName();
                customerEmail = donor.getUser().getEmail();
                customerPhone = donor.getUser().getUserProfile() != null ? donor.getUser().getUserProfile().getPhone() : null;
                System.out.println("Donor found: " + donor.getDonorName());
            } else if (ngoId != null) {
                ngo = ngoRepository.findById(ngoId)
                        .orElseThrow(() -> new RuntimeException("NGO not found with ID: " + ngoId));
                customerName = ngo.getNgoName();
                customerEmail = ngo.getUser().getEmail();
                customerPhone = ngo.getUser().getUserProfile() != null ? ngo.getUser().getUserProfile().getPhone() : null;
                System.out.println("NGO found: " + ngo.getNgoName());
            } else {
                throw new RuntimeException("Either donorId or ngoId must be provided");
            }
            
            String transactionRef = "TXN_" + UUID.randomUUID().toString().substring(0, 8);
            System.out.println("Generated transaction reference: " + transactionRef);
            
            // Create transaction record
            PaymentTransaction transaction = PaymentTransaction.builder()
                    .donor(donor)
                    .ngo(ngo)
                    .transactionReference(transactionRef)
                    .amount(amount)
                    .currency("BDT")
                    .transactionType(PaymentTransaction.TransactionType.DONATION)
                    .paymentMethod(PaymentTransaction.PaymentMethod.CARD)
                    .status(PaymentTransaction.TransactionStatus.PENDING)
                    .customerName(customerName)
                    .customerEmail(customerEmail)
                    .customerPhone(customerPhone)
                    .productName(productName)
                    .productCategory(productCategory != null ? productCategory : "Donation")
                    .sessionKey("") // Initialize with empty string to avoid null constraint
                    .initiatedAt(LocalDateTime.now())
                    .build();
            
            // Store project/student IDs in transaction for later use
            if (projectId != null) {
                transaction.setProductName(productName + " (Project ID: " + projectId + ")");
            }
            if (studentId != null) {
                transaction.setProductName(productName + " (Student ID: " + studentId + ")");
            }
            
            PaymentTransaction savedTransaction = paymentTransactionRepository.save(transaction);
            System.out.println("Transaction saved with ID: " + savedTransaction.getTransactionId());
            
            // Prepare SSLCommerz request
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("store_id", storeId);
            params.add("store_passwd", storePassword);
            params.add("total_amount", amount.toString());
            params.add("currency", "BDT");
            params.add("tran_id", transactionRef);
            params.add("success_url", successUrl);
            params.add("fail_url", failUrl);
            params.add("cancel_url", cancelUrl);
            params.add("ipn_url", ipnUrl);
            params.add("cus_name", customerName);
            params.add("cus_email", customerEmail);
            params.add("cus_add1", "Dhaka");
            params.add("cus_city", "Dhaka");
            params.add("cus_country", "Bangladesh");
            params.add("cus_phone", customerPhone != null ? customerPhone : "01700000000");
            params.add("product_name", productName);
            params.add("product_category", productCategory != null ? productCategory : "Donation");
            params.add("product_profile", "general");
            params.add("shipping_method", "NO");
            params.add("num_of_item", "1");
            params.add("product_amount", amount.toString());
            
            // Call SSLCommerz API
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(sandboxUrl, entity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String status = (String) responseBody.get("status");
                
                if ("SUCCESS".equals(status)) {
                    String sessionKey = (String) responseBody.get("sessionkey");
                    String gatewayPageURL = (String) responseBody.get("GatewayPageURL");
                    
                    // Update transaction with session key
                    savedTransaction.setSessionKey(sessionKey);
                    paymentTransactionRepository.save(savedTransaction);
                    
                    return Map.of(
                        "status", "SUCCESS",
                        "message", "Payment initiated successfully",
                        "paymentUrl", gatewayPageURL,
                        "transactionId", savedTransaction.getTransactionId(),
                        "transactionReference", transactionRef,
                        "sessionKey", sessionKey
                    );
                } else {
                    // Return SSLCommerz error details
                    String failedReason = (String) responseBody.get("failedreason");
                    return Map.of(
                        "status", "FAILED",
                        "message", "SSLCommerz Error: " + (failedReason != null ? failedReason : "Unknown error"),
                        "transactionId", savedTransaction.getTransactionId(),
                        "sslcommerzResponse", responseBody
                    );
                }
            }
            
            return Map.of(
                "status", "FAILED",
                "message", "No response from SSLCommerz or HTTP error: " + response.getStatusCode(),
                "transactionId", savedTransaction.getTransactionId()
            );
            
        } catch (Exception e) {
            System.err.println("Payment initiation error: " + e.getMessage());
            e.printStackTrace();
            return Map.of(
                "status", "ERROR",
                "message", "Error initiating payment: " + e.getMessage()
            );
        }
    }
    
    public PaymentTransaction getByTransactionReference(String transactionReference) {
        return paymentTransactionRepository.findByTransactionReference(transactionReference).orElse(null);
    }
    
    public void updatePaymentStatus(String transactionReference, String status, Map<String, String> additionalData) {
        PaymentTransaction transaction = paymentTransactionRepository.findByTransactionReference(transactionReference).orElse(null);
        if (transaction != null) {
            switch (status.toUpperCase()) {
                case "VALID":
                case "VALIDATED":
                    transaction.setStatus(PaymentTransaction.TransactionStatus.SUCCESS);
                    transaction.setCompletedAt(LocalDateTime.now());
                    
                    // Create donation record for successful payment
                    if (transaction.getDonor() != null) {
                        createDonationFromTransaction(transaction);
                        awardPointsForDonation(transaction.getDonor(), transaction.getAmount());
                    } else if (transaction.getNgo() != null) {
                        createNgoDonationFromTransaction(transaction);
                    }
                    break;
                case "FAILED":
                    transaction.setStatus(PaymentTransaction.TransactionStatus.FAILED);
                    break;
                case "CANCELLED":
                    transaction.setStatus(PaymentTransaction.TransactionStatus.CANCELLED);
                    break;
            }
            
            if (additionalData != null) {
                transaction.setBankTransactionId(additionalData.get("bank_tran_id"));
                transaction.setCardType(additionalData.get("card_type"));
                transaction.setCardNo(additionalData.get("card_no"));
                transaction.setGatewayResponseCode(additionalData.get("status"));
                transaction.setGatewayResponseMessage(additionalData.get("risk_title"));
            }
            
            paymentTransactionRepository.save(transaction);
        }
    }
    
    // Automatic Point System: 1 BDT = 5 Points (৳100 = 500 points)
    private void awardPointsForDonation(Donor donor, BigDecimal amount) {
        try {
            // Convert to int first, then multiply by 5 for exact calculation
            int pointsToAward = amount.intValue() * 5;
            
            DonorGamification gamification = gamificationRepository.findByDonorDonorId(donor.getDonorId())
                    .orElse(DonorGamification.builder()
                            .donor(donor)
                            .totalPoints(0)
                            .impactScore(0.0)
                            .lastUpdated(LocalDateTime.now())
                            .build());
            
            // Add new points
            gamification.setTotalPoints(gamification.getTotalPoints() + pointsToAward);
            
            // Update level based on total points
          
            
            // Update badges
            List<String> badges = calculateBadges(gamification.getTotalPoints());
            gamification.setBadgesEarned(badges);
            
            gamification.setLastUpdated(LocalDateTime.now());
            
            gamificationRepository.save(gamification);
            
        } catch (Exception e) {
            // Log error but don't fail payment
            System.err.println("Error awarding points: " + e.getMessage());
        }
    }
    
    private String calculateLevel(int totalPoints) {
        if (totalPoints >= 100000) return "Diamond";      // ৳10,000+
        if (totalPoints >= 50000) return "Platinum";     // ৳5,000+
        if (totalPoints >= 25000) return "Gold";         // ৳2,000+ 
        if (totalPoints >= 10000) return "Silver";        // ৳500+
        return "Bronze";                                  // < ৳500
    }
    
    private List<String> calculateBadges(int totalPoints) {
        List<String> badges = new java.util.ArrayList<>();
        
        if (totalPoints >= 500) badges.add("First Donor");        // ৳100
        if (totalPoints >= 2500) badges.add("Generous Heart");    // ৳500
        if (totalPoints >= 5000) badges.add("Education Champion"); // ৳1,000
        if (totalPoints >= 10000) badges.add("School Builder");   // ৳2,000
        if (totalPoints >= 25000) badges.add("Community Hero");   // ৳5,000
        if (totalPoints >= 50000) badges.add("EduAid Legend"); // ৳10,000
        
        return badges;
    }
    
    // Create donation record from successful payment transaction
    private void createDonationFromTransaction(PaymentTransaction transaction) {
        try {
            // Extract project/student IDs from product name
            Integer projectId = null;
            Integer studentId = null;
            Donation.DonationPurpose purpose = Donation.DonationPurpose.GENERAL_SUPPORT;
            
            String productName = transaction.getProductName();
            if (productName != null) {
                if (productName.contains("Project ID:")) {
                    String[] parts = productName.split("Project ID: ");
                    if (parts.length > 1) {
                        String idPart = parts[1].replace(")", "");
                        projectId = Integer.parseInt(idPart);
                        purpose = Donation.DonationPurpose.SCHOOL_PROJECT;
                    }
                } else if (productName.contains("Student ID:")) {
                    String[] parts = productName.split("Student ID: ");
                    if (parts.length > 1) {
                        String idPart = parts[1].replace(")", "");
                        studentId = Integer.parseInt(idPart);
                        purpose = Donation.DonationPurpose.STUDENT_SPONSORSHIP;
                    }
                } else if (productName.contains("Student Sponsorship") && studentId == null) {
                    // For general student sponsorship, find a suitable student
                    studentId = findStudentForSponsorship();
                    if (studentId != null) {
                        purpose = Donation.DonationPurpose.STUDENT_SPONSORSHIP;
                    }
                }
            }
            
            DonationDto donationDto = DonationDto.builder()
                    .donorId(transaction.getDonor().getDonorId())
                    .projectId(projectId)
                    .studentId(studentId)
                    .amount(transaction.getAmount())
                    .donationType(Donation.DonationType.ONE_TIME)
                    .transactionId(transaction.getTransactionId())
                    .paymentStatus(Donation.PaymentStatus.COMPLETED)
                    .purpose(purpose)
                    .donorMessage("Payment via " + transaction.getProductName())
                    .isAnonymous(false)
                    .donatedAt(LocalDateTime.now())
                    .paymentCompletedAt(LocalDateTime.now())
                    .build();
            
            donationService.saveDonation(donationDto);
            System.out.println("Donation record created for transaction: " + transaction.getTransactionReference() + 
                             (projectId != null ? " (Project: " + projectId + ")" : "") +
                             (studentId != null ? " (Student: " + studentId + ")" : ""));
            
        } catch (Exception e) {
            System.err.println("Error creating donation record: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Find a suitable student for sponsorship using updated logic that excludes monthly recipients
    private Integer findStudentForSponsorship() {
        try {
            // Get students who already received scholarships this month from ALL sources (donors + NGOs)
            List<Integer> excludedStudentIds = donationRepository.findAllStudentIdsWithScholarshipThisMonth();
            System.out.println("Students who received scholarships this month from all sources: " + excludedStudentIds);
            
            // Get all high-risk students (more than 1 to have options)
            List<com.example.EduAid.Dto.StudentDto> allHighRiskStudents = studentService.getHighRiskStudentsForSponsorship(10);
            
            // Filter out students who already received scholarships this month
            for (com.example.EduAid.Dto.StudentDto student : allHighRiskStudents) {
                if (!excludedStudentIds.contains(student.getStudentId())) {
                    System.out.println("Selected student ID " + student.getStudentId() + " for sponsorship (not in excluded list)");
                    return student.getStudentId();
                }
            }
            
            System.out.println("All high-risk students have received scholarships this month, using fallback");
            // Fallback to original method if all high-risk students already received scholarships
            com.example.EduAid.Dto.StudentDto student = studentService.findMostSuitableStudentForSponsorship();
            return student != null ? student.getStudentId() : null;
        } catch (Exception e) {
            System.err.println("Error finding student for sponsorship: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    // Create NGO donation record from successful payment transaction
    private void createNgoDonationFromTransaction(PaymentTransaction transaction) {
        try {
            // Extract project/student IDs from product name
            Integer projectId = null;
            Integer studentId = null;
            
            String productName = transaction.getProductName();
            if (productName != null) {
                if (productName.contains("Project ID:")) {
                    String[] parts = productName.split("Project ID: ");
                    if (parts.length > 1) {
                        String idPart = parts[1].replace(")", "");
                        projectId = Integer.parseInt(idPart);
                    }
                } else if (productName.contains("Student ID:")) {
                    String[] parts = productName.split("Student ID: ");
                    if (parts.length > 1) {
                        String idPart = parts[1].replace(")", "");
                        studentId = Integer.parseInt(idPart);
                    }
                } else if (productName.contains("Student Sponsorship") && studentId == null) {
                    // For general student sponsorship, find a suitable student
                    studentId = findStudentForSponsorship();
                }
            }
            
            // Create appropriate NGO donation record
            if (projectId != null) {
                // Create NGO project donation
                createNgoProjectDonation(transaction, projectId);
            } else if (studentId != null) {
                // Create NGO student donation
                createNgoStudentDonation(transaction, studentId);
            }
            
            System.out.println("NGO donation record created for transaction: " + transaction.getTransactionReference() + 
                             (projectId != null ? " (Project: " + projectId + ")" : "") +
                             (studentId != null ? " (Student: " + studentId + ")" : ""));
            
        } catch (Exception e) {
            System.err.println("Error creating NGO donation record: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void createNgoProjectDonation(PaymentTransaction transaction, Integer projectId) {
        try {
            com.example.EduAid.Dto.NgoProjectDonationsDTO donationDto = com.example.EduAid.Dto.NgoProjectDonationsDTO.builder()
                    .ngoId(transaction.getNgo().getNgoId())
                    .projectId(projectId)
                    .amount(transaction.getAmount())
                    .donationType("ONE_TIME")
                    .paymentStatus("COMPLETED")
                    .transactionId(transaction.getTransactionId())
                    .message("Payment via " + transaction.getProductName())
                    .donatedAt(LocalDateTime.now())
                    .paymentCompletedAt(LocalDateTime.now())
                    .build();
            
            ngoProjectDonationsService.create(donationDto);
            System.out.println("Created NGO project donation: NGO " + transaction.getNgo().getNgoId() + 
                              " -> Project " + projectId + " Amount: " + transaction.getAmount());
        } catch (Exception e) {
            System.err.println("Error creating NGO project donation: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void createNgoStudentDonation(PaymentTransaction transaction, Integer studentId) {
        try {
            com.example.EduAid.Dto.NgoStudentDonationsDTO donationDto = com.example.EduAid.Dto.NgoStudentDonationsDTO.builder()
                    .ngoId(transaction.getNgo().getNgoId())
                    .studentId(studentId)
                    .amount(transaction.getAmount())
                    .donationType("ONE_TIME")
                    .paymentStatus("COMPLETED")
                    .transactionId(transaction.getTransactionId())
                    .donorMessage("Payment via " + transaction.getProductName())
                    .isAnonymous(false)
                    .donatedAt(LocalDateTime.now())
                    .paymentCompletedAt(LocalDateTime.now())
                    .build();
            
            ngoStudentDonationsService.create(donationDto);
            System.out.println("Created NGO student donation: NGO " + transaction.getNgo().getNgoId() + 
                              " -> Student " + studentId + " Amount: " + transaction.getAmount());
        } catch (Exception e) {
            System.err.println("Error creating NGO student donation: " + e.getMessage());
            e.printStackTrace();
        }
    }
   
}