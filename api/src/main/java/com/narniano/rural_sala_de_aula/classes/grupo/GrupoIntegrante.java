package com.narniano.rural_sala_de_aula.classes.grupo;

import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "grupo_integrante")
public class GrupoIntegrante {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grupo_id", nullable = false)
    private Grupo grupo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Usuario aluno;

    @Column(name = "entrou_em", nullable = false)
    private LocalDateTime entrouEm = LocalDateTime.now();

    public GrupoIntegrante(Grupo grupo, Usuario aluno) {
        this.grupo = grupo;
        this.aluno = aluno;
        this.entrouEm = LocalDateTime.now();
    }
}
