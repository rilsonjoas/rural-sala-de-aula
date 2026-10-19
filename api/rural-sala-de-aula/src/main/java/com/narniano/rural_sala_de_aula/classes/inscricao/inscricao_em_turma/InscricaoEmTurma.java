package com.narniano.rural_sala_de_aula.classes.inscricao.inscricao_em_turma;

import com.narniano.rural_sala_de_aula.classes.turma.Turma;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "inscricao_em_grupo")
public class InscricaoEmTurma {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_turma", nullable = false)
    private Turma turma;
}
