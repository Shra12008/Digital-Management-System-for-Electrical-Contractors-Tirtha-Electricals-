package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.project.ProjectRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.project.ProjectResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.project.UserSummaryDto;
import com.Tirth_Electrical_Main.MainBackend.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ProjectResponseDto createProject(@Valid @RequestBody ProjectRequestDto requestDto,
                                            Authentication authentication) {
        return projectService.createProject(requestDto, authentication.getName());
    }

    @GetMapping
    public List<ProjectResponseDto> getAllProjects() {
        return projectService.getAllProjects();
    }

    // The two dropdown endpoints below are literal paths, so Spring MVC
    // always prefers them over the "/{id}" variable mapping - listed first
    // purely for readability.
    @GetMapping("/managers")
    public List<UserSummaryDto> getAvailableManagers() {
        return projectService.getAvailableManagers();
    }

    @GetMapping("/labour-managers")
    public List<UserSummaryDto> getAvailableLabourManagers() {
        return projectService.getAvailableLabourManagers();
    }

    @GetMapping("/{id}")
    public ProjectResponseDto getProject(@PathVariable Long id) {
        return projectService.getProjectById(id);
    }

    @PutMapping("/{id}")
    public ProjectResponseDto updateProject(@PathVariable Long id,
                                            @Valid @RequestBody ProjectRequestDto requestDto,
                                            Authentication authentication) {
        return projectService.updateProject(id, requestDto, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public void deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
    }
}
