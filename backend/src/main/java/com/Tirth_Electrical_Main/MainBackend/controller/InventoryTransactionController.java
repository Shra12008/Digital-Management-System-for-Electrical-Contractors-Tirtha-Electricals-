package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.inventoryTransaction.InventoryTransactionRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.inventoryTransaction.InventoryTransactionResponseDto;
import com.Tirth_Electrical_Main.MainBackend.service.InventoryTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory-transaction")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InventoryTransactionController {

    private final InventoryTransactionService transactionService;

    @PostMapping
    public InventoryTransactionResponseDto create(
            @RequestBody InventoryTransactionRequestDto dto){

        return transactionService.createTransaction(dto);
    }

    @GetMapping
    public List<InventoryTransactionResponseDto> getAll(){

        return transactionService.getAllTransactions();
    }

    @GetMapping("/inventory/{inventoryId}")
    public List<InventoryTransactionResponseDto> getByInventoryId(
            @PathVariable Long inventoryId) {

        return transactionService
                .getTransactionsByInventoryId(inventoryId);
    }

    @GetMapping("/{id}")
    public InventoryTransactionResponseDto getById(
            @PathVariable Long id){

        return transactionService.getTransactionById(id);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id){

        transactionService.deleteTransaction(id);
        return "Transaction Deleted Successfully";
    }

    @PutMapping("/{id}")
    public InventoryTransactionResponseDto update(
            @PathVariable Long id,
            @RequestBody InventoryTransactionRequestDto dto) {

        return transactionService.updateTransaction(id, dto);
    }
}