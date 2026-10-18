FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY rural-sala-de-aula/pom.xml .
COPY rural-sala-de-aula/src ./src

RUN mvn clean package -DskipTests

# Etapa 2: executar a aplicação
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]