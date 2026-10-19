package com.narniano.rural_sala_de_aula.classes.entrega;

import com.narniano.rural_sala_de_aula.classes.arquivo.Arquivo;
import com.narniano.rural_sala_de_aula.classes.atividade.Atividade;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "entrega")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Entrega {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "atividade_id", nullable = false)
    private Atividade atividade;

    @Column(precision = 4, scale = 2)
    private BigDecimal nota;

    @Column(name = "comentario_privado", length = 4000)
    private String comentarioPrivado;

    @Column(name = "enviada_em", nullable = false)
    private LocalDateTime enviadaEm = LocalDateTime.now();

    @OneToMany(mappedBy = "entrega", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Arquivo> arquivos = new ArrayList<>();

    public boolean isAtrasada() {
        return atividade != null && enviadaEm != null && enviadaEm.isAfter(atividade.getPrazoFinal());
    }
}
