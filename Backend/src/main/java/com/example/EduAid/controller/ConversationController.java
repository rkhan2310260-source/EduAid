package com.example.EduAid.controller;

import com.example.EduAid.Dto.ConversationDto;
import com.example.EduAid.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConversationController {

    private final ConversationService conversationService;

    // Get all conversations for a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ConversationDto>> getUserConversations(@PathVariable Integer userId) {
        System.out.println("Fetching conversations for user: " + userId);
        List<ConversationDto> conversations = conversationService.getUserConversations(userId);
        System.out.println("Found " + conversations.size() + " conversations");
        return ResponseEntity.ok(conversations);
    }

    // Create or get conversation between two users for an NGO project
    @PostMapping("/create")
    public ResponseEntity<ConversationDto> createConversation(
            @RequestParam Integer userId1,
            @RequestParam Integer userId2,
            @RequestParam Integer ngoProjectId) {
        
        ConversationDto conversation = conversationService.createOrGetConversation(userId1, userId2, ngoProjectId);
        return ResponseEntity.ok(conversation);
    }

    // Mark conversation as read
    @PutMapping("/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Integer conversationId,
            @RequestParam Integer userId) {
        
        conversationService.markAsRead(conversationId, userId);
        return ResponseEntity.ok().build();
    }

    // Debug endpoint to test conversation creation
    @PostMapping("/test-create")
    public ResponseEntity<ConversationDto> testCreateConversation(
            @RequestParam Integer userId1,
            @RequestParam Integer userId2,
            @RequestParam Integer ngoProjectId) {
        
        ConversationDto conversation = conversationService.testCreateConversation(userId1, userId2, ngoProjectId);
        return ResponseEntity.ok(conversation);
    }

    // Get conversation for a specific NGO project and user
    @GetMapping("/project/{ngoProjectId}/user/{userId}")
    public ResponseEntity<ConversationDto> getConversationByProject(
            @PathVariable Integer ngoProjectId,
            @PathVariable Integer userId) {
        
        ConversationDto conversation = conversationService.getConversationByNgoProject(ngoProjectId, userId);
        return ResponseEntity.ok(conversation);
    }
    
    // Get total unread message count for a user across all conversations
    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Long> getTotalUnreadCount(@PathVariable Integer userId) {
        List<ConversationDto> conversations = conversationService.getUserConversations(userId);
        Long totalUnread = conversations.stream()
                .mapToLong(conv -> conv.getUnreadCount() != null ? conv.getUnreadCount() : 0L)
                .sum();
        return ResponseEntity.ok(totalUnread);
    }
}