package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.inventoryTransaction.InventoryTransactionRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.inventoryTransaction.InventoryTransactionResponseDto;

import java.util.List;

public interface InventoryTransactionService {

    InventoryTransactionResponseDto createTransaction(
            InventoryTransactionRequestDto dto);

    List<InventoryTransactionResponseDto> getAllTransactions();

    InventoryTransactionResponseDto getTransactionById(Long id);

    void deleteTransaction(Long id);
    InventoryTransactionResponseDto updateTransaction(
            Long id,
            InventoryTransactionRequestDto dto);

    List<InventoryTransactionResponseDto> getTransactionsByInventoryId(
            Long inventoryId);
}