package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.dailywork.DailyWorkRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.dailywork.DailyWorkResponseDto;

import java.util.List;

public interface DailyWorkService {

    DailyWorkResponseDto createDailyWork(DailyWorkRequestDto requestDto);

    List<DailyWorkResponseDto> getAllDailyWorks();

    DailyWorkResponseDto getDailyWorkById(Long id);

    DailyWorkResponseDto updateDailyWork(Long id, DailyWorkRequestDto requestDto);

    void deleteDailyWork(Long id);

}