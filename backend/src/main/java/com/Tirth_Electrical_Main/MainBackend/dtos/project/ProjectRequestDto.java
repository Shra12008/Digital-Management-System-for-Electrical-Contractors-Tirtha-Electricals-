package com.Tirth_Electrical_Main.MainBackend.dtos.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectRequestDto {

    @NotBlank(message = "Project Name is required")
    private String projectName;

    @NotBlank(message = "Client Name is required")
    private String clientName;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Status is required")
    private String status;

    @PositiveOrZero(message = "Budget can't be negative")
    private BigDecimal budget;

    private LocalDate startDate;

    /** Optional. If set, must be the id of an existing PROJECT_MANAGER user - checked in ProjectServiceImpl. */
    private Long managerId;

    /** Optional. If set, must be the id of an existing LABOUR_MANAGER user - checked in ProjectServiceImpl. */
    private Long labourManagerId;

}
