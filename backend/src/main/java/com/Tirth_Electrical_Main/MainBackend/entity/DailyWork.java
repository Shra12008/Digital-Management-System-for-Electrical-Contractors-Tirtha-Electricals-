package com.Tirth_Electrical_Main.MainBackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "daily_work")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyWork {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private LocalDate workDate;


    private String taskName;

    @Column(length = 500)
    private String description;

    private String status;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne
    @JoinColumn(name = "labour_id")
    private Labour labour;

}