package com.Tirth_Electrical_Main.MainBackend.dtos.labour;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabourRequestDto {

    private String fullName;

    private String phone;

    private String address;

    private String skill;

    private Double dailyWage;

    private String status;
}