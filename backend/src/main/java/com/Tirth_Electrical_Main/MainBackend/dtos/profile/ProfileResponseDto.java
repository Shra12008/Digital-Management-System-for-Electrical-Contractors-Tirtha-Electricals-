package com.Tirth_Electrical_Main.MainBackend.dtos.profile;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponseDto {

    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private String phone;
    private String designation;
    private String location;
    /** Data URL of the profile photo, or empty. */
    private String avatar;
}
