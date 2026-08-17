# MoneyVault UI - Frontend Setup

Frontend para la aplicación de Finanzas Personales "MoneyVault". Sistema completo de gestión de cuentas, inversiones, deudas y auditoría.

## Stack Tecnológico

- **React 19** - Framework UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilizado moderno y responsivo
- **TypeScript** - Tipado estático
- **React Query (@tanstack/react-query)** - Manejo de estado y sincronización con API
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de esquemas
- **Recharts** - Visualización de datos
- **Axios** - Cliente HTTP
- **Zustand** - Estado global ligero
- **Day.js** - Manejo de fechas
- **Lucide React** - Iconos

## Inicio Rápido

### 1. Instalación

```bash
cd finanzas-ui
npm install
```

### 2. Configuración

Copia `.env.example` a `.env.local` y actualiza las variables:

```bash
cp .env.example .env.local
```

### 3. Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5173`.
