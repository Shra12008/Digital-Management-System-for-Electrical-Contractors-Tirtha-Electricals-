package com.Tirth_Electrical_Main.MainBackend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "labours")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Labour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    private String phone;

    private String address;

    private String skill;

    private Double dailyWage;

    private String status;
}