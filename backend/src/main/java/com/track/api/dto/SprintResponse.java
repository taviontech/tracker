package com.track.api.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.track.domain.model.Sprint;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SprintResponse(
    UUID id,
    String name,
    String goal,
    String status,
    LocalDate startDate,
    LocalDate endDate,
    Instant createdAt,
    List<String> columns
) {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final List<String> DEFAULT_COLUMNS = List.of("TODO", "IN_PROGRESS", "IN_REVIEW", "DONE");

    public static SprintResponse from(Sprint s) {
        return new SprintResponse(s.getId(), s.getName(), s.getGoal(),
            s.getStatus().name(), s.getStartDate(), s.getEndDate(), s.getCreatedAt(),
            parseColumns(s.getColumns()));
    }

    private static List<String> parseColumns(String json) {
        if (json == null || json.isBlank()) return DEFAULT_COLUMNS;
        try {
            return MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return DEFAULT_COLUMNS;
        }
    }
}
