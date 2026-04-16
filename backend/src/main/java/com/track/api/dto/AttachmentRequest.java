package com.track.api.dto;

public record AttachmentRequest(
    String fileName,
    String fileUrl,
    Long fileSize,
    String mimeType
) {}
