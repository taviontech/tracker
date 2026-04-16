package com.track.api.controller;

import com.track.api.dto.UserResponse;
import com.track.service.AdminService;
import com.track.domain.model.Company;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getUsers(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllUsers(pageable).map(UserResponse::from));
    }

    @GetMapping("/companies")
    public ResponseEntity<List<Company>> getCompanies() {
        return ResponseEntity.ok(adminService.getAllCompanies());
    }

    @PatchMapping("/users/{userId}/block")
    public ResponseEntity<UserResponse> blockUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(UserResponse.from(adminService.blockUser(userId)));
    }

    @PatchMapping("/users/{userId}/unblock")
    public ResponseEntity<UserResponse> unblockUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(UserResponse.from(adminService.unblockUser(userId)));
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(
        @PathVariable UUID userId,
        @RequestBody Map<String, String> body
    ) {
        return ResponseEntity.ok(UserResponse.from(
            adminService.updateUser(userId, body.get("firstName"), body.get("lastName"), body.get("email"))
        ));
    }
}
