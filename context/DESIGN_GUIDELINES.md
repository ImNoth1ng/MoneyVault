# MoneyVault - Reglas y Guía del Sistema de Diseño (Design System)

Este documento define la filosofía visual, paleta de colores, iconografía, tipografía y reglas obligatorias de diseño de la interfaz web de **MoneyVault**. Todas las pantallas, modales, formularios y componentes deben apegarse rigurosamente a estos estándares para preservar la coherencia y el acabado profesional de la plataforma.

---

## 1. Filosofía de Diseño: *Liquid Glass Fintech*

* **Dark Mode Nativo y Futurista:** Interfaz oscura profunda (`#0b0f19`) con capas translúcidas de cristal líquido (*Glassmorphism*) y desenfoque de fondo (`backdrop-filter: blur(20px)`).
* **Sobriedad y Confianza Financiera:** La aplicación está diseñada para transmitir seguridad, control y precisión matemática. Los componentes deben verse limpios, estilizados y libres de ruido visual infantil.
* **Profundidad Atmosférica:** El fondo cuenta con sutiles orbes flotantes de luz ambiental esmeralda y cian (`floating-orb-green`, `floating-orb-cyan`) que añaden volumen sin competir con la información numérica.
* **Micro-interacciones Táctiles:** Todos los botones interactivos cuentan con reducción sutil al presionar (`active:scale-[0.98]`) y transiciones suaves (`duration-200`).

---

## 2. Regla de Oro: Prohibición Estricta de Emojis

> [!IMPORTANT]
> **Queda estrictamente prohibido el uso de emojis dentro de la interfaz.**
> 
> * No usar emojis como `⭐`, `💳`, `💰`, `⚠️`, `🎉`, `✨`, `🔥`, etc. en títulos, textos, botones, opciones de selectores, modales ni notificaciones.
> * **Motivo:** Los emojis restan seriedad bancaria, rompen la estética visual del sistema de diseño y se renderizan de forma inconsistente entre sistemas operativos (Windows, macOS, Android, iOS).
> * **Solución:** Cada concepto que requiera apoyo visual **debe utilizar exclusivamente iconos SVG vectoriales de Lucide React** (`lucide-react`).

---

## 3. Sistema de Iconografía (Lucide React)

* **Biblioteca Oficial:** `lucide-react`.
* **Estilo de Trazo:** Grosor estándar (`stroke-[2]` o `stroke-[2.5]` en destacados, `stroke-[3]` solo en acentos específicos).
* **Contenedores Cápsula (Badges):** Los iconos destacados se envuelven en una cápsula con fondo al 15% de opacidad y borde al 30% del color temático:
  * *Verde Esmeralda:* `p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400`
  * *Rojo Rosa:* `p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400`
  * *Azul Cian:* `p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400`

### Mapeo Semántico de Iconos:
| Concepto Financiero | Icono Lucide Recomendado |
| :--- | :--- |
| **Ingreso / Depósito / Abono** | `<TrendingUp />`, `<ArrowUpRight />` |
| **Gasto / Compra / Egreso** | `<TrendingDown />`, `<ArrowDownLeft />` |
| **Transferencia / Traspaso** | `<ArrowLeftRight />` |
| **Liquidez / Cuenta de Débito** | `<Wallet />`, `<DollarSign />` |
| **Efectivo / Billetes** | `<Banknote />` |
| **Tarjeta de Crédito / Deuda** | `<CreditCard />` |
| **Inversiones / Rendimientos** | `<TrendingUp />` |
| **Deudores / Personas** | `<Users />`, `<User />` |
| **Tickets / Recibos** | `<Receipt />`, `<FileText />` |
| **Snapshots / Histórico** | `<Camera />`, `<Calendar />` |
| **Operación Exitosa / Aprobado** | `<CheckCircle2 />` |
| **Advertencia / Notificación** | `<AlertCircle />`, `<AlertTriangle />` |
| **Navegación Mensual** | `<ChevronLeft />`, `<ChevronRight />` |

---

## 4. Paleta de Colores y Tokens Semánticos

El color en MoneyVault tiene un propósito contable estricto:

