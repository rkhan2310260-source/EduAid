package com.example.EduAid.controller;

import com.example.EduAid.Dto.NgoProjectRequestsDTO;
import com.example.EduAid.service.NgoProjectRequestsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ngo-project-requests")
@CrossOrigin(origins = "*")
public class NgoProjectRequestsController {

    private final NgoProjectRequestsService service;

    public NgoProjectRequestsController(NgoProjectRequestsService service) {
        this.service = service;
    }

    // ===================== CREATE =====================
    @PostMapping
    public ResponseEntity<NgoProjectRequestsDTO> create(@RequestBody NgoProjectRequestsDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    // ===================== UPDATE =====================
    @PutMapping("/{id}")
    public ResponseEntity<NgoProjectRequestsDTO> update(@PathVariable Integer id,
                                                        @RequestBody NgoProjectRequestsDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    // ===================== GET BY ID =====================
    @GetMapping("/{id}")
    public ResponseEntity<NgoProjectRequestsDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    // ===================== GET ALL =====================
    @GetMapping
    public ResponseEntity<List<NgoProjectRequestsDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // ===================== DELETE =====================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===================== GET REQUESTS BY SCHOOL =====================
    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<NgoProjectRequestsDTO>> getBySchool(@PathVariable Integer schoolId) {
        return ResponseEntity.ok(service.getBySchool(schoolId));
    }
    
    // ===================== GET REQUESTS BY NGO PROJECT =====================
    @GetMapping("/ngo-project/{ngoProjectId}")
    public ResponseEntity<List<NgoProjectRequestsDTO>> getByNgoProject(@PathVariable Integer ngoProjectId) {
        return ResponseEntity.ok(service.getByNgoProject(ngoProjectId));
    }
    
    // ===================== APPROVE REQUEST =====================
    @PostMapping("/{id}/approve")
    public ResponseEntity<NgoProjectRequestsDTO> approve(@PathVariable Integer id, 
                                                         @RequestBody NgoProjectRequestsDTO dto) {
        return ResponseEntity.ok(service.approveRequest(id, dto));
    }
    
    // ===================== REJECT REQUEST =====================
    @PostMapping("/{id}/reject")
    public ResponseEntity<NgoProjectRequestsDTO> reject(@PathVariable Integer id,
                                                        @RequestBody NgoProjectRequestsDTO dto) {
        return ResponseEntity.ok(service.rejectRequest(id, dto));
    }
    
    // ===================== GET EXCLUDED SCHOOLS FOR INVITATION =====================
    @GetMapping("/excluded-schools/{ngoProjectId}")
    public ResponseEntity<List<Integer>> getExcludedSchools(@PathVariable Integer ngoProjectId) {
        return ResponseEntity.ok(service.getExcludedSchoolsForInvitation(ngoProjectId));
    }
}
