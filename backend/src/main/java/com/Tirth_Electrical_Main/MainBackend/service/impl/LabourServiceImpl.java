package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.labour.*;
import com.Tirth_Electrical_Main.MainBackend.entity.Labour;
import com.Tirth_Electrical_Main.MainBackend.exception.ResourceNotFoundException;
import com.Tirth_Electrical_Main.MainBackend.repository.LabourRepository;
import com.Tirth_Electrical_Main.MainBackend.service.LabourService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LabourServiceImpl implements LabourService {

    private final LabourRepository labourRepository;
    private final ModelMapper modelMapper;

    @Override
    public LabourResponseDto createLabour(LabourRequestDto requestDto) {

        Labour labour = modelMapper.map(requestDto, Labour.class);

        Labour savedLabour = labourRepository.save(labour);

        return modelMapper.map(savedLabour, LabourResponseDto.class);
    }

    @Override
    public List<LabourResponseDto> getAllLabours() {

        return labourRepository.findAll()
                .stream()
                .map(labour -> modelMapper.map(labour, LabourResponseDto.class))
                .toList();
    }

    @Override
    public LabourResponseDto getLabourById(Long id) {

        Labour labour = labourRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Labour Not Found"));

        return modelMapper.map(labour, LabourResponseDto.class);
    }

    @Override
    public LabourResponseDto updateLabour(Long id, LabourRequestDto requestDto) {

        Labour labour = labourRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Labour Not Found"));

        labour.setFullName(requestDto.getFullName());
        labour.setPhone(requestDto.getPhone());
        labour.setAddress(requestDto.getAddress());
        labour.setSkill(requestDto.getSkill());
        labour.setDailyWage(requestDto.getDailyWage());
        labour.setStatus(requestDto.getStatus());

        Labour updatedLabour = labourRepository.save(labour);

        return modelMapper.map(updatedLabour, LabourResponseDto.class);
    }

    @Override
    public void deleteLabour(Long id) {

        Labour labour = labourRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Labour Not Found"));

        labourRepository.delete(labour);
    }
}