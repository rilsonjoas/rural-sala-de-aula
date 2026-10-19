package com.narniano.rural_sala_de_aula.classes.atividade;

import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "atividades")
public class Atividade {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_turma", nullable = false)
    private Turma turma;

    @Column(nullable = false, length = 100)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoAtividade tipo_atividade;

    @Column(nullable = false)
    private String instrucoes;

    @Column(nullable = false)
    private LocalDateTime prazo;

    @Column(nullable = false)
    private boolean aceita_atraso;
}
