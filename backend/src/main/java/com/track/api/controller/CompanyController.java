package com.track.api.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.track.domain.model.Company;
import com.track.domain.repository.CompanyRepository;
import com.track.domain.repository.CompanyUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final List<String> DEFAULT_STATUSES = List.of("TODO", "IN_PROGRESS", "IN_REVIEW", "DONE");

    @GetMapping("/{id}/statuses")
    public ResponseEntity<List<String>> getStatuses(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id
    ) {
        assertMember(principal, id);
        Company company = companyRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        return ResponseEntity.ok(parseStatuses(company.getStatuses()));
    }

    @SuppressWarnings("unchecked")
    @PatchMapping("/{id}/statuses")
    public ResponseEntity<List<String>> updateStatuses(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id,
        @RequestBody Map<String, Object> body
    ) {
        assertMember(principal, id);
        Company company = companyRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        List<String> statuses = (List<String>) body.get("statuses");
        if (statuses == null) statuses = new ArrayList<>(DEFAULT_STATUSES);
        for (String def : DEFAULT_STATUSES) {
            if (!statuses.contains(def)) statuses.add(0, def);
        }
        try {
            company.setStatuses(MAPPER.writeValueAsString(statuses));
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize statuses", e);
        }
        companyRepository.save(company);
        return ResponseEntity.ok(statuses);
    }

    public static List<String> parseStatuses(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>(DEFAULT_STATUSES);
        try {
            return MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>(DEFAULT_STATUSES);
        }
    }

    private void assertMember(UserDetails principal, UUID companyId) {
        UUID userId = UUID.fromString(principal.getUsername());
        companyUserRepository.findByCompanyIdAndUserId(companyId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Not a member of this company"));
    }
}
