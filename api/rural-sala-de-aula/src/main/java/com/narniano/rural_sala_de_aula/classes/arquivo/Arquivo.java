package com.narniano.rural_sala_de_aula.classes.arquivo;

import com.narniano.rural_sala_de_aula.classes.entrega.Entrega;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "arquivos")
public class Arquivo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_entrega", nullable = false)
    private Entrega entrega;

    @Column(nullable = false)
    private String nomeOriginal;

    @Column(nullable = false, unique = true)
    private String nomeArmazenado;

    @Column(nullable = false)
    private String caminho;

    @Column(nullable = false)
    private String tipoConteudo;

    @Column(nullable = false)
    private Long tamanho;

    @Column(nullable = false)
    private LocalDateTime dataEnvio;

}
