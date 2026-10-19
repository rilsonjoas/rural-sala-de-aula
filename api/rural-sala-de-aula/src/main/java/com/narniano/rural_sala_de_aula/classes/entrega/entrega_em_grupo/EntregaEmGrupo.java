package com.narniano.rural_sala_de_aula.classes.entrega.entrega_em_grupo;

import com.narniano.rural_sala_de_aula.classes.entrega.Entrega;
import com.narniano.rural_sala_de_aula.classes.grupo.Grupo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "entregas_em_grupo")
public class EntregaEmGrupo extends Entrega {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_grupo", nullable = false)
    private Grupo grupo;

}