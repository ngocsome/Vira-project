FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S vira && adduser -S vira -G vira

COPY target/vira-api-0.1.0.jar app.jar

USER vira

EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
