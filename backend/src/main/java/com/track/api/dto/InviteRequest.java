package com.track.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InviteRequest(
    @Email @NotBlank String email,
    @NotNull String role  // CO_OWNER | MANAGER | DEVELOPER
) {}
