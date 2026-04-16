package com.track.api.controller;

import com.track.api.dto.CompanyMemberResponse;
import com.track.service.TeamService;
import com.track.domain.repository.CompanyUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/team")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final CompanyUserRepository companyUserRepository;

    @GetMapping
    public ResponseEntity<List<CompanyMemberResponse>> getTeam(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam UUID companyId
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        companyUserRepository.findByCompanyIdAndUserId(companyId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Not a member of this company"));

        List<CompanyMemberResponse> members = teamService.getTeam(companyId).stream()
            .map(CompanyMemberResponse::from)
            .toList();
        return ResponseEntity.ok(members);
    }

    @PatchMapping("/{userId}/deactivate")
    public ResponseEntity<?> deactivate(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam UUID companyId,
        @PathVariable UUID userId
    ) {
        teamService.deactivateMember(companyId, userId);
        return ResponseEntity.ok(Map.of("message", "Member deactivated"));
    }

    @PatchMapping("/{userId}/activate")
    public ResponseEntity<?> activate(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam UUID companyId,
        @PathVariable UUID userId
    ) {
        teamService.activateMember(companyId, userId);
        return ResponseEntity.ok(Map.of("message", "Member activated"));
    }

    @PatchMapping("/{userId}/dev-roles")
    public ResponseEntity<?> updateDevRoles(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam UUID companyId,
        @PathVariable UUID userId,
        @RequestBody com.track.api.dto.UpdateDevRolesRequest req
    ) {
        teamService.updateDevRoles(companyId, userId, req.devRoles());
        return ResponseEntity.ok(Map.of("message", "Dev roles updated"));
    }
}
