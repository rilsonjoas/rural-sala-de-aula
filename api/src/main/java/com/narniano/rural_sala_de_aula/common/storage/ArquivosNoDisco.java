package com.narniano.rural_sala_de_aula.common.storage;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

public final class ArquivosNoDisco {

    private ArquivosNoDisco() {}

    /** Apaga os arquivos só depois de a transação confirmar; um arquivo órfão nunca derruba uma exclusão já confirmada. */
    public static void apagarAposCommit(List<String> caminhos) {
        if (caminhos.isEmpty() || !TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                for (String caminho : caminhos) {
                    try {
                        Files.deleteIfExists(Paths.get(caminho).toAbsolutePath());
                    } catch (IOException e) {
                        // arquivo órfão não deve derrubar uma exclusão já confirmada
                    }
                }
            }
        });
    }
}
