package com.track.api.controller;

import com.track.api.dto.AcceptInvitationRequest;
import com.track.api.dto.InviteRequest;
import com.track.service.InvitationService;
import com.track.domain.model.CompanyUser;
import com.track.domain.model.Invitation;
import com.track.domain.repository.CompanyUserRepository;
import com.track.domain.repository.InvitationRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;
    private final CompanyUserRepository companyUserRepository;
    private final InvitationRepository invitationRepository;

    @PostMapping
    public ResponseEntity<?> invite(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam UUID companyId,
        @Valid @RequestBody InviteRequest req
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        CompanyUser cu = companyUserRepository.findByCompanyIdAndUserId(companyId, userId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this company"));

        if (cu.getRole() == CompanyUser.CompanyRole.DEVELOPER) {
            throw new IllegalArgumentException("Developers cannot send invitations");
        }

        CompanyUser.CompanyRole role;
        try {
            role = CompanyUser.CompanyRole.valueOf(req.role().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role. Use MANAGER or DEVELOPER");
        }

        if (role == CompanyUser.CompanyRole.OWNER) {
            throw new IllegalArgumentException("Cannot invite as OWNER");
        }

        if (role == CompanyUser.CompanyRole.CO_OWNER &&
            cu.getRole() != CompanyUser.CompanyRole.OWNER &&
            cu.getRole() != CompanyUser.CompanyRole.CO_OWNER) {
            throw new IllegalArgumentException("Only Owner or Deputy Owner can invite Deputy Owners");
        }

        if (cu.getRole() == CompanyUser.CompanyRole.MANAGER && role == CompanyUser.CompanyRole.MANAGER) {
            throw new IllegalArgumentException("Managers can only invite developers");
        }

        invitationService.invite(companyId, userId, req.email(), role);
        return ResponseEntity.ok(Map.of("message", "Invitation sent to " + req.email()));
    }

    @GetMapping
    public ResponseEntity<?> listByCompany(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam UUID companyId
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        companyUserRepository.findByCompanyIdAndUserId(companyId, userId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this company"));

        List<Invitation> invitations = invitationRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
            .stream().filter(inv -> !inv.isUsed()).toList();
        List<Map<String, Object>> result = invitations.stream().map(inv -> Map.<String, Object>of(
            "id", inv.getId(),
            "email", inv.getEmail(),
            "role", inv.getRole().name(),
            "used", inv.isUsed(),
            "expiresAt", inv.getExpiresAt(),
            "createdAt", inv.getCreatedAt()
        )).toList();
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancel(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        Invitation inv = invitationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        companyUserRepository.findByCompanyIdAndUserId(inv.getCompany().getId(), userId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this company"));

        if (inv.isUsed()) {
            throw new IllegalArgumentException("Cannot cancel an already used invitation");
        }

        invitationRepository.delete(inv);
        return ResponseEntity.ok(Map.of("message", "Invitation cancelled"));
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validate(@RequestParam String token) {
        Invitation inv = invitationService.validateToken(token);
        return ResponseEntity.ok(Map.of(
            "email", inv.getEmail(),
            "companyName", inv.getCompany().getName(),
            "role", inv.getRole().name()
        ));
    }

    @PostMapping("/accept")
    public ResponseEntity<?> accept(@Valid @RequestBody AcceptInvitationRequest req, HttpServletResponse response) {
        String jwtToken = invitationService.accept(req.token(), req.firstName(), req.lastName(), req.password());
        Cookie cookie = new Cookie("token", jwtToken);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(86400);
        response.addCookie(cookie);
        return ResponseEntity.ok(Map.of("message", "Welcome! You are now registered."));
    }
}
