# 📊 API Finanzas Personales - Documentación de Endpoints

## 🚀 Estado del Proyecto
✅ **Compilación exitosa**  
✅ **Estructura completa creada**  
✅ **Swagger/OpenAPI habilitado**  
✅ **Validaciones en DTOs activas**  
✅ **Roles inicializados automáticamente**  
✅ **Tests de arranque pasando**  
✅ **Snapshots de balance expuestos**  
⚠️ **Próximos pasos**: ampliar cobertura de tests y completar módulos posteriores

---

## 🔐 Autenticación

### 1. Registro de Usuario
**POST** `/api/v1/auth/register`
```json
{
  "username": "juan.perez",
  "email": "juan@example.com",
  "password": "MiPassword123!",
  "passwordConfirm": "MiPassword123!"
}
```
**Respuesta (201):**
```
Usuario registrado con éxito
```

### 2. Login
**POST** `/api/v1/auth/login`
```json
{
  "username": "juan.perez",
  "password": "MiPassword123!"
}
```
**Respuesta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "juan.perez",
  "email": "juan@example.com",
  "userId": 1
}
```

---

## 💰 Cuentas Bancarias

### 3. Crear Cuenta
**POST** `/api/v1/accounts`  
**Headers:** `Authorization: Bearer {token}`
```json
{
  "name": "Cuenta Corriente Banco X",
  "type": "DEBIT",
  "currentBalance": 5000.00,
  "creditLimit": null,
  "currency": "MXN"
}
```

### 4. Listar mis Cuentas
**GET** `/api/v1/accounts`  
**Headers:** `Authorization: Bearer {token}`

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "name": "Cuenta Corriente Banco X",
    "type": "DEBIT",
    "currentBalance": 5000.00,
    "creditLimit": null,
    "currency": "MXN",
    "createdAt": "2026-04-30T10:30:00"
  }
]
```

### 5. Obtener Detalle de Cuenta
**GET** `/api/v1/accounts/{id}`  
**Headers:** `Authorization: Bearer {token}`

### 6. Actualizar Cuenta
**PUT** `/api/v1/accounts/{id}`  
**Headers:** `Authorization: Bearer {token}`
```json
{
  "name": "Cuenta Actualizada",
  "type": "DEBIT",
  "currentBalance": 6000.00,
  "currency": "MXN"
}
```

### 7. Eliminar Cuenta
**DELETE** `/api/v1/accounts/{id}`  
**Headers:** `Authorization: Bearer {token}`

---

## 📸 Snapshots de Balance

### 8. Crear Snapshot
**POST** `/api/v1/accounts/{accountId}/snapshots`  
**Headers:** `Authorization: Bearer {token}`
```json
{
  "frequency": "MONTHLY"
}
```

### 9. Listar Snapshots de una Cuenta
**GET** `/api/v1/accounts/{accountId}/snapshots`  
**Headers:** `Authorization: Bearer {token}`

### 10. Listar Snapshots por Periodo
**GET** `/api/v1/accounts/{accountId}/snapshots/period?startDate=2026-08-01T00:00:00&endDate=2026-08-31T23:59:59`  
**Headers:** `Authorization: Bearer {token}`

---

## 👤 Deudores

### 11. Crear Deudor
**POST** `/api/v1/debtors`  
**Headers:** `Authorization: Bearer {token}`
```json
{
  "name": "Carlos López",
  "contactInfo": "carlos@email.com o 555-1234"
}
```

### 12. Listar Deudores
**GET** `/api/v1/debtors`  
**Headers:** `Authorization: Bearer {token}`

### 13. Obtener Deudor
**GET** `/api/v1/debtors/{id}`

### 14. Actualizar Deudor
**PUT** `/api/v1/debtors/{id}`
```json
{
  "name": "Carlos López Actualizado",
  "contactInfo": "carlos.nuevo@email.com"
}
```

### 15. Eliminar Deudor
**DELETE** `/api/v1/debtors/{id}`

---

## 🎟️ Tickets de Deuda

### 16. Crear Ticket de Deuda
**POST** `/api/v1/debt-tickets`  
**Headers:** `Authorization: Bearer {token}`
```json
{
  "debtorId": 1,
  "description": "Préstamo para compra de auto",
  "items": [
    {
      "concept": "Préstamo principal",
      "amount": 50000.00
    },
    {
      "concept": "Interés",
      "amount": 5000.00
    }
  ]
}
```

### 17. Listar mis Tickets
**GET** `/api/v1/debt-tickets`  
**Headers:** `Authorization: Bearer {token}`

### 18. Obtener Ticket
**GET** `/api/v1/debt-tickets/{id}`

### 19. Listar Tickets de un Deudor
**GET** `/api/v1/debt-tickets/debtor/{debtorId}`

### 20. Marcar Ticket como Pagado
**PUT** `/api/v1/debt-tickets/{id}/mark-paid`  
**Headers:** `Authorization: Bearer {token}`

