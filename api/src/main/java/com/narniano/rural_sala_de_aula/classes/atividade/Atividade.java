package com.narniano.rural_sala_de_aula.classes.atividade;

import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "atividade")
public class Atividade {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(length = 4000)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoAtividade tipo;

    @Column(name = "prazo_final", nullable = false)
    private LocalDateTime prazoFinal;

    @Column(name = "disponivel_em", nullable = false)
    private LocalDateTime disponivelEm = LocalDateTime.now();

    @Column(name = "aceita_atraso", nullable = false)
    private boolean aceitaAtraso = true;
}
