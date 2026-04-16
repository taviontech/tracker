package com.track.api.controller;

import com.track.service.PlanService;
import com.track.domain.model.Plan;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {
    private final PlanService planService;

    @GetMapping
    public ResponseEntity<List<Plan>> getPlans() {
        return ResponseEntity.ok(planService.getAllPlans());
    }

    @GetMapping("/subscription")
    public ResponseEntity<Map<String, Object>> getSubscription(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam UUID companyId
    ) {
        return ResponseEntity.ok(planService.getCompanySubscription(companyId));
    }
}
