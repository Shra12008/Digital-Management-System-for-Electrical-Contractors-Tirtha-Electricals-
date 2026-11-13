package com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class RoleUpgradeRequestResponseDto {
    private Long id;

    private Long requesterId;
    private String requesterName;
    private String requesterEmail;

    private String currentRole;
    private String requestedRole;
    private String reason;
    private String status;

    // Declared identity info submitted with the request (see entity javadoc
    // re: sensitivity). Only ever populated in responses to the requester
    // themselves or an authorized reviewer - enforced by which service
    // methods can return a given request at all, not by redaction here.
    private String applicantFullName;
    private String contactEmail;
    private String contactPhone;
    private String idProofImageBase64;
    private String idProofImageContentType;

    private Long reviewerId;
    private String reviewerName;
    private String reviewerComment;

    private Instant createdAt;
    private Instant updatedAt;
    private Instant reviewedAt;
}
