package com.Tirth_Electrical_Main.MainBackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String projectName;

    @Column(nullable = false)
    private String clientName;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String status;

    // budget / startDate / managerId are new - deliberately nullable, since
    // existing project rows have no value for them and a NOT NULL column
    // added to a table that already has rows fails the migration outright.
    @Column(precision = 15, scale = 2)
    private BigDecimal budget;

    @Column
    private LocalDate startDate;

    /** The PROJECT_MANAGER user leading this project (plain FK, same flat convention as the rest of this codebase - no @ManyToOne). */
    @Column
    private Long managerId;

    /**
     * The LABOUR_MANAGER user running this project's on-site crew.
     * Deliberately separate from managerId's own assignment flow (see
     * ProjectServiceImpl) - a PROJECT_MANAGER assigns this one, not just
     * ADMIN, reflecting the actual cascading chain: ADMIN assigns the
     * PROJECT_MANAGER, who then assigns the LABOUR_MANAGER.
     */
    @Column
    private Long labourManagerId;

}
