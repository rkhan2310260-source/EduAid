package com.example.EduAid.service;

import com.example.EduAid.Entity.NgoProjectRequests;
import com.example.EduAid.Entity.NgoProject;
import com.example.EduAid.Entity.School;
import com.example.EduAid.Dto.NgoProjectRequestsDTO;
import com.example.EduAid.repository.NgoProjectRequestsRepository;
import com.example.EduAid.repository.NgoProjectRepository;
import com.example.EduAid.repository.SchoolRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NgoProjectRequestsService {

    private final NgoProjectRequestsRepository repository;
    private final NgoProjectRepository ngoProjectRepository;
    private final SchoolRepository schoolRepository;
    private final ConversationService conversationService;
    private final MessageService messageService;

    public NgoProjectRequestsService(NgoProjectRequestsRepository repository,
                                    NgoProjectRepository ngoProjectRepository,
                                    SchoolRepository schoolRepository,
                                    ConversationService conversationService,
                                    MessageService messageService) {
        this.repository = repository;
        this.ngoProjectRepository = ngoProjectRepository;
        this.schoolRepository = schoolRepository;
        this.conversationService = conversationService;
        this.messageService = messageService;
    }

    // ===================== CREATE =====================
    public NgoProjectRequestsDTO create(NgoProjectRequestsDTO dto) {
        // Check if active invitation already exists for this project-school combination
        List<NgoProjectRequests> existingInvitations = repository.findActiveInvitationByProjectAndSchool(
            dto.getNgoProjectId(), dto.getSchoolId());
        
        if (!existingInvitations.isEmpty()) {
            throw new RuntimeException("An active invitation already exists for this project and school");
        }
        
        NgoProjectRequests entity = mapToEntity(dto);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());

        NgoProjectRequests saved = repository.save(entity);
        return mapToDTO(saved);
    }

    // ===================== UPDATE =====================
    public NgoProjectRequestsDTO update(Integer id, NgoProjectRequestsDTO dto) {
        NgoProjectRequests entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        entity.setNgoProjectId(dto.getNgoProjectId());
        entity.setSchoolId(dto.getSchoolId());
        entity.setRequestType(dto.getRequestType() != null ? parseRequestType(dto.getRequestType()) : null);
        entity.setStatus(dto.getStatus() != null ? parseRequestStatus(dto.getStatus()) : null);
        entity.setRequestMessage(dto.getRequestMessage());
        entity.setRequestedBudget(dto.getRequestedBudget());
        entity.setRequestedAt(dto.getRequestedAt());
        entity.setRequestedByUserId(dto.getRequestedByUserId());
        entity.setResponseMessage(dto.getResponseMessage());
        entity.setRespondedAt(dto.getRespondedAt());
        entity.setRespondedByUserId(dto.getRespondedByUserId());
        entity.setNpsId(dto.getNpsId());
        entity.setUpdatedAt(LocalDateTime.now());

        NgoProjectRequests updated = repository.save(entity);
        return mapToDTO(updated);
    }

    // ===================== GET BY ID =====================
    public NgoProjectRequestsDTO getById(Integer id) {
        NgoProjectRequests entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        return mapToDTO(entity);
    }

    // ===================== GET ALL =====================
    public List<NgoProjectRequestsDTO> getAll() {
        return repository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ===================== DELETE =====================
    public void delete(Integer id) {
        repository.deleteById(id);
    }
    
    // ===================== GET BY SCHOOL =====================
    public List<NgoProjectRequestsDTO> getBySchool(Integer schoolId) {
        return repository.findBySchoolId(schoolId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    // ===================== GET BY NGO PROJECT =====================
    public List<NgoProjectRequestsDTO> getByNgoProject(Integer ngoProjectId) {
        return repository.findByNgoProjectId(ngoProjectId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    // ===================== APPROVE REQUEST =====================
    // When school approves NGO invitation, update status, save response message, and create conversation
    @Transactional
    public NgoProjectRequestsDTO approveRequest(Integer id, NgoProjectRequestsDTO dto) {
        NgoProjectRequests entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        // Update request with approval
        entity.setStatus(NgoProjectRequests.RequestStatus.APPROVED);
        entity.setResponseMessage(dto.getResponseMessage());
        entity.setRespondedAt(LocalDateTime.now());
        entity.setRespondedByUserId(dto.getRespondedByUserId());
        entity.setUpdatedAt(LocalDateTime.now());
        
        NgoProjectRequests updated = repository.save(entity);
        
        // Auto-create conversation between school and NGO for this project
        try {
            NgoProject project = ngoProjectRepository.findById(entity.getNgoProjectId())
                    .orElseThrow(() -> new RuntimeException("NGO Project not found"));
            School school = schoolRepository.findById(entity.getSchoolId())
                    .orElseThrow(() -> new RuntimeException("School not found"));
            
            Integer ngoUserId = project.getNgo().getUser().getUserId();
            Integer schoolUserId = school.getUser().getUserId();
            
            // Create or get existing conversation for this project
            conversationService.createOrGetConversation(schoolUserId, ngoUserId, entity.getNgoProjectId());
            
            System.out.println("Conversation created/retrieved for approved invitation: " + id);
        } catch (Exception e) {
            System.err.println("Failed to create conversation for approved invitation: " + e.getMessage());
            // Don't fail the approval if conversation creation fails
        }
        
        return mapToDTO(updated);
    }
    
    // ===================== GET EXCLUDED SCHOOLS FOR INVITATION =====================
    public List<Integer> getExcludedSchoolsForInvitation(Integer ngoProjectId) {
        // Get all schools that have PENDING or APPROVED invitations for this project
        List<NgoProjectRequests> activeInvitations = repository.findByNgoProjectId(ngoProjectId)
                .stream()
                .filter(req -> "PENDING".equals(req.getStatus().name()) || "APPROVED".equals(req.getStatus().name()))
                .toList();
        
        return activeInvitations.stream()
                .map(NgoProjectRequests::getSchoolId)
                .toList();
    }
    
    // ===================== REJECT REQUEST =====================
    @Transactional
    public NgoProjectRequestsDTO rejectRequest(Integer id, NgoProjectRequestsDTO dto) {
        NgoProjectRequests entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        entity.setStatus(NgoProjectRequests.RequestStatus.REJECTED);
        entity.setResponseMessage(dto.getResponseMessage());
        entity.setRespondedAt(LocalDateTime.now());
        entity.setRespondedByUserId(dto.getRespondedByUserId());
        entity.setUpdatedAt(LocalDateTime.now());
        
        NgoProjectRequests updated = repository.save(entity);
        return mapToDTO(updated);
    }

    // ===================== MAPPER METHODS =====================
    private NgoProjectRequestsDTO mapToDTO(NgoProjectRequests entity) {
        return NgoProjectRequestsDTO.builder()
                .requestId(entity.getRequestId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .ngoProjectId(entity.getNgoProjectId())
                .schoolId(entity.getSchoolId())
                .requestType(entity.getRequestType() != null ? entity.getRequestType().name() : null)
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .requestMessage(entity.getRequestMessage())
                .requestedBudget(entity.getRequestedBudget())
                .requestedAt(entity.getRequestedAt())
                .requestedByUserId(entity.getRequestedByUserId())
                .responseMessage(entity.getResponseMessage())
                .respondedAt(entity.getRespondedAt())
                .respondedByUserId(entity.getRespondedByUserId())
                .npsId(entity.getNpsId())
                .build();
    }

    private NgoProjectRequests mapToEntity(NgoProjectRequestsDTO dto) {
        return NgoProjectRequests.builder()
                .ngoProjectId(dto.getNgoProjectId())
                .schoolId(dto.getSchoolId())
                .requestType(dto.getRequestType() != null ? parseRequestType(dto.getRequestType()) : null)
                .status(dto.getStatus() != null ? parseRequestStatus(dto.getStatus()) : null)
                .requestMessage(dto.getRequestMessage())
                .requestedBudget(dto.getRequestedBudget())
                .requestedAt(dto.getRequestedAt())
                .requestedByUserId(dto.getRequestedByUserId())
                .responseMessage(dto.getResponseMessage())
                .respondedAt(dto.getRespondedAt())
                .respondedByUserId(dto.getRespondedByUserId())
                .npsId(dto.getNpsId())
                .build();
    }
    
    private NgoProjectRequests.RequestType parseRequestType(String type) {
        try {
            return NgoProjectRequests.RequestType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return NgoProjectRequests.RequestType.JOIN_REQUEST; // Default value
        }
    }
    
    private NgoProjectRequests.RequestStatus parseRequestStatus(String status) {
        try {
            return NgoProjectRequests.RequestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return NgoProjectRequests.RequestStatus.PENDING; // Default value
        }
    }
}
