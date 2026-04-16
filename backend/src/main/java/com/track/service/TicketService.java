package com.track.service;

import com.track.api.dto.CommentRequest;
import com.track.api.dto.TicketRequest;
import com.track.domain.model.*;
import com.track.domain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketHistoryRepository historyRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;
    private final CompanyUserRepository companyUserRepository;
    private final EmailService emailService;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Transactional(readOnly = true)
    public List<Ticket> getAll(UUID companyId) {
        return ticketRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
    }

    @Transactional(readOnly = true)
    public List<Ticket> getBacklog(UUID companyId) {
        return ticketRepository.findBacklogByCompanyId(companyId);
    }

    @Transactional(readOnly = true)
    public List<Ticket> getBySprint(UUID sprintId) {
        return ticketRepository.findBySprintIdOrderByCreatedAtDesc(sprintId);
    }

    @Transactional(readOnly = true)
    public Ticket getById(UUID id) {
        return ticketRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
    }

    @Transactional(readOnly = true)
    public List<TicketHistory> getHistory(UUID ticketId) {
        return historyRepository.findByTicketIdOrderByCreatedAtDesc(ticketId);
    }

    @Transactional
    public Ticket create(UUID companyId, UUID reporterId, TicketRequest req) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        User reporter = userRepository.findById(reporterId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Ticket ticket = Ticket.builder()
            .company(company)
            .title(req.title())
            .description(req.description())
            .build();

        if (req.type() != null) ticket.setType(Ticket.TicketType.valueOf(req.type().toUpperCase()));
        if (req.priority() != null) ticket.setPriority(Ticket.Priority.valueOf(req.priority().toUpperCase()));
        if (req.status() != null) {
            String status = req.status().toUpperCase();
            ticket.setStatus(status);
            if ("IN_PROGRESS".equals(status)) ticket.setInProgressAt(Instant.now());
        }
        ticket.setPoints(req.points());
        ticket.setReporter(reporter);

        int nextNumber = ticketRepository.findMaxTicketNumberByCompanyId(companyId) + 1;
        ticket.setTicketNumber(nextNumber);

        if (req.assigneeId() != null) {
            User assignee = userRepository.findById(req.assigneeId()).orElse(null);
            ticket.setAssignee(assignee);
        }
        if (req.sprintId() != null) {
            Sprint sprint = sprintRepository.findById(req.sprintId()).orElse(null);
            ticket.setSprint(sprint);
        }

        if (req.tags() != null) {
            ticket.getTags().addAll(req.tags().stream()
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList()));
        }

        Ticket saved = ticketRepository.save(ticket);
        historyRepository.save(buildHistory(saved, reporter, "CREATED", null, null, null));
        return saved;
    }

    @Transactional
    public Ticket update(UUID ticketId, UUID userId, TicketRequest req) {
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        User actor = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<TicketHistory> history = new ArrayList<>();

        if (!ticket.getTitle().equals(req.title())) {
            history.add(buildHistory(ticket, actor, "UPDATED", "title", ticket.getTitle(), req.title()));
        }
        ticket.setTitle(req.title());

        if (req.description() != null && !req.description().equals(ticket.getDescription())) {
            history.add(buildHistory(ticket, actor, "UPDATED", "description", "–", "updated"));
        }
        if (req.description() != null) ticket.setDescription(req.description());

        if (req.type() != null) {
            Ticket.TicketType newType = Ticket.TicketType.valueOf(req.type().toUpperCase());
            if (newType != ticket.getType()) {
                history.add(buildHistory(ticket, actor, "UPDATED", "type", ticket.getType().name(), newType.name()));
            }
            ticket.setType(newType);
        }

        if (req.priority() != null) {
            Ticket.Priority newPriority = Ticket.Priority.valueOf(req.priority().toUpperCase());
            if (newPriority != ticket.getPriority()) {
                history.add(buildHistory(ticket, actor, "UPDATED", "priority", ticket.getPriority().name(), newPriority.name()));
            }
            ticket.setPriority(newPriority);
        }

        if (req.status() != null) {
            String newStatus = req.status().toUpperCase();
            if (!newStatus.equals(ticket.getStatus())) {
                history.add(buildHistory(ticket, actor, "UPDATED", "status", ticket.getStatus(), newStatus));
                updateInProgressAt(ticket, newStatus);
            }
            ticket.setStatus(newStatus);
        }

        if (!Objects.equals(ticket.getPoints(), req.points())) {
            history.add(buildHistory(ticket, actor, "UPDATED", "points",
                ticket.getPoints() != null ? ticket.getPoints().toString() : "—",
                req.points() != null ? req.points().toString() : "—"));
        }
        ticket.setPoints(req.points());

        UUID oldAssigneeId = ticket.getAssignee() != null ? ticket.getAssignee().getId() : null;
        String oldAssigneeName = ticket.getAssignee() != null
            ? ticket.getAssignee().getFirstName() + " " + ticket.getAssignee().getLastName()
            : "Unassigned";

        if (req.assigneeId() != null) {
            User assignee = userRepository.findById(req.assigneeId()).orElse(null);
            if (!Objects.equals(oldAssigneeId, req.assigneeId())) {
                String newName = assignee != null
                    ? assignee.getFirstName() + " " + assignee.getLastName()
                    : "Unknown";
                history.add(buildHistory(ticket, actor, "UPDATED", "assignee", oldAssigneeName, newName));
                if (assignee != null) {
                    String ticketKey = ticket.getCompany().getTicketPrefix() + "-" + ticket.getTicketNumber();
                    emailService.sendTicketAssignedEmail(
                        assignee.getEmail(),
                        assignee.getFirstName(),
                        ticketKey,
                        ticket.getTitle(),
                        actor.getFirstName() + " " + actor.getLastName(),
                        frontendUrl + "/dashboard/tickets/" + ticket.getId()
                    );
                }
            }
            ticket.setAssignee(assignee);
        } else if (oldAssigneeId != null) {
            history.add(buildHistory(ticket, actor, "UPDATED", "assignee", oldAssigneeName, "Unassigned"));
            ticket.setAssignee(null);
        }

        UUID oldSprintId = ticket.getSprint() != null ? ticket.getSprint().getId() : null;
        String oldSprintName = ticket.getSprint() != null ? ticket.getSprint().getName() : "Backlog";

        if (req.sprintId() != null) {
            Sprint sprint = sprintRepository.findById(req.sprintId()).orElse(null);
            if (!Objects.equals(oldSprintId, req.sprintId())) {
                String newSprintName = sprint != null ? sprint.getName() : "Unknown";
                history.add(buildHistory(ticket, actor, "UPDATED", "sprint", oldSprintName, newSprintName));
            }
            ticket.setSprint(sprint);
        } else if (oldSprintId != null) {
            history.add(buildHistory(ticket, actor, "UPDATED", "sprint", oldSprintName, "Backlog"));
            ticket.setSprint(null);
        }

        if (req.tags() != null) {
            ticket.getTags().clear();
            ticket.getTags().addAll(req.tags().stream()
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList()));
        }

        Ticket saved = ticketRepository.save(ticket);
        if (!history.isEmpty()) historyRepository.saveAll(history);
        return saved;
    }

    @Transactional
    public Ticket updateStatus(UUID ticketId, String status, UUID userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        String newStatus = status.toUpperCase();
        if (!newStatus.equals(ticket.getStatus())) {
            User actor = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            historyRepository.save(buildHistory(ticket, actor, "UPDATED", "status",
                ticket.getStatus(), newStatus));
            updateInProgressAt(ticket, newStatus);
            ticket.setStatus(newStatus);
        }
        return ticketRepository.save(ticket);
    }

    @Transactional
    public void delete(UUID ticketId) {
        ticketRepository.deleteById(ticketId);
    }

    @Transactional
    public TicketComment addComment(UUID ticketId, UUID authorId, CommentRequest req) {
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        User author = userRepository.findById(authorId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        TicketComment comment = TicketComment.builder()
            .ticket(ticket)
            .author(author)
            .body(req.body())
            .build();
        TicketComment saved = commentRepository.save(comment);

        Pattern mentionPattern = Pattern.compile("@([\\p{L}]+(?:\\s+[\\p{L}]+)?)");
        Matcher matcher = mentionPattern.matcher(req.body());
        Set<UUID> alreadyNotified = new HashSet<>();
        List<CompanyUser> companyUsers = companyUserRepository.findByCompanyId(ticket.getCompany().getId());
        String ticketKey = ticket.getCompany().getTicketPrefix() + "-" + ticket.getTicketNumber();
        String ticketUrl = frontendUrl + "/dashboard/tickets/" + ticket.getId();
        while (matcher.find()) {
            String mentionedText = matcher.group(1).trim().toLowerCase();
            for (CompanyUser cu : companyUsers) {
                User u = cu.getUser();
                if (u.getId().equals(authorId)) continue;
                String fullName = (u.getFirstName() + " " + u.getLastName()).toLowerCase();
                String firstName = u.getFirstName().toLowerCase();
                if ((fullName.equals(mentionedText) || firstName.equals(mentionedText))
                        && alreadyNotified.add(u.getId())) {
                    emailService.sendMentionEmail(
                        u.getEmail(),
                        u.getFirstName(),
                        author.getFirstName() + " " + author.getLastName(),
                        ticketKey,
                        ticket.getTitle(),
                        req.body(),
                        ticketUrl
                    );
                }
            }
        }
        return saved;
    }

    @Transactional
    public void deleteComment(UUID commentId) {
        commentRepository.deleteById(commentId);
    }

    private void updateInProgressAt(Ticket ticket, String newStatus) {
        if ("IN_PROGRESS".equals(newStatus)) {
            ticket.setInProgressAt(Instant.now());
        } else {
            ticket.setInProgressAt(null);
        }
    }

    private TicketHistory buildHistory(Ticket ticket, User actor, String action, String field, String oldValue, String newValue) {
        return TicketHistory.builder()
            .ticket(ticket)
            .user(actor)
            .action(action)
            .field(field)
            .oldValue(oldValue)
            .newValue(newValue)
            .build();
    }
}
