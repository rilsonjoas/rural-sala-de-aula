package com.narniano.rural_sala_de_aula.classes.turma;

import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "turma")
public class Turma {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "professor_id", nullable = false)
    private Usuario professor;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 120)
    private String disciplina;

    @Column(nullable = false, length = 10)
    private String semestre;

    @ElementCollection
    @CollectionTable(name = "turma_dias_aula", joinColumns = @JoinColumn(name = "turma_id"))
    @Column(name = "dia_aula")
    private List<Integer> diasAula;

    @Column(nullable = false, unique = true, length = 8)
    private String codigo;

    @Column(length = 1000)
    private String descricao;
}
