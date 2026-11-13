package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.inventory.InventoryRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.inventory.InventoryResponseDto;
import com.Tirth_Electrical_Main.MainBackend.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping
    public InventoryResponseDto createMaterial(
            @RequestBody InventoryRequestDto dto){

        return inventoryService.createMaterial(dto);
    }

    @GetMapping
    public List<InventoryResponseDto> getAllMaterials(){

        return inventoryService.getAllMaterials();
    }

    @GetMapping("/{id}")
    public InventoryResponseDto getMaterialById(
            @PathVariable Long id){

        return inventoryService.getMaterialById(id);
    }

    @PutMapping("/{id}")
    public InventoryResponseDto updateMaterial(
            @PathVariable Long id,
            @RequestBody InventoryRequestDto dto){

        return inventoryService.updateMaterial(id,dto);
    }

    @DeleteMapping("/{id}")
    public String deleteMaterial(
            @PathVariable Long id){

        inventoryService.deleteMaterial(id);

        return "Material Deleted Successfully";
    }

}