package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Every send*Email method is @Async (see AsyncConfig) and wraps everything
 * in try/catch - a failed or misconfigured SMTP server logs a warning and
 * returns, it never bubbles up to whatever business operation triggered the
 * email (submitting/approving/rejecting a role request already completed
 * and was already notified in-app before this class is even called).
 *
 * Uses a plain light-background HTML template built with Java text blocks,
 * not the app's own dark UI theme - dark-mode HTML email support is
 * inconsistent across email clients (Outlook desktop in particular renders
 * it badly), so a clean light template with the brand's red accent color is
 * the safer, more universally legible choice for email specifically.
 */
@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from-address:}")
    private String fromAddress;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public EmailServiceImpl(org.springframework.beans.factory.ObjectProvider<JavaMailSender> mailSenderProvider) {
        // ObjectProvider instead of a direct constructor injection so this
        // service can still start up (and simply no-op) if mail isn't
        // configured at all - spring-boot-starter-mail auto-configures a
        // JavaMailSender bean regardless, but this keeps the door open if
        // that ever changes.
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    @Override
    @Async
    public void sendRoleRequestSubmittedEmail(String toEmail, String reviewerName, String applicantName,
                                               String currentRole, String requestedRole, String reason) {
        String subject = "Role upgrade request awaiting your review";
        String body = """
                <p>Hi %s,</p>
                <p><strong>%s</strong> has requested a role change from <strong>%s</strong> to <strong>%s</strong>.</p>
                <p style="background:#f4f5f7;border-radius:8px;padding:12px 16px;color:#374151;">%s</p>
                <p>Log in to the ERP to review and respond to this request.</p>
                """.formatted(escape(reviewerName), escape(applicantName), escape(currentRole), escape(requestedRole), escape(reason));
        send(toEmail, subject, "Role Upgrade Request Submitted", body);
    }

    @Override
    @Async
    public void sendRoleRequestApprovedEmail(String toEmail, String requesterName, String newRole, String reviewerComment) {
        String subject = "Your role upgrade request was approved";
        String commentBlock = (reviewerComment == null || reviewerComment.isBlank())
                ? ""
                : "<p style=\"background:#f4f5f7;border-radius:8px;padding:12px 16px;color:#374151;\"><em>Reviewer note:</em> %s</p>".formatted(escape(reviewerComment));
        String body = """
                <p>Hi %s,</p>
                <p>Good news - your request to become <strong>%s</strong> has been <strong style="color:#16a34a;">approved</strong>.</p>
                %s
                <p>You may need to log out and back in for your new permissions to take effect.</p>
                """.formatted(escape(requesterName), escape(newRole), commentBlock);
        send(toEmail, subject, "Role Upgrade Request Approved", body);
    }

    @Override
    @Async
    public void sendRoleRequestRejectedEmail(String toEmail, String requesterName, String requestedRole, String reviewerComment) {
        String subject = "Your role upgrade request was not approved";
        String commentBlock = (reviewerComment == null || reviewerComment.isBlank())
                ? ""
                : "<p style=\"background:#f4f5f7;border-radius:8px;padding:12px 16px;color:#374151;\"><em>Reviewer note:</em> %s</p>".formatted(escape(reviewerComment));
        String body = """
                <p>Hi %s,</p>
                <p>Your request to become <strong>%s</strong> was <strong style="color:#dc2626;">not approved</strong> this time.</p>
                %s
                <p>If you have questions, reach out to your administrator directly.</p>
                """.formatted(escape(requesterName), escape(requestedRole), commentBlock);
        send(toEmail, subject, "Role Upgrade Request Update", body);
    }

    private void send(String toEmail, String subject, String heading, String bodyHtml) {
        if (mailSender == null || mailHost == null || mailHost.isBlank()) {
            log.info("Email not configured (spring.mail.host is empty) - skipping email to {}: {}", toEmail, subject);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
            }
            helper.setText(wrapTemplate(heading, bodyHtml), true);
            mailSender.send(message);
        } catch (Exception ex) {
            // Never propagate - see class javadoc. The in-app notification
            // (already saved to the DB before this method is ever called)
            // remains the source of truth regardless of email outcome.
            log.warn("Failed to send email to {} ({}) - continuing without it.", toEmail, subject, ex);
        }
    }

    private String wrapTemplate(String heading, String bodyHtml) {
        return """
                <!DOCTYPE html>
                <html>
                <body style="margin:0;padding:0;background:#f0f1f3;font-family:Arial,Helvetica,sans-serif;">
                  <table role="presentation" width="100%%" style="padding:24px 0;">
                    <tr><td align="center">
                      <table role="presentation" width="480" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
                        <tr><td style="background:#111827;padding:20px 28px;">
                          <span style="color:#ffffff;font-size:16px;font-weight:bold;">Tirth Electrical &amp; Services</span>
                        </td></tr>
                        <tr><td style="padding:24px 28px;">
                          <h2 style="margin:0 0 12px 0;color:#111827;font-size:18px;">%s</h2>
                          <div style="color:#374151;font-size:14px;line-height:1.6;">%s</div>
                        </td></tr>
                        <tr><td style="padding:16px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;">
                          This is an automated message from the Tirth Electrical ERP. Please do not reply to this email.
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(heading, bodyHtml);
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
