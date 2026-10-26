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
@Table(name = "arquivo")
public class Arquivo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entrega_id", nullable = false)
    private Entrega entrega;

    @Column(name = "nome_original", nullable = false)
    private String nomeOriginal;

    @Column(name = "nome_armazenado", nullable = false, unique = true)
    private String nomeArmazenado;

    @Column(nullable = false)
    private String caminho;

    @Column(name = "tipo_conteudo", nullable = false)
    private String tipoConteudo;

    @Column(nullable = false)
    private Long tamanho;

    /** SHA-256 do conteudo gravado, em hexadecimal; nulo nos arquivos enviados antes do RNF02. */
    @Column(name = "hash_sha256", length = 64)
    private String hashSha256;

    @Column(name = "data_envio", nullable = false)
    private LocalDateTime dataEnvio = LocalDateTime.now();

    public Long getTamanhoBytes() {
        return tamanho;
    }
}
