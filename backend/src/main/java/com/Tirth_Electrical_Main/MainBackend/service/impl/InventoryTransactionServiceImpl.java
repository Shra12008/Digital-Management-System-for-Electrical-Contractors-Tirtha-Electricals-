package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.inventoryTransaction.InventoryTransactionRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.inventoryTransaction.InventoryTransactionResponseDto;
import com.Tirth_Electrical_Main.MainBackend.entity.Inventory;
import com.Tirth_Electrical_Main.MainBackend.entity.InventoryTransaction;
import com.Tirth_Electrical_Main.MainBackend.exception.ResourceNotFoundException;
import com.Tirth_Electrical_Main.MainBackend.repository.InventoryRepository;
import com.Tirth_Electrical_Main.MainBackend.repository.InventoryTransactionRepository;
import com.Tirth_Electrical_Main.MainBackend.service.InventoryTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryTransactionServiceImpl
        implements InventoryTransactionService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;

    @Override
    public InventoryTransactionResponseDto createTransaction(InventoryTransactionRequestDto dto) {

        Inventory inventory = inventoryRepository.findById(dto.getInventoryId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Material Not Found"));

        // ISSUE
        if(dto.getTransactionType().equalsIgnoreCase("ISSUE")){

            if(inventory.getStock() < dto.getQuantity()){
                throw new RuntimeException("Insufficient Stock");
            }

            inventory.setStock(inventory.getStock() - dto.getQuantity());

            System.out.println("Updated Stock = " + inventory.getStock());

            inventoryRepository.save(inventory);
        }

        // RECEIVE
        else if(dto.getTransactionType().equalsIgnoreCase("RECEIVE")){

            inventory.setStock(
                    inventory.getStock() + dto.getQuantity()
            );
        }

        inventoryRepository.save(inventory);

        InventoryTransaction transaction = InventoryTransaction.builder()
                .transactionType(dto.getTransactionType())
                .quantity(dto.getQuantity())
                .transactionDate(LocalDate.parse(dto.getTransactionDate()))
                .referenceNumber(dto.getReferenceNumber())
                .remarks(dto.getRemarks())
                .issuedBy(dto.getIssuedBy())
                .inventory(inventory)
                .build();

        InventoryTransaction saved =
                transactionRepository.save(transaction);

        return mapToResponse(saved);
    }

    @Override
    public List<InventoryTransactionResponseDto> getAllTransactions() {

        return transactionRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public InventoryTransactionResponseDto getTransactionById(Long id) {

        InventoryTransaction transaction =
                transactionRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException("Transaction Not Found"));

        return mapToResponse(transaction);
    }

    @Override
    public List<InventoryTransactionResponseDto> getTransactionsByInventoryId(
            Long inventoryId) {

        // Check whether inventory exists
        inventoryRepository.findById(inventoryId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Material Not Found"));

        return transactionRepository.findByInventoryId(inventoryId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteTransaction(Long id) {

        InventoryTransaction transaction =
                transactionRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException("Transaction Not Found"));

        transactionRepository.delete(transaction);
    }

    private InventoryTransactionResponseDto mapToResponse(
            InventoryTransaction transaction){

        InventoryTransactionResponseDto dto =
                new InventoryTransactionResponseDto();

        dto.setId(transaction.getId());
        dto.setTransactionType(transaction.getTransactionType());
        dto.setQuantity(transaction.getQuantity());
        dto.setTransactionDate(transaction.getTransactionDate().toString());
        dto.setReferenceNumber(transaction.getReferenceNumber());
        dto.setRemarks(transaction.getRemarks());
        dto.setIssuedBy(transaction.getIssuedBy());

        dto.setInventoryId(transaction.getInventory().getId());
        dto.setItemName(transaction.getInventory().getItemName());

        return dto;
    }

    @Override
    public InventoryTransactionResponseDto updateTransaction(
            Long id,
            InventoryTransactionRequestDto dto) {

        // Find old transaction
        InventoryTransaction transaction =
                transactionRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException("Transaction Not Found"));

        Inventory oldInventory = transaction.getInventory();

        int oldQuantity = transaction.getQuantity();

        // Reverse the effect of old transaction
        if (transaction.getTransactionType().equalsIgnoreCase("ISSUE")) {

            oldInventory.setStock(
                    oldInventory.getStock() + oldQuantity
            );

        } else if (transaction.getTransactionType().equalsIgnoreCase("RECEIVE")) {

            if (oldInventory.getStock() < oldQuantity) {
                throw new RuntimeException(
                        "Cannot update transaction because stock is insufficient"
                );
            }

            oldInventory.setStock(
                    oldInventory.getStock() - oldQuantity
            );
        }

        inventoryRepository.save(oldInventory);


        // Find new inventory
        Inventory newInventory =
                inventoryRepository.findById(dto.getInventoryId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException("Material Not Found"));


        // Apply new transaction
        if (dto.getTransactionType().equalsIgnoreCase("ISSUE")) {

            if (newInventory.getStock() < dto.getQuantity()) {
                throw new RuntimeException("Insufficient Stock");
            }

            newInventory.setStock(
                    newInventory.getStock() - dto.getQuantity()
            );

        } else if (dto.getTransactionType().equalsIgnoreCase("RECEIVE")) {

            newInventory.setStock(
                    newInventory.getStock() + dto.getQuantity()
            );

        } else {

            throw new RuntimeException(
                    "Invalid Transaction Type. Use ISSUE or RECEIVE"
            );
        }

        inventoryRepository.save(newInventory);


        // Update transaction details
        transaction.setTransactionType(dto.getTransactionType());
        transaction.setQuantity(dto.getQuantity());
        transaction.setTransactionDate(
                LocalDate.parse(dto.getTransactionDate())
        );
        transaction.setReferenceNumber(dto.getReferenceNumber());
        transaction.setRemarks(dto.getRemarks());
        transaction.setIssuedBy(dto.getIssuedBy());
        transaction.setInventory(newInventory);


        InventoryTransaction updated =
                transactionRepository.save(transaction);

        return mapToResponse(updated);
    }


}