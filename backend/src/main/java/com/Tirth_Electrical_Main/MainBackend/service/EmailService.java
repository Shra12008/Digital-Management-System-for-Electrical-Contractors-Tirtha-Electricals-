package com.Tirth_Electrical_Main.MainBackend.service;

/**
 * Role-Upgrade-Request-specific templates live here (not in
 * NotificationService, which stays generic) - see NotificationService's
 * javadoc for why. Every method is @Async in the implementation and never
 * throws back to its caller - see EmailServiceImpl.
 */
public interface EmailService {

    void sendRoleRequestSubmittedEmail(String toEmail, String reviewerName, String applicantName,
                                        String currentRole, String requestedRole, String reason);

    void sendRoleRequestApprovedEmail(String toEmail, String requesterName, String newRole, String reviewerComment);

    void sendRoleRequestRejectedEmail(String toEmail, String requesterName, String requestedRole, String reviewerComment);
}
