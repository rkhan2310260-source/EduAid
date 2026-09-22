package com.example.EduAid.Dto;

import com.example.EduAid.Entity.Message.MessageType;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MessageDto {
    private Integer messageId;
    private Integer conversationId;
    private Integer senderId;
    private String senderName;
    private String senderType;
    private MessageType messageType;
    private String messageText;
    private String imageUrl;
    private LocalDateTime sentAt;
}