### 21. Eliminar Ticket
**DELETE** `/api/v1/debt-tickets/{id}`

---

## 📁 Estructura de Carpetas Creada

```
src/main/java/com/nth/finanzas/
├── model/                      # Entidades JPA
│   ├── User.java
│   ├── Role.java
│   ├── Account.java
│   ├── BalanceSnapshot.java
│   ├── CashInventory.java
│   ├── Debtor.java
│   ├── DebtTicket.java
│   ├── TicketItem.java
│   └── AuditLog.java
├── repository/                 # Repositorios JPA
│   ├── UserRepository.java
│   ├── RoleRepository.java
│   ├── AccountRepository.java
│   ├── BalanceSnapshotRepository.java
│   ├── CashInventoryRepository.java
│   ├── DebtorRepository.java
│   ├── DebtTicketRepository.java
│   └── AuditLogRepository.java
├── service/                    # Servicios de Negocio
│   ├── JwtService.java (existente)
│   ├── AccountService.java
│   ├── DebtorService.java
│   ├── DebtTicketService.java
│   └── BalanceSnapshotService.java
├── controller/                 # Controladores REST
│   ├── AuthController.java (actualizado)
│   ├── AccountController.java
│   ├── DebtorController.java
│   ├── DebtTicketController.java
│   └── BalanceSnapshotController.java
├── dto/                        # Data Transfer Objects
│   ├── AuthRequest.java
│   ├── AuthResponse.java
│   ├── RegisterRequest.java
│   ├── AccountRequest/Response.java
│   ├── BalanceSnapshotRequest/Response.java
│   ├── DebtorRequest/Response.java
│   ├── DebtTicketRequest/Response.java
│   └── TicketItemRequest/Response.java
├── config/                     # Configuración
│   ├── ApplicationConfig.java (actualizado)
│   └── SecurityConfig.java
├── filter/                     # Filtros
│   └── JwtAuthFilter.java (verificado)
├── exception/                  # Manejo de Excepciones
│   └── GlobalExceptionHandler.java
└── FinanzasApplication.java
```

---

## ⚙️ Configuración Necesaria

### 1. Base de Datos MariaDB
```sql
CREATE DATABASE IF NOT EXISTS finanzas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Luego ejecuta el script SQL del reporte que proporcionaste.

### 2. Variables de Entorno
Crea un archivo `.env` o configura en `application.properties`:
```properties
JWT_SECRET=tu_clave_secreta_muy_larga_y_segura_cambiar_en_produccion
JWT_EXPIRATION_MS=86400000
```

### 3. Iniciar la Aplicación
```bash
mvn spring-boot:run
```

La API estará disponible en: `http://localhost:8085`

---

## 🚨 Pendientes (TODO)

### Críticos
- [x] Implementar `extractUserIdFromAuthentication()` en controladores para obtener userId del JWT
  - (Resuelto mediante `SecurityUtil.getCurrentUserId()`)

### Base de calidad
- [x] Inicialización automática de roles `ROLE_USER` y `ROLE_ADMIN`
- [x] Validaciones Bean Validation en DTOs
- [x] Manejo de errores de validación con respuesta estructurada
- [x] Swagger/OpenAPI expuesto en `/swagger-ui/index.html`

### Importantes
- [ ] Implementar servicios para Balance Snapshots (quincenales y mensuales)
- [ ] Implementar servicio para auditoría automática (AOP)
- [ ] Crear tests unitarios y de integración

### Mejoras
- [ ] Implementar paginación en endpoints de listado
- [ ] Agregar filtros por fecha en consultas
- [ ] Crear dashboard de reportes
- [ ] Implementar caché para snapshots
- [ ] Rate limiting en endpoints públicos
- [ ] CORS configurado para frontend

---

## 🧪 Ejemplo de Uso Completo (CURL)

### 1. Registrarse
```bash
curl -X POST http://localhost:8085/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan.perez",
    "email": "juan@example.com",
    "password": "Seguro123!",
    "passwordConfirm": "Seguro123!"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan.perez",
    "password": "Seguro123!"
  }'
```
*Guarda el token recibido*

### 3. Crear Cuenta
```bash
curl -X POST http://localhost:8085/api/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_AQUI}" \
  -d '{
    "name": "Mi Cuenta Corriente",
    "type": "DEBIT",
    "currentBalance": 5000.00,
    "currency": "MXN"
  }'
```

---

## 📝 Notas Importantes

1. **JWT Token**: El token debe incluirse en el header `Authorization: Bearer {token}` para endpoints protegidos
2. **BigDecimal**: Se usa para precisión financiera (no usar double/float)
3. **Timestamps**: Se generan automáticamente con `LocalDateTime.now()`
4. **Cascade Operations**: Eliminar padre elimina hijos (ON DELETE CASCADE)

---

**Última actualización**: 4 de agosto de 2026  
**Estado de compilación**: ✅ BUILD SUCCESS
