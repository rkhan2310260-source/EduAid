package com.example.EduAid.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // Handles validation errors from @Valid (e.g. blank email, blank password)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .findFirst()
                .orElse("Validation error");
        log.warn("Validation error: {}", errorMessage);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", errorMessage));
    }

    // Handles bad credentials on login
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Bad credentials: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid email or password"));
    }

    // Handles all other RuntimeExceptions (e.g. "Email already exists", "User not found")
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        log.error("Runtime exception: {}", ex.getMessage());
        HttpStatus status = HttpStatus.BAD_REQUEST;
        // Return 401 for auth-related messages
        if (ex.getMessage() != null && ex.getMessage().contains("Invalid email or password")) {
            status = HttpStatus.UNAUTHORIZED;
        }
        return ResponseEntity.status(status)
                .body(Map.of("message", ex.getMessage() != null ? ex.getMessage() : "An error occurred"));
    }
}
