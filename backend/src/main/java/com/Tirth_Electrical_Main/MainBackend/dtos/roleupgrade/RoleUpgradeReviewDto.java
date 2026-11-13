package com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Used for both approve and reject. Comment is optional on approve;
 * RoleUpgradeRequestServiceImpl requires it specifically for reject
 * (a rejection reason is more useful to the requester than an approval one -
 * "optional/required" in the spec was left to us to decide).
 */
@Data
public class RoleUpgradeReviewDto {

    @Size(max = 1000, message = "Comment must be 1000 characters or fewer")
    private String comment;
}
