FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /build

RUN apk add --no-cache maven

# Copy parent pom and backend pom first (for layer caching)
COPY pom.xml ./pom.xml
COPY backend/pom.xml ./backend/pom.xml

# Download dependencies
RUN mvn dependency:go-offline -pl backend -am -q 2>/dev/null || true

# Copy source
COPY backend/src ./backend/src

# Build only the backend module
RUN mvn package -pl backend -am -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S onboarding && adduser -S onboarding -G onboarding
USER onboarding

COPY --from=build /build/backend/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
