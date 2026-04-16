package com.track.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record TicketRequest(
    @NotBlank @Size(max = 500) String title,
    String description,
    String type,
    String priority,
    String status,
    Integer points,
    UUID assigneeId,
    UUID sprintId,
    List<String> tags
) {}
