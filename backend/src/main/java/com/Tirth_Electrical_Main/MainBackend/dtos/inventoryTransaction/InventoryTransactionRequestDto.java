package com.Tirth_Electrical_Main.MainBackend.dtos.inventoryTransaction;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransactionRequestDto {

    private String transactionType;

    private Integer quantity;

    private String transactionDate;

    private String referenceNumber;

    private String remarks;

    private String issuedBy;

    private Long inventoryId;
}