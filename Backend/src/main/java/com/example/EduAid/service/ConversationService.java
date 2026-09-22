package com.example.EduAid.service;

import com.example.EduAid.Dto.*;
import com.example.EduAid.Entity.*;
import com.example.EduAid.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SchoolProjectRepository schoolProjectRepository;
    private final NgoProjectRepository ngoProjectRepository;

    // Get all conversations for a user with other participant names and project titles
    public List<ConversationDto> getUserConversations(Integer userId) {
        List<Conversation> conversations = conversationRepository.findByUserId(userId);
        return conversations.stream()
                .map(conv -> convertToDto(conv, userId))  // Pass userId to identify other participant
                .collect(Collectors.toList());
    }

    // Create or get conversation between two users for an NGO project
    @Transactional
    public ConversationDto createOrGetConversation(Integer userId1, Integer userId2, Integer ngoProjectId) {
        if (ngoProjectId == null) {
            throw new IllegalArgumentException("ngoProjectId must be provided");
        }
        
        Conversation conversation = conversationRepository.findByUsersAndNgoProject(userId1, userId2, ngoProjectId)
                .orElseGet(() -> createNewConversation(userId1, userId2, ngoProjectId));
        
        return convertToDto(conversation, userId1);
    }

    // Create new conversation for NGO project
    private Conversation createNewConversation(Integer userId1, Integer userId2, Integer ngoProjectId) {
        System.out.println("Creating new conversation between users: " + userId1 + " and " + userId2);
        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId1));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId2));

        NgoProject ngoProject = ngoProjectRepository.findById(ngoProjectId)
                .orElseThrow(() -> new RuntimeException("NGO Project not found: " + ngoProjectId));

        Conversation conversation = Conversation.builder()
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .ngoProject(ngoProject)
                .build();

        conversation = conversationRepository.save(conversation);
        System.out.println("Conversation saved with ID: " + conversation.getConversationId());

        // Add participants
        ConversationParticipant participant1 = ConversationParticipant.builder()
                .conversation(conversation)
                .user(user1)
                .joinedAt(LocalDateTime.now())
                .build();

        ConversationParticipant participant2 = ConversationParticipant.builder()
                .conversation(conversation)
                .user(user2)
                .joinedAt(LocalDateTime.now())
                .build();

        participantRepository.save(participant1);
        participantRepository.save(participant2);

        return conversation;
    }

    // Mark conversation as read for a user
    @Transactional
    public void markAsRead(Integer conversationId, Integer userId) {
        ConversationParticipant participant = participantRepository
                .findByConversationConversationIdAndUserUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Participant not found"));
        
        participant.setLastReadAt(LocalDateTime.now());
        participantRepository.save(participant);
    }

    // Debug method to test conversation creation
    @Transactional
    public ConversationDto testCreateConversation(Integer userId1, Integer userId2, Integer ngoProjectId) {
        System.out.println("Testing conversation creation between users: " + userId1 + " and " + userId2);
        return createOrGetConversation(userId1, userId2, ngoProjectId);
    }

    // AI FIX: Get conversation for a specific NGO project and user
    public ConversationDto getConversationByNgoProject(Integer ngoProjectId, Integer userId) {
        List<Conversation> userConversations = conversationRepository.findByUserId(userId);
        
        Optional<Conversation> projectConversation = userConversations.stream()
                .filter(c -> c.getNgoProject() != null && c.getNgoProject().getNgoProjectId().equals(ngoProjectId))
                .findFirst();
        
        if (projectConversation.isPresent()) {
            return convertToDto(projectConversation.get(), userId);
        } else {
            throw new RuntimeException("No conversation found for this project");
        }
    }

    // Convert Conversation entity to DTO with other user name, project name, and unread count
    private ConversationDto convertToDto(Conversation conversation, Integer currentUserId) {
        ConversationDto dto = new ConversationDto();
        dto.setConversationId(conversation.getConversationId());
        dto.setCreatedAt(conversation.getCreatedAt());
        dto.setUpdatedAt(conversation.getUpdatedAt());
        dto.setLastMessageAt(conversation.getLastMessageAt());
        
        // Set NGO project ID and name
        if (conversation.getNgoProject() != null) {
            dto.setNgoProjectId(conversation.getNgoProject().getNgoProjectId());
            dto.setProjectName(conversation.getNgoProject().getProjectName());
        }

        // Get participants and identify the other user
        List<ConversationParticipant> participants = participantRepository
                .findByConversationConversationId(conversation.getConversationId());
        dto.setParticipants(participants.stream()
                .map(this::convertParticipantToDto)
                .collect(Collectors.toList()));
        
        // Find the other participant (not the current user) and get their NGO/School name
        if (currentUserId != null) {
            participants.stream()
                    .filter(p -> !p.getUser().getUserId().equals(currentUserId))
                    .findFirst()
                    .ifPresent(otherParticipant -> {
                        User otherUser = otherParticipant.getUser();
                        // Get the actual NGO or School name based on user type
                        if (otherUser.getUserType() == User.UserType.NGO && otherUser.getNgo() != null) {
                            dto.setOtherUserName(otherUser.getNgo().getNgoName());
                        } else if (otherUser.getUserType() == User.UserType.SCHOOL && otherUser.getSchool() != null) {
                            dto.setOtherUserName(otherUser.getSchool().getSchoolName());
                        } else {
                            dto.setOtherUserName(otherUser.getUsername());  // Fallback to username
                        }
                    });
            
            // Calculate unread count for current user using existing lastReadAt timestamp
            Long unreadCount = participantRepository.countUnreadMessages(
                conversation.getConversationId(), 
                currentUserId
            );
            dto.setUnreadCount(unreadCount != null ? unreadCount : 0L);
        }

        // Get last message
        messageRepository.findLatestByConversationId(conversation.getConversationId())
                .ifPresent(message -> dto.setLastMessage(convertMessageToDto(message)));

        return dto;
    }
    
    // Overload for backward compatibility where userId is not needed
    private ConversationDto convertToDto(Conversation conversation) {
        return convertToDto(conversation, null);
    }

    private ConversationParticipantDto convertParticipantToDto(ConversationParticipant participant) {
        ConversationParticipantDto dto = new ConversationParticipantDto();
        dto.setParticipantId(participant.getParticipantId());
        dto.setConversationId(participant.getConversation().getConversationId());
        dto.setUserId(participant.getUser().getUserId());
        dto.setUserName(participant.getUser().getUsername());
        dto.setUserType(participant.getUser().getUserType().toString());
        dto.setJoinedAt(participant.getJoinedAt());
        dto.setLastReadAt(participant.getLastReadAt());
        return dto;
    }

    private MessageDto convertMessageToDto(Message message) {
        MessageDto dto = new MessageDto();
        dto.setMessageId(message.getMessageId());
        dto.setConversationId(message.getConversation().getConversationId());
        dto.setSenderId(message.getSender().getUserId());
        dto.setSenderName(message.getSender().getUsername());
        dto.setSenderType(message.getSender().getUserType().toString());
        dto.setMessageType(message.getMessageType());
        dto.setMessageText(message.getMessageText());
        dto.setImageUrl(message.getImageUrl());
        dto.setSentAt(message.getSentAt());
        return dto;
    }
}