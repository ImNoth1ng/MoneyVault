# Stage 1: Build Java Application
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and POM configuration
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw

# Download dependencies (offline cache layer)
RUN ./mvnw dependency:go-offline -B

# Copy source code and build package skipping tests
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Lightweight Runtime Environment
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Security: Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

# Copy compiled JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]
