package com.track.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${contact.sender-name:TrackerHub}")
    private String senderName;

    @Async
    public void sendVerificationEmail(String toEmail, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        String subject = "Confirm your email — " + senderName;
        String html = buildEmail(
            "Confirm Your Email",
            "You're almost there! Click the button below to verify your email address.",
            "Confirm Email",
            link,
            "This link expires in 24 hours. If you didn't create an account, you can safely ignore this email."
        );
        sendHtml(toEmail, subject, html);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        String subject = "Reset your password — " + senderName;
        String html = buildEmail(
            "Reset Your Password",
            "We received a request to reset your password. Click the button below to choose a new one.",
            "Reset Password",
            link,
            "This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email."
        );
        sendHtml(toEmail, subject, html);
    }

    @Async
    public void sendInvitationEmail(String toEmail, String companyName, String role, String token) {
        String link = frontendUrl + "/invite/accept?token=" + token;
        String roleLabel = "MANAGER".equals(role) ? "Manager" : "Team Member";
        String subject = "You're invited to join " + companyName + " — " + senderName;
        String html = buildEmail(
            "You're Invited! \uD83C\uDF89",
            "You've been invited to join <strong>" + escapeHtml(companyName) + "</strong> as a <strong>" + escapeHtml(roleLabel) + "</strong> on " + senderName + ". Click below to accept and set up your account.",
            "Accept Invitation",
            link,
            "This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it."
        );
        sendHtml(toEmail, subject, html);
    }

    @Async
    public void sendTicketAssignedEmail(String toEmail, String assigneeName, String ticketKey,
                                         String ticketTitle, String assignedByName, String ticketUrl) {
        String subject = "You've been assigned to " + ticketKey + " — " + senderName;
        String html = buildEmail(
            "New Ticket Assigned 📋",
            "Hi <strong>" + escapeHtml(assigneeName) + "</strong>!<br><br>"
            + "<strong>" + escapeHtml(assignedByName) + "</strong> assigned you to:<br>"
            + "<strong>" + escapeHtml(ticketKey) + ": " + escapeHtml(ticketTitle) + "</strong>",
            "View Ticket",
            ticketUrl,
            "This is an automated notification from " + senderName + "."
        );
        sendHtml(toEmail, subject, html);
    }

    @Async
    public void sendMentionEmail(String toEmail, String mentionedName, String commenterName,
                                  String ticketKey, String ticketTitle, String commentBody, String ticketUrl) {
        String subject = commenterName + " mentioned you in " + ticketKey + " — " + senderName;
        String html = buildEmail(
            "You Were Mentioned 💬",
            "Hi <strong>" + escapeHtml(mentionedName) + "</strong>!<br><br>"
            + "<strong>" + escapeHtml(commenterName) + "</strong> mentioned you in "
            + "<strong>" + escapeHtml(ticketKey) + ": " + escapeHtml(ticketTitle) + "</strong>:<br><br>"
            + "<div style=\"margin:12px 0;padding:12px 16px;background:#f8fafc;border-left:4px solid #3b82f6;"
            + "border-radius:4px;color:#475569;font-style:italic\">" + escapeHtml(commentBody) + "</div>",
            "View Ticket",
            ticketUrl,
            "This is an automated notification from " + senderName + "."
        );
        sendHtml(toEmail, subject, html);
    }

    @Async
    public void sendContactEmail(String recipientEmail, String name, String email, String phone, String message) {
        String subject = "New message from " + name + " — " + senderName;
        String html = "<div style=\"font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px\">"
            + "<h2 style=\"color:#2563eb;margin-bottom:16px\">New Contact Message</h2>"
            + "<table style=\"width:100%;border-collapse:collapse\">"
            + "<tr><td style=\"padding:8px 0;color:#64748b;width:100px\">Name:</td><td style=\"padding:8px 0;color:#0f172a;font-weight:600\">" + escapeHtml(name) + "</td></tr>"
            + "<tr><td style=\"padding:8px 0;color:#64748b\">Email:</td><td style=\"padding:8px 0;color:#0f172a\">" + escapeHtml(email) + "</td></tr>"
            + "<tr><td style=\"padding:8px 0;color:#64748b\">Phone:</td><td style=\"padding:8px 0;color:#0f172a\">" + escapeHtml(phone != null ? phone : "—") + "</td></tr>"
            + "</table>"
            + "<hr style=\"border:none;border-top:1px solid #e2e8f0;margin:16px 0\">"
            + "<p style=\"color:#64748b;font-size:14px;margin-bottom:4px\">Message:</p>"
            + "<p style=\"color:#0f172a;white-space:pre-wrap\">" + escapeHtml(message) + "</p>"
            + "</div>";
        sendHtml(recipientEmail, subject, html);
    }

    private String buildEmail(String title, String body, String btnText, String btnUrl, String footer) {
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body style=\"margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif\">"
            + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f8fafc;padding:40px 16px\">"
            + "<tr><td align=\"center\">"
            + "<table width=\"100%\" style=\"max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)\">"
            + "<tr><td style=\"background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px 40px;text-align:center\">"
            + "<h1 style=\"margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px\">" + senderName + "</h1>"
            + "</td></tr>"
            + "<tr><td style=\"padding:40px 40px 32px\">"
            + "<h2 style=\"margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:700\">" + title + "</h2>"
            + "<p style=\"margin:0 0 32px;color:#475569;font-size:15px;line-height:1.6\">" + body + "</p>"
            + "<a href=\"" + btnUrl + "\" style=\"display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px\">" + btnText + "</a>"
            + "</td></tr>"
            + "<tr><td style=\"padding:24px 40px;border-top:1px solid #f1f5f9\">"
            + "<p style=\"margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.5\">" + footer + "</p>"
            + "<p style=\"margin:0;color:#cbd5e1;font-size:12px\">Or copy this link: <a href=\"" + btnUrl + "\" style=\"color:#2563eb\">" + btnUrl + "</a></p>"
            + "</td></tr>"
            + "<tr><td style=\"padding:20px 40px;background:#f8fafc;text-align:center\">"
            + "<p style=\"margin:0;color:#94a3b8;font-size:12px\">&copy; 2024 " + senderName + ". All rights reserved.</p>"
            + "</td></tr>"
            + "</table></td></tr></table>"
            + "</body></html>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
            log.debug("Email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
