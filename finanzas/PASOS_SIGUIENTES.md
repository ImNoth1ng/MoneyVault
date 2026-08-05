# 📋 Próximos Pasos - Guía de Implementación

## 🧭 Estado Actual de la Sesión

- ✅ Se implementaron snapshots de balance con servicio, controlador y DTOs.
- ✅ Se corrigieron defaults de Lombok en entidades y DTOs usados por builder.
- ✅ `mvnw.cmd test` volvió a pasar después de los cambios.
- ⏭️ Siguiente bloque pendiente: auditoría automática con AOP.

## 🎯 Fases Completadas ✅

### Fase 1: Estructura Base (COMPLETADA)
- ✅ Modelos JPA con relaciones correctas
- ✅ Repositorios con queries personalizadas
- ✅ DTOs para request/response
- ✅ Servicios de negocio
- ✅ Controladores REST
- ✅ Configuración de seguridad (JWT)
- ✅ Manejo centralizado de excepciones
- ✅ Compilación exitosa

### Fase 2: Calidad y Documentación Base (COMPLETADA)
- ✅ Inicialización automática de roles `ROLE_USER` y `ROLE_ADMIN`
- ✅ Bean Validation activa en DTOs
- ✅ Respuestas estructuradas para errores de validación
- ✅ Swagger / OpenAPI habilitado
- ✅ `mvnw.cmd test` pasando contra MySQL local

### Fase 3: Snapshots de Balance (COMPLETADA)
- ✅ `BalanceSnapshot` conectado a `Account` y `User`
- ✅ Servicio para crear y listar snapshots por cuenta y por periodo
- ✅ Endpoints REST para snapshots expuestos
- ✅ Validación de propiedad por usuario en snapshots

---

## 🔧 Fase 4: Funcionalidad Pendiente (PRÓXIMA)

### 4.1 Base de Datos Local
**Estado**: ✅ Verificada en Docker con MySQL accesible desde Spring Boot

### 4.2 Inicialización de Roles
**Estado**: ✅ Automática mediante `DataInitializer`

### 4.3 Variables de Entorno
**Estado**: ✅ `JWT_SECRET` y `JWT_EXPIRATION_MS` tienen fallback en `application.properties`

### 4.4 Pruebas Básicas
**Estado**: ✅ `mvnw.cmd test` pasa

**Acción siguiente recomendada**: Probar endpoints con Postman/cURL usando Swagger como referencia.

---

## 🧪 Fase 5: Pruebas y Cobertura (INMEDIATA)

### 5.1 Probar Endpoints Localmente
```bash
# Inicia la aplicación
mvn spring-boot:run

# En otra terminal, prueba registro
curl -X POST http://localhost:8085/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "password": "Password123!",
    "passwordConfirm": "Password123!"
  }'

# Respuesta esperada: 201 Created
# Usuario registrado con éxito
```

### 5.2 Crear Tests Unitarios
**Archivos a crear:**
- `AccountServiceTest.java`
- `DebtorServiceTest.java`
- `DebtTicketServiceTest.java`
- `AuthControllerTest.java`
- `BalanceSnapshotServiceTest.java`

**Estado actual**: Falta ampliar la suite; hoy está cubierto el test de arranque y el backend compila con snapshots.

**Ejemplo:**
```java
@SpringBootTest
public class AccountServiceTest {
    
    @MockBean
    private AccountRepository accountRepository;
    
    @InjectMocks
    private AccountService accountService;
    
    @Test
    public void testCreateAccount() {
        // Arrange
        User user = User.builder().id(1L).build();
        AccountRequest request = AccountRequest.builder()
            .name("Test Account")
            .type("DEBIT")
            .currentBalance(BigDecimal.valueOf(1000))
            .build();
        
        // Act
        // accountService.createAccount(1L, request);
        
        // Assert
        // verify(accountRepository, times(1)).save(any(Account.class));
    }
}
```

---

## 📊 Fase 6: Funcionalidades Adicionales (POSTERIOR)

