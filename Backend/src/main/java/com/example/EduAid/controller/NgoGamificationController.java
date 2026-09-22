package com.example.EduAid.controller;

import com.example.EduAid.Dto.NgoGamificationDTO;
import com.example.EduAid.service.NgoGamificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ngo-gamification")
public class NgoGamificationController {

    private final NgoGamificationService service;

    public NgoGamificationController(NgoGamificationService service) {
        this.service = service;
    }

    // ===================== CREATE =====================
    @PostMapping
    public ResponseEntity<NgoGamificationDTO> create(@RequestBody NgoGamificationDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    // ===================== UPDATE =====================
    @PutMapping("/{id}")
    public ResponseEntity<NgoGamificationDTO> update(@PathVariable Integer id,
                                                     @RequestBody NgoGamificationDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    // ===================== GET BY ID =====================
    @GetMapping("/{id}")
    public ResponseEntity<NgoGamificationDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    // ===================== GET ALL =====================
    @GetMapping
    public ResponseEntity<List<NgoGamificationDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // ===================== GET BY NGO ID =====================
    @GetMapping("/ngo/{ngoId}")
    public ResponseEntity<NgoGamificationDTO> getByNgoId(@PathVariable Integer ngoId) {
        return ResponseEntity.ok(service.getByNgoId(ngoId));
    }

    // ===================== DELETE =====================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===================== MANUAL REFRESH GAMIFICATION =====================
    @PostMapping("/refresh/{ngoId}")
    public ResponseEntity<NgoGamificationDTO> refreshGamification(@PathVariable Integer ngoId) {
        service.updateGamificationAfterDonation(ngoId);
        return ResponseEntity.ok(service.getByNgoId(ngoId));
    }
    
    // ===================== REFRESH ALL GAMIFICATIONS =====================
    @PostMapping("/refresh-all")
    public ResponseEntity<String> refreshAllGamifications() {
        service.refreshAllGamifications();
        return ResponseEntity.ok("All NGO gamifications refreshed successfully");
    }
}
