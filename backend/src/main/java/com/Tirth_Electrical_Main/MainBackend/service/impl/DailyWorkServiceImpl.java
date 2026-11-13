package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.dailywork.DailyWorkRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.dailywork.DailyWorkResponseDto;
import com.Tirth_Electrical_Main.MainBackend.entity.DailyWork;
import com.Tirth_Electrical_Main.MainBackend.entity.Labour;
import com.Tirth_Electrical_Main.MainBackend.entity.Project;
import com.Tirth_Electrical_Main.MainBackend.exception.ResourceNotFoundException;
import com.Tirth_Electrical_Main.MainBackend.repository.DailyWorkRepository;
import com.Tirth_Electrical_Main.MainBackend.repository.LabourRepository;
import com.Tirth_Electrical_Main.MainBackend.repository.ProjectRepository;
import com.Tirth_Electrical_Main.MainBackend.service.DailyWorkService;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyWorkServiceImpl implements DailyWorkService {

    private final DailyWorkRepository dailyWorkRepository;
    private final ProjectRepository projectRepository;
    private final LabourRepository labourRepository;
    private final ModelMapper modelMapper;

    @Override
    public DailyWorkResponseDto createDailyWork(@NonNull DailyWorkRequestDto requestDto) {

//        DailyWork dailyWork = modelMapper.map(requestDto, DailyWork.class);

        DailyWork dailyWork = new DailyWork();

        dailyWork.setTaskName(requestDto.getTaskName());
        dailyWork.setDescription(requestDto.getDescription());
        dailyWork.setStatus(requestDto.getStatus());
        dailyWork.setWorkDate(LocalDate.parse(requestDto.getWorkDate()));

//        dailyWork.setWorkDate(LocalDate.parse(requestDto.getWorkDate()));

        Project project = projectRepository.findById(requestDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project Not Found"));

        Labour labour = labourRepository.findById(requestDto.getLabourId())
                .orElseThrow(() -> new ResourceNotFoundException("Labour Not Found"));

        dailyWork.setProject(project);
        dailyWork.setLabour(labour);

        DailyWork savedDailyWork = dailyWorkRepository.save(dailyWork);

//        DailyWorkResponseDto responseDto =
//                modelMapper.map(savedDailyWork, DailyWorkResponseDto.class);
        DailyWorkResponseDto responseDto = new DailyWorkResponseDto();

        responseDto.setId(savedDailyWork.getId());
        responseDto.setTaskName(savedDailyWork.getTaskName());
        responseDto.setDescription(savedDailyWork.getDescription());
        responseDto.setStatus(savedDailyWork.getStatus());
        responseDto.setWorkDate(savedDailyWork.getWorkDate().toString());

        responseDto.setProjectId(project.getId());
        responseDto.setProjectName(project.getProjectName());

        responseDto.setLabourId(labour.getId());
        responseDto.setLabourName(labour.getFullName());

        responseDto.setProjectId(project.getId());
        responseDto.setProjectName(project.getProjectName());

        responseDto.setLabourId(labour.getId());
        responseDto.setLabourName(labour.getFullName());

        responseDto.setWorkDate(savedDailyWork.getWorkDate().toString());

        return responseDto;
    }

    @Override
    public List<DailyWorkResponseDto> getAllDailyWorks() {

        return dailyWorkRepository.findAll()
                .stream()
                .map(work -> {

//                    DailyWorkResponseDto dto =
//                            modelMapper.map(work, DailyWorkResponseDto.class);
                    DailyWorkResponseDto dto = new DailyWorkResponseDto();

                    dto.setId(work.getId());
                    dto.setWorkDate(work.getWorkDate().toString());
                    dto.setTaskName(work.getTaskName());
                    dto.setDescription(work.getDescription());
                    dto.setStatus(work.getStatus());

                    dto.setProjectId(work.getProject().getId());
                    dto.setProjectName(work.getProject().getProjectName());

                    dto.setLabourId(work.getLabour().getId());
                    dto.setLabourName(work.getLabour().getFullName());

                    dto.setProjectId(work.getProject().getId());
                    dto.setProjectName(work.getProject().getProjectName());

                    dto.setLabourId(work.getLabour().getId());
                    dto.setLabourName(work.getLabour().getFullName());

                    dto.setWorkDate(work.getWorkDate().toString());

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public DailyWorkResponseDto getDailyWorkById(Long id) {

        DailyWork work = dailyWorkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daily Work Not Found"));

//        DailyWorkResponseDto dto =
//                modelMapper.map(work, DailyWorkResponseDto.class);
        DailyWorkResponseDto dto = new DailyWorkResponseDto();

        dto.setId(work.getId());
        dto.setWorkDate(work.getWorkDate().toString());
        dto.setTaskName(work.getTaskName());
        dto.setDescription(work.getDescription());
        dto.setStatus(work.getStatus());

        dto.setProjectId(work.getProject().getId());
        dto.setProjectName(work.getProject().getProjectName());

        dto.setLabourId(work.getLabour().getId());
        dto.setLabourName(work.getLabour().getFullName());

        dto.setProjectId(work.getProject().getId());
        dto.setProjectName(work.getProject().getProjectName());

        dto.setLabourId(work.getLabour().getId());
        dto.setLabourName(work.getLabour().getFullName());

        dto.setWorkDate(work.getWorkDate().toString());

        return dto;
    }

    @Override
    public DailyWorkResponseDto updateDailyWork(Long id, DailyWorkRequestDto requestDto) {

        DailyWork work = dailyWorkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daily Work Not Found"));

//        modelMapper.map(requestDto, work); // caz not working in postman

        work.setWorkDate(LocalDate.parse(requestDto.getWorkDate()));

        Project project = projectRepository.findById(requestDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project Not Found"));

        Labour labour = labourRepository.findById(requestDto.getLabourId())
                .orElseThrow(() -> new ResourceNotFoundException("Labour Not Found"));

        work.setProject(project);
        work.setLabour(labour);

        DailyWork updatedWork = dailyWorkRepository.save(work);

//        DailyWorkResponseDto dto =
//                modelMapper.map(updatedWork, DailyWorkResponseDto.class);
        DailyWorkResponseDto dto = new DailyWorkResponseDto();

        dto.setId(work.getId());
        dto.setWorkDate(work.getWorkDate().toString());
        dto.setTaskName(work.getTaskName());
        dto.setDescription(work.getDescription());
        dto.setStatus(work.getStatus());

        dto.setProjectId(work.getProject().getId());
        dto.setProjectName(work.getProject().getProjectName());

        dto.setLabourId(work.getLabour().getId());
        dto.setLabourName(work.getLabour().getFullName());//

        dto.setProjectId(project.getId());
        dto.setProjectName(project.getProjectName());

        dto.setLabourId(labour.getId());
        dto.setLabourName(labour.getFullName());

        dto.setWorkDate(updatedWork.getWorkDate().toString());

        return dto;
    }

    @Override
    public void deleteDailyWork(Long id) {

        DailyWork work = dailyWorkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daily Work Not Found"));

        dailyWorkRepository.delete(work);
    }
}