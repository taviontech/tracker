package com.track.service;

import com.track.domain.model.Plan;
import com.track.domain.model.Subscription;
import com.track.domain.repository.PlanRepository;
import com.track.domain.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlanService {
    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Transactional(readOnly = true)
    public List<Plan> getAllPlans() {
        return planRepository.findAllByActiveTrueOrderByPriceUsdMonthlyAsc();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCompanySubscription(UUID companyId) {
        Subscription sub = subscriptionRepository.findByCompanyId(companyId)
            .orElse(Subscription.builder().companyId(companyId).planTier("FREE").build());
        Plan plan = planRepository.findByTier(sub.getPlanTier())
            .orElse(planRepository.findByTier("FREE").orElseThrow());
        return Map.of("subscription", sub, "plan", plan);
    }

    @Transactional
    public Subscription assignFreePlan(UUID companyId) {
        if (subscriptionRepository.findByCompanyId(companyId).isPresent()) return subscriptionRepository.findByCompanyId(companyId).get();
        Subscription sub = Subscription.builder().companyId(companyId).planTier("FREE").build();
        return subscriptionRepository.save(sub);
    }
}
