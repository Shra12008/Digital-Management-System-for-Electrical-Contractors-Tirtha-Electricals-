package com.Tirth_Electrical_Main.MainBackend.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Extra profile data for a user. The account itself (name, email, phone, role)
 * stays on User; this table only holds what the Settings page adds on top.
 * userId is the same value as app_user.id.
 */
@Entity
@Table(name = "user_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    private Long userId;

    @Column(length = 80)
    private String designation;

    @Column(length = 120)
    private String location;

    /** Small square JPEG as a data URL (the client crops it to 256x256). */
    @Column(columnDefinition = "TEXT")
    private String avatar;
}
