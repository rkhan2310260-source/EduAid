package com.example.EduAid.Dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ConversationDto {
    private Integer conversationId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer ngoProjectId;
    private LocalDateTime lastMessageAt;
    private List<ConversationParticipantDto> participants;
    private MessageDto lastMessage;
    private Long unreadCount;  // Changed to Long to match query result type
    
    // Display fields for frontend - shows the other participant's name and project title
    private String otherUserName;  // NGO name or School name of the other participant
    private String projectName;    // Project title for context
}