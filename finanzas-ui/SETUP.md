# Z-Fabric Finance - Frontend

Frontend para la aplicación de Finanzas Personales "Z-Fabric Finance". Sistema completo de gestión de cuentas, inversiones, deudas y auditoría.

## 🛠 Stack Tecnológico

- **React 19** - Framework UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilizado moderno y responsivo
- **TypeScript** - Tipado estático (opcional pero recomendado)
- **React Query (@tanstack/react-query)** - Manejo de estado y sincronización con API
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de esquemas
- **Recharts** - Visualización de datos
- **Axios** - Cliente HTTP
- **Zustand** - Estado global ligero
- **Day.js** - Manejo de fechas
- **Lucide React** - Iconos

## 📁 Estructura del Proyecto

```
finanzas-ui/
├── src/
│   ├── components/
│   │   ├── common/              # Componentes reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Feedback.tsx
│   │   │   └── FormInputs.tsx
│   │   ├── features/            # Componentes de features principales
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AccountManagement.tsx
│   │   │   └── AccountModal.tsx
│   │   └── layouts/             # Layouts principales
│   │       └── MainLayout.tsx
│   ├── services/                # Servicios de API
│   │   ├── authService.ts
│   │   ├── accountService.ts
│   │   ├── transactionService.ts
│   │   ├── debtService.ts
│   │   └── financeService.ts
│   ├── hooks/                   # Hooks personalizados
│   │   ├── useAccounts.ts
│   │   └── useSnapshots.ts
│   ├── store/                   # Zustand stores
│   │   └── authStore.ts
│   ├── lib/                     # Librerías y configuraciones
│   │   ├── apiClient.ts
│   │   └── queryClient.ts
│   ├── utils/                   # Funciones auxiliares
│   │   └── formatters.ts
│   ├── types/                   # Tipos e interfaces TypeScript
│   │   └── index.ts
│   ├── App.jsx                  # Componente raíz
│   ├── main.jsx                 # Punto de entrada
│   └── index.css                # Estilos globales
├── public/                      # Archivos estáticos
├── .env.example                 # Variables de entorno (ejemplo)
├── .env.local                   # Variables de entorno (local)
├── tailwind.config.js           # Configuración de Tailwind
├── postcss.config.js            # Configuración de PostCSS
├── vite.config.js              # Configuración de Vite
└── package.json                 # Dependencias del proyecto
```

## 🚀 Inicio Rápido

### 1. Instalación

```bash
# Instalar dependencias
pnpm install
```

### 2. Configuración

Copia `.env.example` a `.env.local` y actualiza las variables:

```bash
cp .env.example .env.local
```

**Variables importantes:**
- `VITE_API_BASE_URL` - URL del backend (ej: http://localhost:8080/api)
- `VITE_DEBUG` - Modo debug para desarrollo

### 3. Desarrollo

```bash
# Iniciar servidor de desarrollo
pnpm run dev

# El servidor estará disponible en http://localhost:5173
```

### 4. Build

```bash
# Compilar para producción
pnpm run build

# Preview de la build
pnpm run preview
```

### 5. Linting

```bash
# Ejecutar ESLint
pnpm run lint
```

## 📋 Características Implementadas

### ✅ Dashboard Principal
- Tarjetas de resumen (Disponible Total, Efectivo Total, Inversiones)
- Gráfica de crecimiento patrimonial (últimos 6 meses)
- Tabla de cuentas recientes
- Indicadores de tendencia

### ✅ Gestión de Cuentas
- Listado de cuentas por tipo
- Crear nuevas cuentas
- Editar cuentas existentes
- Eliminar cuentas
- Barra de progreso para tarjetas de crédito
- Soporte para múltiples tipos (Débito, Crédito, Inversión, Efectivo)

### 📋 Por Implementar

- [ ] Módulo de Efectivo (Cash Inventory)
- [ ] Módulo de Deudores y Tickets
- [ ] Módulo de Inversiones
- [ ] Vista de Auditoría
- [ ] Autenticación (Login/Registro)
- [ ] Gestión de transacciones
- [ ] Exportación de reportes

## 🔌 Integración con Backend

El frontend se conecta al backend en Spring Boot mediante Axios con:

- **Autenticación JWT**: Tokens almacenados en localStorage
- **Interceptores**: Adjuntan automáticamente el token en cada petición
- **Manejo de errores**: Redirige a login si el token expira
- **React Query**: Cachea automáticamente y sincroniza estados

### Endpoints Esperados

El backend debe proporcionar los siguientes endpoints:

```
POST   /api/auth/login              - Login
POST   /api/auth/register           - Registro
GET    /api/auth/me                 - Obtener usuario actual
POST   /api/auth/validate-token     - Validar token

GET    /api/accounts                - Listar cuentas
GET    /api/accounts/{id}           - Obtener cuenta
POST   /api/accounts                - Crear cuenta
PUT    /api/accounts/{id}           - Actualizar cuenta
DELETE /api/accounts/{id}           - Eliminar cuenta
POST   /api/accounts/transfer       - Transferir fondos

GET    /api/transactions            - Listar transacciones
GET    /api/balance-snapshots       - Obtener snapshots

GET    /api/debtors                 - Listar deudores
POST   /api/debtors/{id}/tickets    - Crear ticket
GET    /api/audit-logs              - Obtener logs
```

## 🎨 Personalización de Estilos

### Colores Z-Fabric

Los colores están configurados en `tailwind.config.js`:

```javascript
zfabric: {
  50: '#f8f9fa',   // Muy claro
  900: '#212529',  // Muy oscuro
  accent: '#0066cc' // Azul primario
}
```

### Uso en Componentes

```jsx
<div className="bg-zfabric-50 text-zfabric-900">
  <button className="bg-zfabric-accent text-white">Botón</button>
</div>
```

## 📦 Scripts Disponibles

- `pnpm run dev` - Iniciar servidor de desarrollo
- `pnpm run build` - Compilar para producción
- `pnpm run preview` - Ver build de producción
- `pnpm run lint` - Ejecutar linter

## 🔐 Buenas Prácticas

1. **Tipado**: Siempre usar TypeScript para new features
2. **Componentes**: Mantener pequeños y reutilizables
3. **Hooks**: Crear hooks para lógica reutilizable
4. **Servicios**: Centralizar llamadas a API
5. **Validación**: Usar Zod para validar datos
6. **Estado**: Zustand para estado global, React Query para async

## 📚 Referencias

- [React Docs](https://react.dev)
- [Vite Docs](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Query](https://tanstack.com/query)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)
- [Recharts](https://recharts.org)

## 📝 Notas Importantes

- El token JWT se almacena en `localStorage` - considerar HttpOnly cookies para producción
- Los snapshots se caché por 30 minutos con React Query
- Los formularios usan validación Zod + Hook Form para seguridad cliente
- Los errores 401 redirigen automáticamente a login

## 🤝 Contribución

1. Crear una rama para tu feature (`git checkout -b feature/NombreFeature`)
2. Commit con mensajes claros (`git commit -m 'Add NombreFeature'`)
3. Push a la rama (`git push origin feature/NombreFeature`)
4. Abrir un Pull Request

---

**Z-Fabric Finance** © 2026 - Sistema de Finanzas Personales
