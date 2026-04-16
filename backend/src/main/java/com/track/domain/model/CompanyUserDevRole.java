package com.track.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "company_user_dev_roles", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_user_id", "dev_role"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyUserDevRole {

    public enum DevRole {
        BACKEND_DEVELOPER,
        FRONTEND_DEVELOPER,
        QA_ENGINEER,
        BUSINESS_ANALYST,
        DESIGNER,
        DEVOPS,
        PRODUCT_MANAGER,
        SCRUM_MASTER,
        TECH_LEAD,
        DATA_ANALYST,
        MOBILE_DEVELOPER,
        FULL_STACK_DEVELOPER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_user_id", nullable = false)
    private CompanyUser companyUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "dev_role", nullable = false)
    private DevRole devRole;
}
