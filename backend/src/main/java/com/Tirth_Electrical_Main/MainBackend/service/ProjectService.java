package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.project.ProjectRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.project.ProjectResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.project.UserSummaryDto;

import java.util.List;

public interface ProjectService {

    /**
     * actingUserEmail comes from the JWT (Authentication.getName()), never
     * from the request body - it decides who is allowed to assign which
     * manager (see ProjectServiceImpl.authorizeAssignments) and who gets
     * named as the assigner in the resulting notifications.
     */
    ProjectResponseDto createProject(ProjectRequestDto requestDto, String actingUserEmail);

    List<ProjectResponseDto> getAllProjects();

    ProjectResponseDto getProjectById(Long id);

    ProjectResponseDto updateProject(Long id, ProjectRequestDto requestDto, String actingUserEmail);

    void deleteProject(Long id);

    /** For the "assign a project manager" dropdown - every user with the PROJECT_MANAGER role. */
    List<UserSummaryDto> getAvailableManagers();

    /** For the "assign a labour manager" dropdown - every user with the LABOUR_MANAGER role. */
    List<UserSummaryDto> getAvailableLabourManagers();
}