### 6.1 Balance Snapshots Automáticos
**Estado**: ✅ Base funcional implementada manualmente vía API

**Siguiente mejora**: Scheduled tasks para capturar snapshots quincenales y mensuales

```java
@Component
public class BalanceSnapshotScheduler {
    
    private final BalanceSnapshotService balanceSnapshotService;
    
    @Scheduled(cron = "0 0 0 1,15 * *") // 1o y 15 de cada mes
    public void captureQuincelySnapshots() {
        balanceSnapshotService.createQuincelySnapshots();
    }
    
    @Scheduled(cron = "0 0 0 1 * *") // 1o de cada mes
    public void captureMonthlySnapshots() {
        balanceSnapshotService.createMonthlySnapshots();
    }
}
```

### 6.2 Auditoría con AOP
**Implementar**: Aspecto para loguear automáticamente operaciones críticas

```java
@Aspect
@Component
public class AuditingAspect {
    
    @Around("@annotation(Auditable)")
    public Object audit(ProceedingJoinPoint joinPoint) throws Throwable {
        // Capturar datos antes
        // Ejecutar operación
        // Registrar en audit_logs
        return joinPoint.proceed();
    }
}
```

### 6.3 Validaciones en DTOs
**Agregar**: Anotaciones de validación (Bean Validation)

```java
@Data
public class RegisterRequest {
    @NotBlank(message = "El usuario no puede estar vacío")
    @Size(min = 3, max = 50)
    private String username;
    
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;
}
```

---

## 🚀 Fase 5: Documentación y Deployment (FINAL)

### 6.1 Documentación API con Swagger
**Estado**: ✅ Ya habilitada en el proyecto

**Dependencia utilizada:**
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.6</version>
</dependency>
```

**URL**: `http://localhost:8085/swagger-ui/index.html`

### 7.2 Crear Docker Image
```dockerfile
FROM openjdk:21-jdk-slim
WORKDIR /app
COPY target/finanzas-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java","-jar","app.jar"]
```

### 7.3 Deploy a Azure/Cloud
- Usar Azure Container Registry
- Azure App Service o Container Apps
- Database: Azure Database for MariaDB

---

## 📝 Checklist de Implementación

### Inmediato (Esta semana)
- [x] Base de datos local verificada
- [x] Roles inicializados automáticamente
- [x] JWT_SECRET configurado con fallback
- [x] Pruebas básicas de backend exitosas
- [x] Compilación sin errores críticos

### Corto plazo (Próximas 2 semanas)
- [ ] Tests unitarios 80% de cobertura
- [x] Validaciones en DTOs
- [x] Documentación de API (Swagger)
- [ ] CI/CD configurado (GitHub Actions)
- [x] Balance Snapshots implementados

### Mediano plazo (1 mes)
- [ ] Auditoría automática (AOP)
- [ ] Dashboard de reportes
- [ ] Frontend conectado a la API
- [ ] Seguridad mejorada (CORS, Rate Limiting)
- [ ] Deployment a Azure

---

## 🐛 Conocidos / Warnings

### Warnings Lombok (No críticos)
```
@Builder will ignore the initializing expression entirely.
If you want the initializing expression to serve as default, add @Builder.Default.
```

**Estado**: ✅ Corregido en las entidades y DTOs que usan builder de forma activa

```java
@Builder.Default
private Boolean isPaid = false;
```

### Security TODO
- Implementar CORS correctamente
- Rate limiting en auth endpoints
- HTTPS en producción
- Secrets management (Azure Key Vault)

---

## 📚 Recursos Útiles

- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [Spring Security + JWT](https://github.com/jwtk/jjwt)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [Lombok](https://projectlombok.org)
- [MariaDB Docs](https://mariadb.com/docs/)

---

**Última actualización**: 4 de agosto de 2026  
**Responsable**: Equipo de Modernización  
**Estado**: ✅ Snapshots de balance implementados y documentación alineada
