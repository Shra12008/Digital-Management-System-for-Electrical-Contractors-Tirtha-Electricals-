package com.Tirth_Electrical_Main.MainBackend.dtos.dailywork;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyWorkRequestDto {

    private String workDate;

    private String taskName;

    private String description;

    private String status;

    private Long projectId;

    private Long labourId;

}