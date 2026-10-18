package com.narniano.rural_sala_de_aula.classes.grupo;

import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "grupos")
public class Grupo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(table = "turmas", nullable = false)
    private Turma turma;

    private String name;
}
