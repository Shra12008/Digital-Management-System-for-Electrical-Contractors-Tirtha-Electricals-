package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade.RoleUpgradeRequestCreateDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade.RoleUpgradeRequestResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade.RoleUpgradeReviewDto;
import com.Tirth_Electrical_Main.MainBackend.service.RoleUpgradeRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Coarse role gating (who can hit which endpoint at all) lives in
 * SecurityConfig, matching every other controller in this app. The
 * row-level checks that a path matcher can't express - self-approval,
 * PROJECT_MANAGER's per-request review scope, request ownership - live in
 * RoleUpgradeRequestServiceImpl instead.
 */
@RestController
@RequestMapping("/role-requests")
@RequiredArgsConstructor
public class RoleUpgradeRequestController {

    private final RoleUpgradeRequestService requestService;

    @PostMapping
    public ResponseEntity<RoleUpgradeRequestResponseDto> submit(
            @Valid @RequestBody RoleUpgradeRequestCreateDto request, Authentication authentication) {
        return ResponseEntity.ok(requestService.submitRequest(authentication.getName(), request));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<RoleUpgradeRequestResponseDto>> mine(Authentication authentication) {
        return ResponseEntity.ok(requestService.getMyRequests(authentication.getName()));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<RoleUpgradeRequestResponseDto>> pending(Authentication authentication) {
        return ResponseEntity.ok(requestService.getPendingRequestsForReviewer(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleUpgradeRequestResponseDto> getById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(requestService.getRequestById(id, authentication.getName()));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<RoleUpgradeRequestResponseDto> approve(
            @PathVariable Long id, @Valid @RequestBody(required = false) RoleUpgradeReviewDto review, Authentication authentication) {
        return ResponseEntity.ok(requestService.approveRequest(id, authentication.getName(), review));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<RoleUpgradeRequestResponseDto> reject(
            @PathVariable Long id, @Valid @RequestBody(required = false) RoleUpgradeReviewDto review, Authentication authentication) {
        return ResponseEntity.ok(requestService.rejectRequest(id, authentication.getName(), review));
    }
}
