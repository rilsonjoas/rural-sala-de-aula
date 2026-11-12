package com.narniano.rural_sala_de_aula.classes.grupo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** Regras de formação de grupos de uma turma (RF12). Sem linha, valem os padrões (2 a 5, sem limite de grupos). */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "configuracao_grupos")
public class ConfiguracaoGrupos {

    @Id
    @Column(name = "turma_id")
    private UUID turmaId;

    @Column(name = "minimo_integrantes", nullable = false)
    private int minimoIntegrantes;

    @Column(name = "maximo_integrantes", nullable = false)
    private int maximoIntegrantes;

    @Column(name = "maximo_grupos")
    private Integer maximoGrupos;
}
