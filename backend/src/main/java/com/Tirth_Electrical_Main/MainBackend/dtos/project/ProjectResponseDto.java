package com.Tirth_Electrical_Main.MainBackend.dtos.project;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponseDto {

    private Long id;

    private String projectName;

    private String clientName;

    private String location;

    private String status;

    private BigDecimal budget;

    private LocalDate startDate;

    private Long managerId;

    /** Resolved server-side from managerId in ProjectServiceImpl.toDto - the frontend never needs a separate user lookup to show it. */
    private String managerName;

    private Long labourManagerId;

    /** Resolved server-side from labourManagerId, same as managerName above. */
    private String labourManagerName;

}
