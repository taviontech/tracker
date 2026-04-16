package com.track.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.track.api.controller.CompanyController;
import com.track.api.dto.SprintRequest;
import com.track.domain.model.Company;
import com.track.domain.model.Sprint;
import com.track.domain.model.Ticket;
import com.track.domain.model.User;
import com.track.domain.repository.CompanyRepository;
import com.track.domain.repository.SprintRepository;
import com.track.domain.repository.TicketRepository;
import com.track.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Transactional(readOnly = true)
    public List<Sprint> getAll(UUID companyId) {
        return sprintRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
    }

    @Transactional
    public Sprint create(UUID companyId, UUID userId, SprintRequest req) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Sprint sprint = Sprint.builder()
            .company(company)
            .name(req.name())
            .goal(req.goal())
            .startDate(req.startDate())
            .endDate(req.endDate())
            .createdBy(user)
            .build();
        return sprintRepository.save(sprint);
    }

    @Transactional
    public Sprint updateStatus(UUID sprintId, String statusStr) {
        Sprint sprint = sprintRepository.findById(sprintId)
            .orElseThrow(() -> new IllegalArgumentException("Sprint not found"));
        sprint.setStatus(Sprint.SprintStatus.valueOf(statusStr.toUpperCase()));
        return sprintRepository.save(sprint);
    }

    @Transactional
    public Sprint updateColumns(UUID sprintId, List<String> newColumns) {
        Sprint sprint = sprintRepository.findById(sprintId)
            .orElseThrow(() -> new IllegalArgumentException("Sprint not found"));

        List<String> oldColumns = parseColumns(sprint.getColumns());

        List<String> removed = oldColumns.stream()
            .filter(c -> !newColumns.contains(c))
            .toList();
        if (!removed.isEmpty()) {
            List<Ticket> orphaned = ticketRepository.findBySprintIdOrderByCreatedAtDesc(sprintId)
                .stream()
                .filter(t -> removed.contains(t.getStatus()))
                .toList();
            for (Ticket t : orphaned) {
                t.setSprint(null);
                t.setStatus("TODO");
            }
            if (!orphaned.isEmpty()) ticketRepository.saveAll(orphaned);
        }

        List<String> added = newColumns.stream()
            .filter(c -> !oldColumns.contains(c))
            .toList();
        if (!added.isEmpty()) {
            Company company = sprint.getCompany();
            List<String> companyStatuses = new ArrayList<>(CompanyController.parseStatuses(company.getStatuses()));
            for (String s : added) {
                if (!companyStatuses.contains(s)) companyStatuses.add(s);
            }
            try {
                company.setStatuses(MAPPER.writeValueAsString(companyStatuses));
                companyRepository.save(company);
            } catch (Exception ignored) {}
        }

        try {
            sprint.setColumns(MAPPER.writeValueAsString(newColumns));
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize columns", e);
        }
        return sprintRepository.save(sprint);
    }

    @Transactional
    public void delete(UUID sprintId) {
        sprintRepository.deleteById(sprintId);
    }

    private static List<String> parseColumns(String json) {
        if (json == null || json.isBlank()) return List.of("TODO", "IN_PROGRESS", "IN_REVIEW", "DONE");
        try {
            return MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of("TODO", "IN_PROGRESS", "IN_REVIEW", "DONE");
        }
    }
}
