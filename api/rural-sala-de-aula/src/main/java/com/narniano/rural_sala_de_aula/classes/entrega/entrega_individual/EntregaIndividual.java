package com.narniano.rural_sala_de_aula.classes.entrega.entrega_individual;

import com.narniano.rural_sala_de_aula.classes.entrega.Entrega;
import com.narniano.rural_sala_de_aula.classes.usuario.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "entregas_individuais")
public class EntregaIndividual extends Entrega {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

}
