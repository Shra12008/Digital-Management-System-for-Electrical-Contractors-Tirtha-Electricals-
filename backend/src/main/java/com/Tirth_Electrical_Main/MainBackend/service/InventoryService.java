package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.inventory.InventoryRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.inventory.InventoryResponseDto;

import java.util.List;

public interface InventoryService {

    InventoryResponseDto createMaterial(InventoryRequestDto dto);

    List<InventoryResponseDto> getAllMaterials();

    InventoryResponseDto getMaterialById(Long id);

    InventoryResponseDto updateMaterial(Long id,
                                        InventoryRequestDto dto);

    void deleteMaterial(Long id);

}