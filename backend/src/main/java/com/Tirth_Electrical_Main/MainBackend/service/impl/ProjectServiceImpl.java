package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.project.ProjectRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.project.ProjectResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.project.UserSummaryDto;
import com.Tirth_Electrical_Main.MainBackend.entity.NotificationType;
import com.Tirth_Electrical_Main.MainBackend.entity.Project;
import com.Tirth_Electrical_Main.MainBackend.entity.Role;
import com.Tirth_Electrical_Main.MainBackend.entity.User;
import com.Tirth_Electrical_Main.MainBackend.exception.ResourceNotFoundException;
import com.Tirth_Electrical_Main.MainBackend.repository.ProjectRepository;
import com.Tirth_Electrical_Main.MainBackend.repository.UserRepository;
import com.Tirth_Electrical_Main.MainBackend.service.NotificationService;
import com.Tirth_Electrical_Main.MainBackend.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

/**
 * Assignment chain: ADMIN assigns a PROJECT_MANAGER to a project; that
 * PROJECT_MANAGER then assigns a LABOUR_MANAGER to it. Each assignment
 * notifies the person assigned (in-app + real-time via NotificationService).
 *
 * Project <-> DTO mapping is done by hand below instead of ModelMapper:
 * ModelMapper's name-token matching can treat managerId and labourManagerId
 * as ambiguous matches for each other (both contain the tokens "manager" +
 * "id") and fail at runtime, and with only a handful of fields explicit
 * mapping is both safer and easier to verify by reading.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    public ProjectResponseDto createProject(ProjectRequestDto requestDto, String actingUserEmail) {

        User actor = findUserByEmail(actingUserEmail);
        User manager = validateManager(requestDto.getManagerId());
        User labourManager = validateLabourManager(requestDto.getLabourManagerId());

        // A brand-new project has no current assignments to compare against.
        authorizeAssignments(actor, null, requestDto.getManagerId(), null, requestDto.getLabourManagerId());

        Project project = Project.builder()
                .projectName(requestDto.getProjectName())
                .clientName(requestDto.getClientName())
                .location(requestDto.getLocation())
                .status(requestDto.getStatus())
                .budget(requestDto.getBudget())
                .startDate(requestDto.getStartDate())
                .managerId(requestDto.getManagerId())
                .labourManagerId(requestDto.getLabourManagerId())
                .build();

        Project saved = projectRepository.save(project);

        notifyAssignee(saved, manager, actor, "project manager");
        notifyAssignee(saved, labourManager, actor, "labour manager");

        return toDto(saved);
    }

    @Override
    public List<ProjectResponseDto> getAllProjects() {

        return projectRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public ProjectResponseDto getProjectById(Long id) {

        return toDto(findProjectOrThrow(id));
    }

    @Override
    public ProjectResponseDto updateProject(Long id, ProjectRequestDto requestDto, String actingUserEmail) {

        Project project = findProjectOrThrow(id);
        User actor = findUserByEmail(actingUserEmail);

        User manager = validateManager(requestDto.getManagerId());
        User labourManager = validateLabourManager(requestDto.getLabourManagerId());

        Long previousManagerId = project.getManagerId();
        Long previousLabourManagerId = project.getLabourManagerId();

        authorizeAssignments(actor, previousManagerId, requestDto.getManagerId(),
                previousLabourManagerId, requestDto.getLabourManagerId());

        project.setProjectName(requestDto.getProjectName());
        project.setClientName(requestDto.getClientName());
        project.setLocation(requestDto.getLocation());
        project.setStatus(requestDto.getStatus());
        project.setBudget(requestDto.getBudget());
        project.setStartDate(requestDto.getStartDate());
        project.setManagerId(requestDto.getManagerId());
        project.setLabourManagerId(requestDto.getLabourManagerId());

        Project updated = projectRepository.save(project);

        // Only notify when an assignee is actually NEW (freshly assigned or
        // changed to a different person) - re-saving a project whose
        // managers didn't change must not re-notify them every time
        // someone edits an unrelated field like status or budget.
        if (!Objects.equals(previousManagerId, updated.getManagerId())) {
            notifyAssignee(updated, manager, actor, "project manager");
        }
        if (!Objects.equals(previousLabourManagerId, updated.getLabourManagerId())) {
            notifyAssignee(updated, labourManager, actor, "labour manager");
        }

        return toDto(updated);
    }

    @Override
    public void deleteProject(Long id) {

        projectRepository.delete(findProjectOrThrow(id));
    }

    @Override
    public List<UserSummaryDto> getAvailableManagers() {
        return usersWithRole(Role.PROJECT_MANAGER);
    }

    @Override
    public List<UserSummaryDto> getAvailableLabourManagers() {
        return usersWithRole(Role.LABOUR_MANAGER);
    }

    private List<UserSummaryDto> usersWithRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(u -> new UserSummaryDto(u.getId(), u.getFullName()))
                .toList();
    }

    /**
     * Who may assign what (enforced here, not just hidden in the UI):
     *
     *  - ADMIN: may set or change either assignment freely.
     *  - PROJECT_MANAGER (SecurityConfig already keeps every other role out
     *    of the write endpoints):
     *      * may NOT change the project's manager - with one exception: a
     *        project with no manager yet may be claimed by the PM
     *        themselves (so a PM who creates a project can then run it).
     *      * may change the labour manager only on a project they are the
     *        manager of.
     *
     * Without this, any PROJECT_MANAGER could reassign anyone's project or
     * assign labour managers to projects they don't lead - which would also
     * let them trigger "you've been assigned" notifications about work
     * that isn't theirs.
     */
    private void authorizeAssignments(User actor, Long currentManagerId, Long newManagerId,
                                      Long currentLabourManagerId, Long newLabourManagerId) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }

        boolean managerChanging = !Objects.equals(currentManagerId, newManagerId);
        boolean claimingUnassigned = currentManagerId == null && actor.getId().equals(newManagerId);
        if (managerChanging && !claimingUnassigned) {
            throw new IllegalArgumentException("Only an ADMIN can assign or change a project's manager.");
        }

        boolean labourManagerChanging = !Objects.equals(currentLabourManagerId, newLabourManagerId);
        if (labourManagerChanging && !actor.getId().equals(newManagerId)) {
            // newManagerId == the project's manager after the rule above (it
            // can only differ from the current one in the claim case).
            throw new IllegalArgumentException("Only the project's own manager or an ADMIN can assign its labour manager.");
        }
    }

    /** Null id is allowed (nothing assigned yet); a non-null one must reference a real PROJECT_MANAGER. */
    private User validateManager(Long managerId) {
        return validateRole(managerId, Role.PROJECT_MANAGER, "project manager");
    }

    /** Null id is allowed (nothing assigned yet); a non-null one must reference a real LABOUR_MANAGER. */
    private User validateLabourManager(Long labourManagerId) {
        return validateRole(labourManagerId, Role.LABOUR_MANAGER, "labour manager");
    }

    private User validateRole(Long userId, Role requiredRole, String label) {
        if (userId == null) {
            return null;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("No user found for the selected " + label + "."));
        if (user.getRole() != requiredRole) {
            throw new IllegalArgumentException(user.getFullName() + " is not a " + requiredRole + " and can't be assigned as " + label + ".");
        }
        return user;
    }

    /**
     * No-op when nothing is assigned, or when the assignee is the person
     * doing the assigning (telling someone they assigned themselves is just
     * noise). Never throws - the project is already saved by the time this
     * runs, and a notification failure must not make that look like it
     * failed.
     */
    private void notifyAssignee(Project project, User assignee, User actor, String roleLabel) {
        if (assignee == null || assignee.getId().equals(actor.getId())) {
            return;
        }
        try {
            String message = actor.getFullName() + " assigned you as " + roleLabel + " on \"" + project.getProjectName()
                    + "\" (" + project.getClientName() + ", " + project.getLocation() + "). Status: " + project.getStatus() + ".";
            notificationService.notifyUser(assignee.getId(), NotificationType.PROJECT_ASSIGNED,
                    "New project assigned", message, project.getId(), "PROJECT");
        } catch (Exception ex) {
            log.warn("Failed to notify {} of their new {} assignment on project {}",
                    assignee.getEmail(), roleLabel, project.getId(), ex);
        }
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    private Project findProjectOrThrow(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project Not Found"));
    }

    private ProjectResponseDto toDto(Project project) {
        return ProjectResponseDto.builder()
                .id(project.getId())
                .projectName(project.getProjectName())
                .clientName(project.getClientName())
                .location(project.getLocation())
                .status(project.getStatus())
                .budget(project.getBudget())
                .startDate(project.getStartDate())
                .managerId(project.getManagerId())
                .managerName(nameOf(project.getManagerId()))
                .labourManagerId(project.getLabourManagerId())
                .labourManagerName(nameOf(project.getLabourManagerId()))
                .build();
    }

    private String nameOf(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId).map(User::getFullName).orElse(null);
    }
}
