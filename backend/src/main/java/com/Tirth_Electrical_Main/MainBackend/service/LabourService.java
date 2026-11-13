package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.labour.*;

import java.util.List;

public interface LabourService {

    LabourResponseDto createLabour(LabourRequestDto requestDto);

    List<LabourResponseDto> getAllLabours();

    LabourResponseDto getLabourById(Long id);

    LabourResponseDto updateLabour(Long id, LabourRequestDto requestDto);

    void deleteLabour(Long id);
}