package com.Tirth_Electrical_Main.MainBackend.dtos.dailywork;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyWorkResponseDto {

    private Long id;

    private String workDate;

    private String taskName;

    private String description;

    private String status;

    private Long projectId;

    private String projectName;

    private Long labourId;

    private String labourName;

}