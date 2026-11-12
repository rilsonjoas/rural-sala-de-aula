package com.narniano.rural_sala_de_aula.classes.aviso;

import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "aviso")
public class Aviso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario autor;

    @Column(name = "horario", nullable = false)
    private LocalDateTime horario = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "alcance", nullable = false, length = 20)
    private AlcanceAviso alcance = AlcanceAviso.TURMA;

    /** Alunos que recebem o aviso direcionado (vazio quando o alcance é a turma toda). */
    @ElementCollection
    @CollectionTable(name = "aviso_destinatario", joinColumns = @JoinColumn(name = "aviso_id"))
    @Column(name = "aluno_id")
    private Set<UUID> destinatarios = new HashSet<>();

    @Column(name = "texto", nullable = false, length = 3000)
    @Size(max = 3000)
    private String texto;
}
