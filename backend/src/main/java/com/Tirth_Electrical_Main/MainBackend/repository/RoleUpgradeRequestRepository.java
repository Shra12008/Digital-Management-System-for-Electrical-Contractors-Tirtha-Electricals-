package com.Tirth_Electrical_Main.MainBackend.repository;

import com.Tirth_Electrical_Main.MainBackend.entity.RequestStatus;
import com.Tirth_Electrical_Main.MainBackend.entity.RoleUpgradeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoleUpgradeRequestRepository extends JpaRepository<RoleUpgradeRequest, Long> {

    List<RoleUpgradeRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    List<RoleUpgradeRequest> findByStatusOrderByCreatedAtAsc(RequestStatus status);

    boolean existsByRequesterIdAndStatus(Long requesterId, RequestStatus status);
}
