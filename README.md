# MoneyVault - Sistema de Gestión Financiera Personal

**MoneyVault** es una plataforma web completa de control de finanzas personales diseñada para gestionar liquidez real, cuentas de débito, efectivo, inversiones, deudores y tarjetas de crédito con seguimiento del límite ocupado en tiempo real.

---

## Características Principales

- **Dashboard Financiero Inteligente**:
  - **Dinero Libre Disponible**: Cálculo en tiempo real de la liquidez real disponible post-deudas `(Débito + Efectivo + Por Cobrar - Deudas Crédito)`.
  - **Semáforo Financiero**: Comparación de disponibilidad financiera contra promedios de snapshots previos.
- **Tarjetas de Crédito & Límite Ocupado**:
  - Seguimiento del crédito ocupado vs. el límite asignado con barra de progreso visual interactiva (`usedCredit / creditLimit`).
  - Distinción entre saldo deudor y saldo acreedor.
- **Desglose de Efectivo**:
  - Calculadora integrada de billetes ($1000, $500, $200, $100, $50, $20) para auditoría de caja en efectivo.
- **Módulo de Deudores y Tickets**:
  - Registro de deudores, desglose por conceptos/items y control de tickets pagados vs. pendientes.
- **Snapshots Históricos**:
  - Captura periódica (quincenal o mensual) de disponibilidad financiera para análisis de tendencias.
- **Seguridad y Autenticación**:
  - Autenticación JWT Stateless con contraseñas encriptadas (BCrypt) y gestión de sesión segura.

---

## Stack Tecnológico

### Backend
- **Java 17+** & **Spring Boot 3**
- **Spring Security** (Autenticación JWT Stateless)
- **Spring Data JPA** & **Hibernate**
- **Base de Datos**: MySQL 8.x
- **Documentación API**: Swagger / OpenAPI 3.0
- **Herramienta de Construcción**: Maven

### Frontend
- **React 19** & **TypeScript**
- **Vite** (Build tool ultrarrápido)
- **Tailwind CSS** (Diseño moderno con Glassmorphism)
- **React Query** (`@tanstack/react-query`) para sincronización de estado remoto
- **React Hook Form** & **Zod** para formularios y validaciones estrictas
- **Lucide Icons**

### Infraestructura
- **Docker** & **Docker Compose**
- **Nginx** (Servidor web para distribución de frontend)

---

## Arquitectura y Estructura del Proyecto

El repositorio está estructurado en un monorepo modular:

```text
MoneyVault/
├── finanzas/                # Backend Java Spring Boot
│   ├── src/main/java/       # Controladores, Servicios, Modelos, DTOs y Repositorios
│   ├── src/main/resources/  # Configuraciones y propiedades de Spring
│   └── pom.xml              # Dependencias Maven
├── finanzas-ui/             # Frontend React 19 + Vite + TypeScript
│   ├── src/                 # Componentes, Páginas, Hooks, Servicios y Estado
│   ├── index.html           # HTML raíz
│   └── package.json         # Dependencias Node.js
├── docker-compose.yml       # Orquestación de contenedores (Frontend, Backend, DB)
├── .env.example             # Plantilla de variables de entorno globales
└── README.md                # Documentación principal del proyecto
```

---

## Cómo Levantar la Aplicación

### Opción 1: Con Docker Compose (Recomendado)

La forma más rápida de ejecutar el proyecto completo (Frontend + Backend + Base de Datos) es usando Docker:

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/ImNoth1ng/MoneyVault.git
   cd MoneyVault
   ```

2. **Crear el archivo de variables de entorno**:
   ```bash
   cp .env.example .env
   ```
   *(Opcional: edita el archivo `.env` para cambiar las contraseñas predeterminadas o puertos).*

3. **Compilar y levantar contenedores**:
   ```bash
   docker compose up --build -d
   ```

4. **Acceder a la aplicación**:
   - **Aplicación Web (Frontend)**: `http://localhost:8888`
   - **Documentación API Swagger**: `http://localhost:8085/swagger-ui.html`

---

### Opción 2: Desarrollo Local (Sin Docker)

Si prefieres ejecutar el Backend y Frontend manualmente en tu entorno local:

#### 1. Requisitos Previos
- **Java JDK 17** o superior
- **Node.js 20+** y **npm**
- **MySQL Server 8.0+** corriendo localmente (crear BD `finanzas_db`)

#### 2. Configurar y Levantar el Backend (Spring Boot)
```bash
cd finanzas

# Asegurar configuración de base de datos en src/main/resources/application.properties
# Iniciar la aplicación
./mvnw spring-boot:run
```
El servidor backend arrancará en `http://localhost:8085`.

#### 3. Configurar y Levantar el Frontend (React)
```bash
cd ../finanzas-ui

# Copiar variables de entorno
cp .env.example .env.local

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```
El frontend estará accesible en `http://localhost:5173`.

---

## Documentación de la API REST

Una vez ejecutado el backend, puedes explorar y probar todos los endpoints REST interactivos mediante Swagger UI en:

```text
http://localhost:8085/swagger-ui.html
```

Endpoints principales:
- `POST /api/v1/auth/login` - Inicio de sesión
- `POST /api/v1/auth/register` - Registro de nuevo usuario
- `GET /api/v1/accounts` - Obtener todas las cuentas (Débito, Crédito, Efectivo, Inversiones)
- `POST /api/v1/accounts` - Crear cuenta
- `PUT /api/v1/accounts/{id}` - Actualizar cuenta / saldo / límite de crédito
- `GET /api/v1/debtors` - Listar deudores
- `POST /api/v1/debtors/{id}/tickets` - Crear ticket de deuda
- `GET /api/v1/snapshots` - Obtener histórico de snapshots

---

## Variables de Entorno Recomendadas

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `APP_PORT` | Puerto expuesto para el Frontend | `8888` |
| `BACKEND_PORT` | Puerto expuesto para el Backend Spring Boot | `8085` |
| `MYSQL_DATABASE` | Nombre de la BD MySQL | `finanzas_db` |
| `MYSQL_USER` | Usuario de MySQL | `finanzas_user` |
| `MYSQL_PASSWORD` | Contraseña del usuario MySQL | *(Configurar en .env)* |
| `MYSQL_ROOT_PASSWORD` | Contraseña root de MySQL | *(Configurar en .env)* |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | *(Configurar clave segura 256 bits)* |
| `JWT_EXPIRATION_MS` | Duración del token en milisegundos | `86400000` (24h) |

---

## Documentación del Proyecto

En la carpeta [`context/`](context/) se encuentran las guías detalladas de arquitectura y diseño:
- [Sistema de Diseño e Iconografía (DESIGN_GUIDELINES.md)](context/DESIGN_GUIDELINES.md): Reglas de UI/UX, paleta de colores, filosofía de cristal líquido (Liquid Glass) y prohibición de emojis.
- [Endpoints de la API REST (API_ENDPOINTS.md)](context/API_ENDPOINTS.md): Documentación exhaustiva con ejemplos JSON y cURL de todos los servicios.
- [Guía de Configuración Local (SETUP.md)](context/SETUP.md): Pasos para configurar entorno y dependencias.
- [Guía de Despliegue en Producción (DEPLOYMENT_GUIDE.md)](context/DEPLOYMENT_GUIDE.md): Instrucciones para puesta en marcha con Docker y Nginx.

---

## Licencia y Autores

Desarrollado para el control financiero personal con arquitectura limpia.

**MoneyVault** © 2026 - Todos los derechos reservados.
