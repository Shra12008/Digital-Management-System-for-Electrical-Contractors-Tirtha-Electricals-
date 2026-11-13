package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade.RoleUpgradeRequestCreateDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade.RoleUpgradeRequestResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade.RoleUpgradeReviewDto;

import java.util.List;

/**
 * All methods take the ACTING user's email (from the JWT via
 * Authentication.getName(), same pattern as AuthController/UserController)
 * rather than trusting an id from the request body - this is what "use JWT
 * identity instead of accepting the requester ID blindly" means in practice.
 */
public interface RoleUpgradeRequestService {

    RoleUpgradeRequestResponseDto submitRequest(String requesterEmail, RoleUpgradeRequestCreateDto request);

    List<RoleUpgradeRequestResponseDto> getMyRequests(String requesterEmail);

    /** Pending requests within the caller's reviewer scope (ADMIN sees all; PROJECT_MANAGER sees only LABOUR_MANAGER/LABOUR-targeted ones). */
    List<RoleUpgradeRequestResponseDto> getPendingRequestsForReviewer(String reviewerEmail);

    RoleUpgradeRequestResponseDto getRequestById(Long id, String requestingUserEmail);

    RoleUpgradeRequestResponseDto approveRequest(Long id, String reviewerEmail, RoleUpgradeReviewDto review);

    RoleUpgradeRequestResponseDto rejectRequest(Long id, String reviewerEmail, RoleUpgradeReviewDto review);
}