### A. Fondos y Superficies
* **Lienzo Principal (Canvas):** `#0b0f19` (Azul marino casi negro).
* **Paneles y Tarjetas (Glass Panels / Cards):** `#0f172a` al 75% con blur (`rgba(15, 23, 42, 0.75)`).
* **Bordes Neutrales:** `border-slate-800` (`rgba(255, 255, 255, 0.08)`).
* **Inputs y Selects:** `bg-slate-900` (`rgba(11, 15, 25, 0.8)`) con `border-slate-700/80`.

### B. Colores Semánticos Financieros
* 🟢 **Esmeralda / Verde (`#10b981` / Tailwind `emerald`):**
  * **Significado:** Activos, liquidez disponible, dinero libre positivo, ingresos, operaciones exitosas y saldos favorables.
  * **Botón principal:** Clase `.btn-emerald` (gradiente `#10b981` a `#059669`).
* 🔴 **Rosa / Carmesí (`#f43f5e` / Tailwind `rose`):**
  * **Significado:** Pasivos, gastos, compras, deuda de tarjetas de crédito, déficit en flujo neto y eliminación de registros.
  * **Botón de gasto:** `bg-gradient-to-r from-rose-600 to-pink-600`.
* 🔵 **Cian / Azul Eléctrico (`#06b6d4` / Tailwind `cyan`):**
  * **Significado:** Cuentas por cobrar (tickets deudores), transferencias entre cuentas propias, snapshots de balance e información de auditoría.
  * **Botón secundario:** Clase `.btn-cyan` o badges `bg-cyan-500/15 text-cyan-300 border-cyan-500/30`.
* 🟡 **Ámbar / Naranja (`#f59e0b` / Tailwind `amber`):**
  * **Significado:** Advertencias de riesgo moderado, alertas de semáforo medio en dinero libre y abonos parciales.

---

## 5. Tipografía y Jerarquía Visual

* **Familia Tipográfica:** Fuente sans-serif nativa de alta legibilidad (`Inter` / `font-sans`).
* **Cifras Monetarias:** 
  * Se deben formatear siempre mediante la función `formatCurrency(monto)`.
  * Usar fuente monoespaciada en cifras clave: `font-mono font-black` (ej: `text-2xl font-mono font-black text-emerald-400`).
* **Encabezados:** `font-black text-white tracking-tight`.
* **Micro-etiquetas y Categorías:** `text-[10px]` o `text-[11px] font-bold uppercase tracking-wider`.
* **Textos de Acompañamiento:** `text-slate-400 font-medium`.

---

## 6. Componentes Clave y Estándares

### Tarjetas Glassmorphism (`.glass-card`)
```tsx
<div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
  <div>
    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Total Gastos</p>
    <p className="text-2xl font-mono font-black text-rose-300 mt-1">{formatCurrency(totalExpenses)}</p>
    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">12 gastos registrados</p>
  </div>
  <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl">
    <TrendingDown className="w-6 h-6" />
  </div>
</div>
```

### Modales Emergentes
* Fondo oscurecido con desenfoque: `fixed inset-0 z-[99999] bg-[#0b0f19]/85 backdrop-blur-md flex items-center justify-center p-4`.
* Tarjeta interior: `bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full`.
* Botón de cierre superior derecho: `p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl`.

### Chips de Filtros y Etiquetas
* Inactivos: `bg-slate-900 text-slate-400 border border-slate-800 hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-bold`.
* Activos: `bg-[color]-500/20 text-[color]-300 border border-[color]-500/50 px-2.5 py-1 rounded-lg text-[11px] font-bold`.

---

## 7. Checklist para Nuevas Funcionalidades

Antes de dar por terminada cualquier pantalla o componente, verificar:
- [ ] ¿Hay algún emoji visible? Si la respuesta es sí, reemplazarlo por un icono de Lucide React.
- [ ] ¿Los montos numéricos usan `formatCurrency` y fuente monoespaciada?
- [ ] ¿Los gastos y deudas usan la gama `rose` y los ingresos/liquidez la gama `emerald`?
- [ ] ¿Los botones tienen estados `:hover` y `:active` definidos?
- [ ] ¿Los modales y paneles usan `backdrop-blur` y bordes sutiles en `slate-800`?
