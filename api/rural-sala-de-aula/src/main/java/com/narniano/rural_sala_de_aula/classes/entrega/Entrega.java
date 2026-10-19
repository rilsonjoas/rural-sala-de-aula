package com.narniano.rural_sala_de_aula.classes.entrega;


import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "entregas")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Entrega {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_atividade", nullable = false)
    private Atividade atividade;
}
