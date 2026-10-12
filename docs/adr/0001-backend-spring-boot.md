# ADR-0001 — Backend em Spring Boot

Status: aceito

## Contexto

O back-end é do Luiz e o repositório já nasceu em Spring Boot.

## Decisão

Spring Boot (Java 21) com JPA e Flyway; testes JUnit 5.

## Consequências

Migrations versionadas (V1 = schema dos P1). Segurança e armazenamento ficam nos ADRs 0003 e 0004.
