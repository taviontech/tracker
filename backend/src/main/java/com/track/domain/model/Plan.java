package com.track.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Plan {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false) private String name;
    @Column(nullable = false, unique = true) private String tier;
    @Column(name = "max_managers") private Integer maxManagers;
    @Column(name = "max_modules") private Integer maxModules;
    @Column(name = "max_groups") private Integer maxGroups;
    @Column(name = "max_newbies") private Integer maxNewbies;
    @Column(name = "price_usd_monthly", nullable = false) private BigDecimal priceUsdMonthly;
    @Column(name = "is_active", nullable = false) @Builder.Default private boolean active = true;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @PrePersist void prePersist() { if (createdAt == null) createdAt = Instant.now(); }
}
