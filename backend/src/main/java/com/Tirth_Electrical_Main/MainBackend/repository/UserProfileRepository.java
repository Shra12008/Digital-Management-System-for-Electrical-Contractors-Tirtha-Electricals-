package com.Tirth_Electrical_Main.MainBackend.repository;

import com.Tirth_Electrical_Main.MainBackend.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
}
