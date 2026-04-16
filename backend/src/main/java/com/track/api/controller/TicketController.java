package com.track.api.controller;

import com.track.api.dto.AttachmentRequest;
import com.track.api.dto.CommentRequest;
import com.track.api.dto.TicketHistoryResponse;
import com.track.api.dto.TicketRequest;
import com.track.api.dto.TicketResponse;
import com.track.domain.model.Ticket;
import com.track.domain.model.TicketAttachment;
import com.track.domain.model.TicketComment;
import com.track.domain.model.TicketHistory;
import com.track.domain.repository.CompanyUserRepository;
import com.track.domain.repository.TicketAttachmentRepository;
import com.track.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final CompanyUserRepository companyUserRepository;
    private final TicketAttachmentRepository attachmentRepository;

    @GetMapping
    public ResponseEntity<List<TicketResponse>> list(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam UUID companyId,
        @RequestParam(required = false) UUID sprintId,
        @RequestParam(required = false) Boolean backlog
    ) {
        assertMember(principal, companyId);
        List<Ticket> tickets;
        if (sprintId != null) {
            tickets = ticketService.getBySprint(sprintId);
        } else if (Boolean.TRUE.equals(backlog)) {
            tickets = ticketService.getBacklog(companyId);
        } else {
            tickets = ticketService.getAll(companyId);
        }
        return ResponseEntity.ok(tickets.stream().map(TicketResponse::from).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> get(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id
    ) {
        Ticket ticket = ticketService.getById(id);
        assertMember(principal, ticket.getCompany().getId());
        return ResponseEntity.ok(TicketResponse.from(ticket));
    }

    @PostMapping
    public ResponseEntity<TicketResponse> create(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam UUID companyId,
        @Valid @RequestBody TicketRequest req
    ) {
        assertMember(principal, companyId);
        UUID userId = UUID.fromString(principal.getUsername());
        Ticket ticket = ticketService.create(companyId, userId, req);
        return ResponseEntity.ok(TicketResponse.from(ticket));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketResponse> update(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id,
        @Valid @RequestBody TicketRequest req
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        Ticket ticket = ticketService.getById(id);
        assertMember(principal, ticket.getCompany().getId());
        Ticket updated = ticketService.update(id, userId, req);
        return ResponseEntity.ok(TicketResponse.from(updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id,
        @RequestBody Map<String, String> body
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        Ticket ticket = ticketService.getById(id);
        assertMember(principal, ticket.getCompany().getId());
        Ticket updated = ticketService.updateStatus(id, body.get("status"), userId);
        return ResponseEntity.ok(TicketResponse.from(updated));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TicketHistoryResponse>> getHistory(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id
    ) {
        Ticket ticket = ticketService.getById(id);
        assertMember(principal, ticket.getCompany().getId());
        List<TicketHistory> history = ticketService.getHistory(id);
        return ResponseEntity.ok(history.stream().map(TicketHistoryResponse::from).toList());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id
    ) {
        Ticket ticket = ticketService.getById(id);
        assertMember(principal, ticket.getCompany().getId());
        ticketService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Ticket deleted"));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketResponse.CommentResponse> addComment(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id,
        @Valid @RequestBody CommentRequest req
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        Ticket ticket = ticketService.getById(id);
        assertMember(principal, ticket.getCompany().getId());
        TicketComment comment = ticketService.addComment(id, userId, req);
        var r = new TicketResponse.CommentResponse(
            comment.getId(),
            new TicketResponse.UserSummary(
                comment.getAuthor().getId(), comment.getAuthor().getFirstName(),
                comment.getAuthor().getLastName(), comment.getAuthor().getEmail(),
                comment.getAuthor().getAvatarUrl()),
            comment.getBody(), comment.getCreatedAt(), comment.getUpdatedAt());
        return ResponseEntity.ok(r);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID commentId
    ) {
        ticketService.deleteComment(commentId);
        return ResponseEntity.ok(Map.of("message", "Comment deleted"));
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<TicketResponse.AttachmentResponse> addAttachment(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id,
        @RequestBody AttachmentRequest req
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        Ticket ticket = ticketService.getById(id);
        assertMember(principal, ticket.getCompany().getId());

        TicketAttachment attachment = TicketAttachment.builder()
            .ticket(ticket)
            .fileName(req.fileName())
            .fileUrl(req.fileUrl())
            .fileSize(req.fileSize())
            .mimeType(req.mimeType())
            .build();
        attachment = attachmentRepository.save(attachment);

        var r = new TicketResponse.AttachmentResponse(
            attachment.getId(), attachment.getFileName(), attachment.getFileUrl(),
            attachment.getFileSize(), attachment.getMimeType());
        return ResponseEntity.ok(r);
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<?> deleteAttachment(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID attachmentId
    ) {
        attachmentRepository.deleteById(attachmentId);
        return ResponseEntity.ok(Map.of("message", "Attachment deleted"));
    }

    private void assertMember(UserDetails principal, UUID companyId) {
        UUID userId = UUID.fromString(principal.getUsername());
        companyUserRepository.findByCompanyIdAndUserId(companyId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Not a member of this company"));
    }
}
