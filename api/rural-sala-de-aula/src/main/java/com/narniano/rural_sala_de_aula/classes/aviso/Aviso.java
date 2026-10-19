package com.narniano.rural_sala_de_aula.classes.aviso;


import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "avisos")
public class Aviso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "ir_turma", nullable = false)
    private Turma turma;

    @Column(name = "horario")
    private LocalDateTime horario;

    @Column(name = "texto")
    @Size(max = 3000)
    private String texto;
}
