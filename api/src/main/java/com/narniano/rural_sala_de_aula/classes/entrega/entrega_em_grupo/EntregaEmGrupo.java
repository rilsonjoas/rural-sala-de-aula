package com.narniano.rural_sala_de_aula.classes.entrega.entrega_em_grupo;

import com.narniano.rural_sala_de_aula.classes.entrega.Entrega;
import com.narniano.rural_sala_de_aula.classes.grupo.Grupo;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "entrega_em_grupo")
public class EntregaEmGrupo extends Entrega {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grupo_id", nullable = false)
    private Grupo grupo;

    /** Integrante que enviou o arquivo em nome do grupo. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enviada_por_id")
    private Usuario enviadaPor;
}
