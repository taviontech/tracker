package com.track.api.controller;

import com.track.api.dto.SprintRequest;
import com.track.api.dto.SprintResponse;
import com.track.domain.model.Sprint;
import com.track.domain.repository.CompanyUserRepository;
import com.track.service.SprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/sprints")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;
    private final CompanyUserRepository companyUserRepository;

    @GetMapping
    public ResponseEntity<List<SprintResponse>> list(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam UUID companyId
    ) {
        assertMember(principal, companyId);
        List<Sprint> sprints = sprintService.getAll(companyId);
        return ResponseEntity.ok(sprints.stream().map(SprintResponse::from).toList());
    }

    @PostMapping
    public ResponseEntity<SprintResponse> create(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam UUID companyId,
        @Valid @RequestBody SprintRequest req
    ) {
        assertMember(principal, companyId);
        UUID userId = UUID.fromString(principal.getUsername());
        Sprint sprint = sprintService.create(companyId, userId, req);
        return ResponseEntity.ok(SprintResponse.from(sprint));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<SprintResponse> updateStatus(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id,
        @RequestBody Map<String, String> body
    ) {
        Sprint updated = sprintService.updateStatus(id, body.get("status"));
        return ResponseEntity.ok(SprintResponse.from(updated));
    }

    @SuppressWarnings("unchecked")
    @PatchMapping("/{id}/columns")
    public ResponseEntity<SprintResponse> updateColumns(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id,
        @RequestBody Map<String, Object> body
    ) {
        List<String> columns = (List<String>) body.get("columns");
        Sprint updated = sprintService.updateColumns(id, columns != null ? columns : new ArrayList<>());
        return ResponseEntity.ok(SprintResponse.from(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id
    ) {
        sprintService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Sprint deleted"));
    }

    private void assertMember(UserDetails principal, UUID companyId) {
        UUID userId = UUID.fromString(principal.getUsername());
        companyUserRepository.findByCompanyIdAndUserId(companyId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Not a member of this company"));
    }
}
