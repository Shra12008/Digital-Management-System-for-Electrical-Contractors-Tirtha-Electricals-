package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.labour.*;
import com.Tirth_Electrical_Main.MainBackend.service.LabourService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/labours")
@RequiredArgsConstructor
public class LabourController {

    private final LabourService labourService;

    @PostMapping
    public LabourResponseDto createLabour(@RequestBody LabourRequestDto requestDto) {
        return labourService.createLabour(requestDto);
    }

    @GetMapping
    public List<LabourResponseDto> getAllLabours() {
        return labourService.getAllLabours();
    }

    @GetMapping("/{id}")
    public LabourResponseDto getLabourById(@PathVariable Long id) {
        return labourService.getLabourById(id);
    }

    @PutMapping("/{id}")
    public LabourResponseDto updateLabour(@PathVariable Long id,
                                          @RequestBody LabourRequestDto requestDto) {
        return labourService.updateLabour(id, requestDto);
    }

    @DeleteMapping("/{id}")
    public void deleteLabour(@PathVariable Long id) {
        labourService.deleteLabour(id);
    }
}