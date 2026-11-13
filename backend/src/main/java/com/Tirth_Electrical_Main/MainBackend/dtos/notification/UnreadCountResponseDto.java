package com.Tirth_Electrical_Main.MainBackend.dtos.notification;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UnreadCountResponseDto {
    private long count;
}
