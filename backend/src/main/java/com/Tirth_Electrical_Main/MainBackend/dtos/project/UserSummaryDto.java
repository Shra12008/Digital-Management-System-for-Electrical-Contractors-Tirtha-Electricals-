package com.Tirth_Electrical_Main.MainBackend.dtos.project;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Deliberately minimal (just enough for a dropdown) - reusing the full
 * UserResponseDto here would expose phone/email to every role that can
 * read /projects/**, not just ADMIN. Used for BOTH the "assign a project
 * manager" and "assign a labour manager" dropdowns (it was originally
 * named ProjectManagerSummaryDto before the second use case existed).
 */
@Data
@AllArgsConstructor
public class UserSummaryDto {
    private Long id;
    private String fullName;
}
