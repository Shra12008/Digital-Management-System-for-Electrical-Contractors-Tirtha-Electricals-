package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade.RoleUpgradeRequestCreateDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade.RoleUpgradeRequestResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade.RoleUpgradeReviewDto;
import com.Tirth_Electrical_Main.MainBackend.entity.RequestStatus;
import com.Tirth_Electrical_Main.MainBackend.entity.Role;
import com.Tirth_Electrical_Main.MainBackend.entity.RoleUpgradeRequest;
import com.Tirth_Electrical_Main.MainBackend.entity.User;
import com.Tirth_Electrical_Main.MainBackend.entity.NotificationType;
import com.Tirth_Electrical_Main.MainBackend.exception.ResourceNotFoundException;
import com.Tirth_Electrical_Main.MainBackend.repository.RoleUpgradeRequestRepository;
import com.Tirth_Electrical_Main.MainBackend.repository.UserRepository;
import com.Tirth_Electrical_Main.MainBackend.service.EmailService;
import com.Tirth_Electrical_Main.MainBackend.service.NotificationService;
import com.Tirth_Electrical_Main.MainBackend.service.RoleUpgradeRequestService;
import com.Tirth_Electrical_Main.MainBackend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleUpgradeRequestServiceImpl implements RoleUpgradeRequestService {

    private final RoleUpgradeRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    /**
     * PROJECT_MANAGER's reviewer scope - not defined anywhere in the existing
     * business rules, so this is a deliberate, documented design choice (see
     * chat explanation): PM may only act on requests targeting an
     * operational role they'd plausibly supervise. Everything else
     * (including ADMIN - satisfying "must not grant ADMIN privileges" as a
     * natural consequence rather than a special case) requires an actual
     * ADMIN reviewer.
     */
    private static final Set<Role> PROJECT_MANAGER_REVIEW_SCOPE = EnumSet.of(Role.LABOUR_MANAGER, Role.LABOUR);

    /** Defensive server-side cap, independent of whatever the frontend enforces. */
    private static final int MAX_ID_PROOF_IMAGE_BYTES = 3 * 1024 * 1024;

    @Override
    public RoleUpgradeRequestResponseDto submitRequest(String requesterEmail, RoleUpgradeRequestCreateDto request) {
        User requester = findUserByEmail(requesterEmail);

        if (requester.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("ADMIN is already the highest role - there's nothing to request.");
        }
        if (request.getRequestedRole() == requester.getRole()) {
            throw new IllegalArgumentException("You already have the " + request.getRequestedRole() + " role.");
        }
        if (requestRepository.existsByRequesterIdAndStatus(requester.getId(), RequestStatus.PENDING)) {
            throw new IllegalArgumentException("You already have a pending role upgrade request. Wait for it to be reviewed before submitting another.");
        }
        validateIdProofImage(request.getIdProofImageBase64());

        RoleUpgradeRequest entity = RoleUpgradeRequest.builder()
                .requesterId(requester.getId())
                .currentRole(requester.getRole())
                .requestedRole(request.getRequestedRole())
                .reason(request.getReason())
                .applicantFullName(request.getApplicantFullName())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .idProofImageBase64(request.getIdProofImageBase64())
                .idProofImageContentType(request.getIdProofImageContentType())
                .status(RequestStatus.PENDING)
                .build();

        entity = requestRepository.save(entity);
        // The request itself is already successfully saved at this point -
        // a failure anywhere in notification/email delivery must never make
        // this method look like it failed when it didn't.
        try {
            notifyOnNewRequest(entity, requester);
        } catch (Exception ex) {
            log.warn("Failed to send notifications for new role upgrade request {}", entity.getId(), ex);
        }

        return toDto(entity);
    }

    /**
     * ADMIN always reviews everything, so always notify every ADMIN.
     * PROJECT_MANAGERs are only notified when the requested role is within
     * their review scope - notifying a PM about a request they have no
     * permission to act on would just be noise (and a needless exposure of
     * another user's role-change request and ID proof to someone who can't
     * do anything with it).
     *
     * The requester ALSO gets a notification here - a simple submission
     * confirmation, in-app only (no email; the spec only calls for email on
     * the approve/reject outcomes, not on submission itself) - separate
     * from, and worded differently than, what reviewers receive.
     */
    private void notifyOnNewRequest(RoleUpgradeRequest entity, User requester) {
        notificationService.notifyUser(requester.getId(), NotificationType.ROLE_REQUEST_SUBMITTED,
                "Request submitted",
                "Your role upgrade request from " + entity.getCurrentRole() + " to " + entity.getRequestedRole() + " has been submitted successfully.",
                entity.getId(), "ROLE_UPGRADE_REQUEST");

        List<User> reviewers = new ArrayList<>(userRepository.findByRole(Role.ADMIN));
        if (PROJECT_MANAGER_REVIEW_SCOPE.contains(entity.getRequestedRole())) {
            reviewers.addAll(userRepository.findByRole(Role.PROJECT_MANAGER));
        }

        String title = "New role upgrade request";
        String message = requester.getFullName() + " has requested a role upgrade from " + entity.getCurrentRole() + " to " + entity.getRequestedRole() + ".";

        for (User reviewer : reviewers) {
            notificationService.notifyUser(reviewer.getId(), NotificationType.ROLE_REQUEST_SUBMITTED, title, message,
                    entity.getId(), "ROLE_UPGRADE_REQUEST");
            emailService.sendRoleRequestSubmittedEmail(reviewer.getEmail(), reviewer.getFullName(), requester.getFullName(),
                    entity.getCurrentRole().name(), entity.getRequestedRole().name(), entity.getReason());
        }
    }

    private void validateIdProofImage(String base64) {
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("The ID proof image wasn't a valid image upload.");
        }
        if (decoded.length > MAX_ID_PROOF_IMAGE_BYTES) {
            throw new IllegalArgumentException("The ID proof image is too large (max 3 MB).");
        }
    }

    @Override
    public List<RoleUpgradeRequestResponseDto> getMyRequests(String requesterEmail) {
        User requester = findUserByEmail(requesterEmail);
        return requestRepository.findByRequesterIdOrderByCreatedAtDesc(requester.getId())
                .stream().map(this::toDto).toList();
    }

    @Override
    public List<RoleUpgradeRequestResponseDto> getPendingRequestsForReviewer(String reviewerEmail) {
        User reviewer = findUserByEmail(reviewerEmail);

        return requestRepository.findByStatusOrderByCreatedAtAsc(RequestStatus.PENDING).stream()
                // Exclude the reviewer's own request even if its target role
                // is within their scope - decide() blocks the actual
                // approve/reject either way (self-approval check), but
                // showing your own request in your own review queue is
                // confusing and shouldn't happen in the first place.
                .filter(r -> !r.getRequesterId().equals(reviewer.getId()))
                .filter(r -> canReview(reviewer, r))
                .map(this::toDto)
                .toList();
    }

    @Override
    public RoleUpgradeRequestResponseDto getRequestById(Long id, String requestingUserEmail) {
        User user = findUserByEmail(requestingUserEmail);
        RoleUpgradeRequest entity = findRequestOrThrow(id);

        boolean isOwnRequest = entity.getRequesterId().equals(user.getId());
        if (!isOwnRequest && !canReview(user, entity)) {
            throw new IllegalArgumentException("You don't have permission to view this request.");
        }

        return toDto(entity);
    }

    @Override
    public RoleUpgradeRequestResponseDto approveRequest(Long id, String reviewerEmail, RoleUpgradeReviewDto review) {
        return decide(id, reviewerEmail, review, RequestStatus.APPROVED);
    }

    @Override
    public RoleUpgradeRequestResponseDto rejectRequest(Long id, String reviewerEmail, RoleUpgradeReviewDto review) {
        if (review == null || review.getComment() == null || review.getComment().isBlank()) {
            throw new IllegalArgumentException("A comment is required when rejecting a request.");
        }
        return decide(id, reviewerEmail, review, RequestStatus.REJECTED);
    }

    private RoleUpgradeRequestResponseDto decide(Long id, String reviewerEmail, RoleUpgradeReviewDto review, RequestStatus decision) {
        User reviewer = findUserByEmail(reviewerEmail);
        RoleUpgradeRequest entity = findRequestOrThrow(id);

        if (entity.getStatus() != RequestStatus.PENDING) {
            throw new IllegalArgumentException("This request has already been reviewed (" + entity.getStatus() + ") and can't be changed.");
        }
        if (entity.getRequesterId().equals(reviewer.getId())) {
            throw new IllegalArgumentException("You can't review your own request.");
        }
        if (!canReview(reviewer, entity)) {
            throw new IllegalArgumentException("You don't have permission to review a request targeting " + entity.getRequestedRole() + ".");
        }

        entity.setStatus(decision);
        entity.setReviewerId(reviewer.getId());
        entity.setReviewerComment(review != null ? review.getComment() : null);
        entity.setReviewedAt(Instant.now());

        // Reuse UserServiceImpl.updateRole (Phase 1) for the actual account
        // mutation rather than duplicating it here, so its last-ADMIN /
        // self-demotion safeguards stay the single source of truth for
        // changing a real account's role. (Neither can actually fire on this
        // path in practice - ADMIN users are blocked from submitting a
        // request at all in submitRequest() above - but going through the
        // shared method means that stays true by construction, not by
        // coincidence, if this code changes later.)
        if (decision == RequestStatus.APPROVED) {
            userService.updateRole(entity.getRequesterId(), entity.getRequestedRole(), reviewer.getEmail());
        }

        RoleUpgradeRequest saved = requestRepository.save(entity);
        // Same reasoning as submitRequest() above - the approve/reject
        // decision (including the actual role change via userService,
        // already applied above) is already committed by this point.
        try {
            notifyRequesterOfDecision(saved, reviewer);
        } catch (Exception ex) {
            log.warn("Failed to notify requester of decision on role upgrade request {}", saved.getId(), ex);
        }

        return toDto(saved);
    }

    private void notifyRequesterOfDecision(RoleUpgradeRequest entity, User reviewer) {
        User requester = userRepository.findById(entity.getRequesterId()).orElse(null);
        if (requester == null) {
            return; // requester account no longer exists - nothing to notify
        }

        boolean approved = entity.getStatus() == RequestStatus.APPROVED;
        String title = approved ? "Role upgrade approved" : "Role upgrade rejected";
        // Matches the requested wording exactly: "Your role has been
        // upgraded from LABOUR to PROJECT_MANAGER by [Reviewer Name]." -
        // includes previous role and reviewer name, not just the outcome.
        // The "when" (approval/rejection date) is the notification's own
        // createdAt timestamp, already shown by the frontend - not
        // duplicated into the message text itself.
        String message = approved
                ? "Your role has been upgraded from " + entity.getCurrentRole() + " to " + entity.getRequestedRole() + " by " + reviewer.getFullName() + "."
                : "Your request to upgrade from " + entity.getCurrentRole() + " to " + entity.getRequestedRole() + " was rejected by " + reviewer.getFullName() + ".";
        if (entity.getReviewerComment() != null && !entity.getReviewerComment().isBlank()) {
            message += " Comment: " + entity.getReviewerComment();
        }

        notificationService.notifyUser(requester.getId(),
                approved ? NotificationType.ROLE_REQUEST_APPROVED : NotificationType.ROLE_REQUEST_REJECTED,
                title, message, entity.getId(), "ROLE_UPGRADE_REQUEST");

        if (approved) {
            emailService.sendRoleRequestApprovedEmail(requester.getEmail(), requester.getFullName(),
                    entity.getRequestedRole().name(), entity.getReviewerComment());
        } else {
            emailService.sendRoleRequestRejectedEmail(requester.getEmail(), requester.getFullName(),
                    entity.getRequestedRole().name(), entity.getReviewerComment());
        }
    }

    /** ADMIN can review anything; PROJECT_MANAGER only within PROJECT_MANAGER_REVIEW_SCOPE; no one else reviews. */
    private boolean canReview(User reviewer, RoleUpgradeRequest request) {
        if (reviewer.getRole() == Role.ADMIN) {
            return true;
        }
        if (reviewer.getRole() == Role.PROJECT_MANAGER) {
            return PROJECT_MANAGER_REVIEW_SCOPE.contains(request.getRequestedRole());
        }
        return false;
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    private RoleUpgradeRequest findRequestOrThrow(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role upgrade request not found."));
    }

    private RoleUpgradeRequestResponseDto toDto(RoleUpgradeRequest r) {
        User requester = userRepository.findById(r.getRequesterId()).orElse(null);
        User reviewer = r.getReviewerId() != null ? userRepository.findById(r.getReviewerId()).orElse(null) : null;

        return new RoleUpgradeRequestResponseDto(
                r.getId(),
                r.getRequesterId(),
                requester != null ? requester.getFullName() : "(deleted user)",
                requester != null ? requester.getEmail() : "",
                r.getCurrentRole().name(),
                r.getRequestedRole().name(),
                r.getReason(),
                r.getStatus().name(),
                r.getApplicantFullName(),
                r.getContactEmail(),
                r.getContactPhone(),
                r.getIdProofImageBase64(),
                r.getIdProofImageContentType(),
                r.getReviewerId(),
                reviewer != null ? reviewer.getFullName() : null,
                r.getReviewerComment(),
                r.getCreatedAt(),
                r.getUpdatedAt(),
                r.getReviewedAt()
        );
    }
}
