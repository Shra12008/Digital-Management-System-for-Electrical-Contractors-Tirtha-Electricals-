package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.dailywork.DailyWorkRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.dailywork.DailyWorkResponseDto;
import com.Tirth_Electrical_Main.MainBackend.service.DailyWorkService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/daily-work")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DailyWorkController {

    private final DailyWorkService dailyWorkService;

    // Create Daily Work
    @PostMapping
    public DailyWorkResponseDto createDailyWork(
            @RequestBody DailyWorkRequestDto requestDto) {

        return dailyWorkService.createDailyWork(requestDto);
    }

    // Get All Daily Works
    @GetMapping
    public List<DailyWorkResponseDto> getAllDailyWorks() {

        return dailyWorkService.getAllDailyWorks();
    }

    // Get Daily Work By Id
    @GetMapping("/{id}")
    public DailyWorkResponseDto getDailyWorkById(
            @PathVariable Long id) {

        return dailyWorkService.getDailyWorkById(id);
    }

    // Update Daily Work
    @PutMapping("/{id}")
    public DailyWorkResponseDto updateDailyWork(
            @PathVariable Long id,
            @RequestBody DailyWorkRequestDto requestDto) {

        return dailyWorkService.updateDailyWork(id, requestDto);
    }

    // Delete Daily Work
    @DeleteMapping("/{id}")
    public String deleteDailyWork(
            @PathVariable Long id) {

        dailyWorkService.deleteDailyWork(id);
        return "Daily Work Deleted Successfully";
    }
}


//
//package com.Tirth_Electrical_Main.MainBackend.controller;
//
//import com.Tirth_Electrical_Main.MainBackend.dtos.dailywork.DailyWorkRequestDto;
//import com.Tirth_Electrical_Main.MainBackend.dtos.dailywork.DailyWorkResponseDto;
//import com.Tirth_Electrical_Main.MainBackend.service.DailyWorkService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.web.bind.annotation.*;
//
//        import java.util.List;
//
//@RestController
//@RequestMapping("/api/daily-work")
//@RequiredArgsConstructor
//@CrossOrigin(origins = "*")
//public class DailyWorkController {
//
//    private final DailyWorkService dailyWorkService;
//
//    @PostMapping
//    public DailyWorkResponseDto createDailyWork(@RequestBody DailyWorkRequestDto requestDto) {
//        return dailyWorkService.createDailyWork(requestDto);
//    }
//
//    @GetMapping
//    public List<DailyWorkResponseDto> getAllDailyWorks() {
//        return dailyWorkService.getAllDailyWorks();
//    }
//
//    @GetMapping("/{id}")
//    public DailyWorkResponseDto getDailyWorkById(@PathVariable Long id) {
//        return dailyWorkService.getDailyWorkById(id);
//    }
//
//    @PutMapping("/{id}")
//    public DailyWorkResponseDto updateDailyWork(
//            @PathVariable Long id,
//            @RequestBody DailyWorkRequestDto requestDto) {
//
//        return dailyWorkService.updateDailyWork(id, requestDto);
//    }
//
//    @DeleteMapping("/{id}")
//    public String deleteDailyWork(@PathVariable Long id) {
//
//        dailyWorkService.deleteDailyWork(id);
//
//        return "Daily Work Deleted Successfully";
//    }
//
//}