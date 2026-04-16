package com.track.api.controller;

import com.track.api.dto.UserResponse;
import com.track.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(UserResponse.from(profileService.getProfile(userId)));
    }

    @PatchMapping
    public ResponseEntity<UserResponse> updateProfile(
        @AuthenticationPrincipal UserDetails principal,
        @RequestBody Map<String, String> body
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(UserResponse.from(profileService.updateProfile(
            userId, body.get("firstName"), body.get("lastName"), body.get("phone"), body.get("avatarUrl")
        )));
    }

    @PatchMapping("/company/{companyId}")
    public ResponseEntity<?> updateCompany(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID companyId,
        @RequestBody Map<String, String> body
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        profileService.updateCompanyName(userId, companyId, body.get("name"));
        return ResponseEntity.ok(Map.of("message", "Company updated"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
        @AuthenticationPrincipal UserDetails principal,
        @RequestBody Map<String, String> body
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        profileService.changePassword(userId, body.get("currentPassword"), body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
