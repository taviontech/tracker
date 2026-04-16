package com.track.api.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record SprintRequest(
    @NotBlank String name,
    String goal,
    LocalDate startDate,
    LocalDate endDate
) {}
