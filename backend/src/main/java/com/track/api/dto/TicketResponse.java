package com.track.api.dto;

import com.track.domain.model.Ticket;
import com.track.domain.model.TicketComment;
import com.track.domain.model.TicketAttachment;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TicketResponse(
    UUID id,
    String ticketKey,
    String title,
    String description,
    String type,
    String priority,
    String status,
    Integer points,
    UserSummary reporter,
    UserSummary assignee,
    SprintSummary sprint,
    List<CommentResponse> comments,
    List<AttachmentResponse> attachments,
    List<String> tags,
    Instant inProgressAt,
    Instant createdAt,
    Instant updatedAt
) {
    public record UserSummary(UUID id, String firstName, String lastName, String email, String avatarUrl) {}
    public record SprintSummary(UUID id, String name, String status) {}
    public record CommentResponse(UUID id, UserSummary author, String body, Instant createdAt, Instant updatedAt) {}
    public record AttachmentResponse(UUID id, String fileName, String fileUrl, Long fileSize, String mimeType) {}

    public static TicketResponse from(Ticket t) {
        String ticketKey = t.getCompany().getTicketPrefix() + "-" + t.getTicketNumber();
        UserSummary reporter = t.getReporter() == null ? null : new UserSummary(
            t.getReporter().getId(), t.getReporter().getFirstName(), t.getReporter().getLastName(),
            t.getReporter().getEmail(), t.getReporter().getAvatarUrl());
        UserSummary assignee = t.getAssignee() == null ? null : new UserSummary(
            t.getAssignee().getId(), t.getAssignee().getFirstName(), t.getAssignee().getLastName(),
            t.getAssignee().getEmail(), t.getAssignee().getAvatarUrl());
        SprintSummary sprint = t.getSprint() == null ? null : new SprintSummary(
            t.getSprint().getId(), t.getSprint().getName(), t.getSprint().getStatus().name());

        List<CommentResponse> comments = t.getComments().stream().map(c -> new CommentResponse(
            c.getId(),
            new UserSummary(c.getAuthor().getId(), c.getAuthor().getFirstName(), c.getAuthor().getLastName(),
                c.getAuthor().getEmail(), c.getAuthor().getAvatarUrl()),
            c.getBody(), c.getCreatedAt(), c.getUpdatedAt()
        )).toList();

        List<AttachmentResponse> attachments = t.getAttachments().stream().map(a -> new AttachmentResponse(
            a.getId(), a.getFileName(), a.getFileUrl(), a.getFileSize(), a.getMimeType()
        )).toList();

        List<String> tags = t.getTags() != null ? List.copyOf(t.getTags()) : List.of();

        return new TicketResponse(t.getId(), ticketKey, t.getTitle(), t.getDescription(),
            t.getType().name(), t.getPriority().name(), t.getStatus(),
            t.getPoints(), reporter, assignee, sprint, comments, attachments, tags,
            t.getInProgressAt(), t.getCreatedAt(), t.getUpdatedAt());
    }
}
