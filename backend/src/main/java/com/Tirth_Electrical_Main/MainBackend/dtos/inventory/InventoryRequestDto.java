package com.Tirth_Electrical_Main.MainBackend.dtos.inventory;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryRequestDto {

    private String itemName;

    private String category;

    private Integer stock;

    private String unit;

    private Double unitRate;

    private String location;

}