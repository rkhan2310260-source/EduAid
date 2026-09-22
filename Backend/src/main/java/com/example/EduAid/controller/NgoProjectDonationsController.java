package com.example.EduAid.controller;

import com.example.EduAid.Dto.NgoProjectDonationsDTO;
import com.example.EduAid.service.NgoProjectDonationsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ngo-project-donations")
public class NgoProjectDonationsController {

    private final NgoProjectDonationsService service;

    public NgoProjectDonationsController(NgoProjectDonationsService service) {
        this.service = service;
    }

    // ===================== CREATE =====================
    @PostMapping
    public ResponseEntity<NgoProjectDonationsDTO> create(@RequestBody NgoProjectDonationsDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    // ===================== UPDATE =====================
    @PutMapping("/{id}")
    public ResponseEntity<NgoProjectDonationsDTO> update(@PathVariable Integer id,
                                                         @RequestBody NgoProjectDonationsDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    // ===================== GET BY ID =====================
    @GetMapping("/{id}")
    public ResponseEntity<NgoProjectDonationsDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    // ===================== GET ALL =====================
    @GetMapping
    public ResponseEntity<List<NgoProjectDonationsDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // ===================== GET BY NGO ID =====================
    @GetMapping("/ngo/{ngoId}")
    public ResponseEntity<List<NgoProjectDonationsDTO>> getByNgoId(@PathVariable Integer ngoId) {
        return ResponseEntity.ok(service.getByNgoId(ngoId));
    }

    // ===================== GET NGO TOTAL FOR PROJECT =====================
    @GetMapping("/ngo/{ngoId}/project/{projectId}/total")
    public ResponseEntity<Double> getNgoTotalForProject(@PathVariable Integer ngoId, @PathVariable Integer projectId) {
        Double total = service.getNgoTotalForProject(ngoId, projectId);
        return ResponseEntity.ok(total != null ? total : 0.0);
    }

    // AI FIX: Get all NGO donations for a specific project (for analytics)
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<NgoProjectDonationsDTO>> getByProjectId(@PathVariable Integer projectId) {
        return ResponseEntity.ok(service.getByProjectId(projectId));
    }

    // ===================== DELETE =====================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
