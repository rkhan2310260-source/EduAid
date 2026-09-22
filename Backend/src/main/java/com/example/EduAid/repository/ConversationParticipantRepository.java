package com.example.EduAid.repository;

import com.example.EduAid.Entity.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, Integer> {

    List<ConversationParticipant> findByConversationConversationId(Integer conversationId);

    Optional<ConversationParticipant> findByConversationConversationIdAndUserUserId(Integer conversationId, Integer userId);

    // Count unread messages for a user in a conversation (excluding messages sent by the user)
    @Query("SELECT COUNT(m) FROM Message m " +
           "WHERE m.conversation.conversationId = :conversationId " +
           "AND m.sender.userId != :userId " +
           "AND m.sentAt > COALESCE(" +
           "  (SELECT cp.lastReadAt FROM ConversationParticipant cp " +
           "   WHERE cp.conversation.conversationId = :conversationId " +
           "   AND cp.user.userId = :userId), " +
           "  '1970-01-01 00:00:00')")
    Long countUnreadMessages(@Param("conversationId") Integer conversationId, @Param("userId") Integer userId);
}