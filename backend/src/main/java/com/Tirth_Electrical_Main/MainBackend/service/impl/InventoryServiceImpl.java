package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.inventory.InventoryRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.inventory.InventoryResponseDto;
import com.Tirth_Electrical_Main.MainBackend.entity.Inventory;
import com.Tirth_Electrical_Main.MainBackend.exception.ResourceNotFoundException;
import com.Tirth_Electrical_Main.MainBackend.repository.InventoryRepository;
import com.Tirth_Electrical_Main.MainBackend.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;

    @Override
    public InventoryResponseDto createMaterial(InventoryRequestDto dto) {

        Inventory inventory = Inventory.builder()
                .itemName(dto.getItemName())
                .category(dto.getCategory())
                .stock(dto.getStock())
                .unit(dto.getUnit())
                .unitRate(dto.getUnitRate())
                .location(dto.getLocation())
                .build();

        Inventory saved = inventoryRepository.save(inventory);

        return mapToResponse(saved);
    }

    @Override
    public List<InventoryResponseDto> getAllMaterials() {

        return inventoryRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public InventoryResponseDto getMaterialById(Long id) {

        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Material Not Found"));

        return mapToResponse(inventory);
    }

    @Override
    public InventoryResponseDto updateMaterial(Long id,
                                               InventoryRequestDto dto) {

        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Material Not Found"));

        inventory.setItemName(dto.getItemName());
        inventory.setCategory(dto.getCategory());
        inventory.setStock(dto.getStock());
        inventory.setUnit(dto.getUnit());
        inventory.setUnitRate(dto.getUnitRate());
        inventory.setLocation(dto.getLocation());

        Inventory updated = inventoryRepository.save(inventory);

        return mapToResponse(updated);
    }

    @Override
    public void deleteMaterial(Long id) {

        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Material Not Found"));

        inventoryRepository.delete(inventory);
    }

    private InventoryResponseDto mapToResponse(Inventory inventory){

        InventoryResponseDto dto = new InventoryResponseDto();

        dto.setId(inventory.getId());
        dto.setItemName(inventory.getItemName());
        dto.setCategory(inventory.getCategory());
        dto.setStock(inventory.getStock());
        dto.setUnit(inventory.getUnit());
        dto.setUnitRate(inventory.getUnitRate());
        dto.setLocation(inventory.getLocation());

        dto.setTotalValue(
                inventory.getStock() * inventory.getUnitRate()
        );

        return dto;
    }

}