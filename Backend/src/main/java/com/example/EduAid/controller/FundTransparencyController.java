package com.example.EduAid.controller;

import com.example.EduAid.Dto.FundTransparencyDto;
import com.example.EduAid.service.FundTransparencyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fund-transparencies")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class FundTransparencyController {

    private final FundTransparencyService fundTransparencyService;

    @PostMapping
    public ResponseEntity<FundTransparencyDto> createFundTransparency(
            @Valid @RequestBody FundTransparencyDto fundTransparencyDto) {
        log.info("REST request to create fund transparency for utilization ID: {}", fundTransparencyDto.getUtilizationId());

        FundTransparencyDto createdTransparency = fundTransparencyService.createFundTransparency(fundTransparencyDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTransparency);
    }

    @GetMapping("/{transparencyId}")
    public ResponseEntity<FundTransparencyDto> getFundTransparencyById(@PathVariable Integer transparencyId) {
        log.info("REST request to get fund transparency with ID: {}", transparencyId);

        FundTransparencyDto transparency = fundTransparencyService.getFundTransparencyById(transparencyId);
        return ResponseEntity.ok(transparency);
    }

    @GetMapping
    public ResponseEntity<List<FundTransparencyDto>> getAllFundTransparencies() {
        log.info("REST request to get all fund transparencies");

        List<FundTransparencyDto> transparencies = fundTransparencyService.getAllFundTransparencies();
        return ResponseEntity.ok(transparencies);
    }

    @GetMapping("/paginated")
    public ResponseEntity<Page<FundTransparencyDto>> getAllFundTransparencies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "transparencyId") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        log.info("REST request to get fund transparencies with pagination - page: {}, size: {}, sortBy: {}, sortDirection: {}",
                page, size, sortBy, sortDirection);

        Sort sort = sortDirection.equalsIgnoreCase("DESC") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<FundTransparencyDto> transparencies = fundTransparencyService.getAllFundTransparencies(pageable);

        return ResponseEntity.ok(transparencies);
    }

    @GetMapping("/public")
    public ResponseEntity<List<FundTransparencyDto>> getPublicFundTransparencies() {
        log.info("REST request to get all public fund transparencies");

        List<FundTransparencyDto> transparencies = fundTransparencyService.getPublicFundTransparencies();
        return ResponseEntity.ok(transparencies);
    }

    @GetMapping("/by-utilization/{utilizationId}")
    public ResponseEntity<List<FundTransparencyDto>> getFundTransparenciesByUtilization(@PathVariable Integer utilizationId) {
        log.info("REST request to get fund transparencies for utilization ID: {}", utilizationId);

        List<FundTransparencyDto> transparencies = fundTransparencyService.getFundTransparenciesByUtilization(utilizationId);
        return ResponseEntity.ok(transparencies);
    }

    // AI FIX: Get transparency data by project ID
    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<FundTransparencyDto>> getFundTransparenciesByProject(@PathVariable Integer projectId) {
        log.info("REST request to get fund transparencies for project ID: {}", projectId);

        List<FundTransparencyDto> transparencies = fundTransparencyService.getFundTransparenciesByProject(projectId);
        return ResponseEntity.ok(transparencies);
    }

    // @GetMapping("/by-verifier/{adminId}")
    // public ResponseEntity<List<FundTransparencyDto>> getFundTransparenciesByVerifiedBy(@PathVariable Integer adminId) {
    //     log.info("REST request to get fund transparencies verified by admin ID: {}", adminId);

    //     List<FundTransparencyDto> transparencies = fundTransparencyService.getFundTransparenciesByVerifiedBy(adminId);
    //     return ResponseEntity.ok(transparencies);
    // }

    @PutMapping("/{transparencyId}")
    public ResponseEntity<FundTransparencyDto> updateFundTransparency(
            @PathVariable Integer transparencyId,
            @Valid @RequestBody FundTransparencyDto fundTransparencyDto) {
        log.info("REST request to update fund transparency with ID: {}", transparencyId);

        FundTransparencyDto updatedTransparency = fundTransparencyService.updateFundTransparency(transparencyId, fundTransparencyDto);
        return ResponseEntity.ok(updatedTransparency);
    }

    // AI FIX: Get single transparency record for specific fund utilization
    @GetMapping("/fund-transparency/{utilizationId}")
    public ResponseEntity<FundTransparencyDto> getFundTransparencyByUtilization(@PathVariable Integer utilizationId) {
        log.info("REST request to get fund transparency for utilization ID: {}", utilizationId);
        
        FundTransparencyDto transparency = fundTransparencyService.getFundTransparencyByUtilizationId(utilizationId);
        return ResponseEntity.ok(transparency);
    }

    @DeleteMapping("/{transparencyId}")
    public ResponseEntity<Void> deleteFundTransparency(@PathVariable Integer transparencyId) {
        log.info("REST request to delete fund transparency with ID: {}", transparencyId);

        fundTransparencyService.deleteFundTransparency(transparencyId);
        return ResponseEntity.noContent().build();
    }
}