package com.track.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Subscription {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "company_id", nullable = false, unique = true) private UUID companyId;
    @Column(name = "plan_tier", nullable = false) @Builder.Default private String planTier = "FREE";
    @Column(name = "started_at", nullable = false) private Instant startedAt;
    @Column(name = "expires_at") private Instant expiresAt;
    @PrePersist void prePersist() { if (startedAt == null) startedAt = Instant.now(); }
}
