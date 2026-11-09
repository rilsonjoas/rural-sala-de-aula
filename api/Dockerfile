FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Etapa 2: executar a aplicação
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Commit no ar: quem builda passa --build-arg GIT_COMMIT=<sha>; aparece em /api/v1/health.
# Fica depois do COPY do jar para nao invalidar o cache do build do Maven.
ARG GIT_COMMIT=dev
ENV APP_COMMIT=${GIT_COMMIT}

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]