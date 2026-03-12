# OCASA Warehouse Management Platform
## Documento 01: Proyecto Base

> **Versión:** 1.0  
> **Fecha:** Febrero 2026  
> **Propósito:** Fundamento común para desarrollo en paralelo (2 computadoras)  
> **IDE Destino:** Google Antigravity

---

## 📋 ÍNDICE

1. [Visión General](#1-visión-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Configuración Inicial](#5-configuración-inicial)
6. [Variables de Entorno](#6-variables-de-entorno)
7. [Sistema de Usuarios y Permisos](#7-sistema-de-usuarios-y-permisos)
8. [Estrategia de Desarrollo Paralelo](#8-estrategia-de-desarrollo-paralelo)
9. [Convenciones de Código](#9-convenciones-de-código)

---

## 1. VISIÓN GENERAL

### 1.1 Descripción del Proyecto

Plataforma integral de gestión de warehouse con IA que centraliza operaciones, logística y atención al cliente. Permite monitoreo en tiempo real, gestión de reclamos y seguimiento completo de envíos mediante un chatbot inteligente.

### 1.2 Módulos Principales

| Módulo | Descripción | Prioridad |
|--------|-------------|-----------|
| **Dashboard Operativo** | KPIs en tiempo real, estado de docks, movimientos de inventario, OTIF | Alta |
| **Tracking de Viajes** | Gestión completa de envíos con estados y trazabilidad | Alta |
| **CRM de Reclamos** | Sistema de tickets con ingreso automático desde emails via IA | Alta |
| **Chatbot IA** | Asistente conversacional para consultas operativas | Media |
| **Panel Financiero** | KPIs gerenciales protegidos con contraseña adicional | Media |
| **Mapa 2D Warehouse** | Visualización interactiva de 40 docks y zonas | Media |
| **Reportes** | Generación y exportación de reportes configurables | Media |

### 1.3 Usuarios del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ROLES Y PERMISOS                             │
├──────────────┬──────────────────────────────────────────────────────┤
│ OPERATIVO    │ Dashboard, Tracking (solo lectura), Chatbot          │
├──────────────┼──────────────────────────────────────────────────────┤
│ SUPERVISOR   │ Todo anterior + Gestión viajes, Gestión reclamos     │
├──────────────┼──────────────────────────────────────────────────────┤
│ GERENCIAL    │ Todo anterior + Panel Financiero (con password)      │
├──────────────┼──────────────────────────────────────────────────────┤
│ ADMIN        │ Acceso total + Gestión de usuarios y configuración   │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Diagrama General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Browser)                               │
│                         Next.js App (React + Tailwind)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS SERVER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  App Router │  │ API Routes  │  │ Middleware  │  │   Server    │        │
│  │   (Pages)   │  │  (/api/*)   │  │   (Auth)    │  │ Components  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────────────┐
│       SUPABASE        │ │   AI SERVICES     │ │   EXTERNAL SERVICES       │
├───────────────────────┤ ├───────────────────┤ ├───────────────────────────┤
│ • PostgreSQL (DB)     │ │ • OpenAI API      │ │ • Google Sheets API       │
│ • Auth (Google OAuth) │ │ • Claude API      │ │ • SMTP/IMAP (Email)       │
│ • Realtime            │ │   (alternativo)   │ │ • SMS Gateway (opcional)  │
│ • Storage (archivos)  │ │                   │ │ • SQL Server (opcional)   │
└───────────────────────┘ └───────────────────┘ └───────────────────────────┘
```

### 2.2 Flujo de Datos en Tiempo Real

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuario    │────▶│   Supabase   │────▶│  Realtime    │
│   Acción     │     │   Database   │     │  Broadcast   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                     ┌───────────────────────────────────────┐
                     │     Todos los clientes suscritos      │
                     │   reciben actualización instantánea   │
                     └───────────────────────────────────────┘
```

### 2.3 Flujo del Chatbot IA

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│   API    │────▶│  Intent  │────▶│  Query   │
│  Input   │     │  Route   │     │  Parser  │     │ Builder  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                        │
                                                        ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Response │◀────│   AI     │◀────│  Data    │◀────│ Supabase │
│  Format  │     │ Generate │     │ Results  │     │  Query   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

---

## 3. STACK TECNOLÓGICO

### 3.1 Frontend

```json
{
  "framework": "Next.js 14.2.x (App Router)",
  "language": "TypeScript 5.4.x",
  "styling": "Tailwind CSS 3.4.x",
  "ui_library": "shadcn/ui (Radix primitives)",
  "state": "Zustand 4.5.x",
  "forms": "React Hook Form 7.52.x + Zod 3.23.x",
  "tables": "TanStack Table 8.17.x",
  "charts": "Recharts 2.12.x",
  "2d_canvas": "React Konva 18.2.x",
  "icons": "Lucide React 0.400.x",
  "animations": "Framer Motion 11.x",
  "dates": "date-fns 3.6.x"
}
```

### 3.2 Backend

```json
{
  "runtime": "Next.js API Routes (Node.js)",
  "database": "Supabase (PostgreSQL 15)",
  "orm": "Supabase Client + SQL directo",
  "auth": "Supabase Auth (Google OAuth 2.0)",
  "realtime": "Supabase Realtime (WebSockets)",
  "storage": "Supabase Storage",
  "ai_primary": "OpenAI GPT-4 Turbo",
  "ai_secondary": "Claude API (backup/alternativo)",
  "email_read": "IMAP (imap-simple)",
  "email_send": "Nodemailer (SMTP)",
  "excel": "xlsx (SheetJS)"
}
```

### 3.3 DevOps & Tools

```json
{
  "version_control": "Git",
  "repository": "GitHub",
  "package_manager": "pnpm 9.x",
  "local_dev": "localhost:3000",
  "production": "VPS (preparado para PM2 + Nginx)",
  "ci_cd": "GitHub Actions (opcional, fase 2)"
}
```

### 3.4 Package.json Completo

```json
{
  "name": "ocasa-warehouse-platform",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.2.15",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    
    "@supabase/supabase-js": "^2.45.4",
    "@supabase/ssr": "^0.5.1",
    
    "tailwindcss": "^3.4.14",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    
    "@radix-ui/react-accordion": "^1.2.1",
    "@radix-ui/react-alert-dialog": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.2",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-tooltip": "^1.1.3",
    
    "lucide-react": "^0.453.0",
    "framer-motion": "^11.11.9",
    
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.8",
    
    "@tanstack/react-table": "^8.20.5",
    "recharts": "^2.13.0",
    
    "react-konva": "^18.2.10",
    "konva": "^9.3.15",
    
    "zustand": "^5.0.0",
    
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0",
    
    "xlsx": "^0.18.5",
    
    "openai": "^4.68.1",
    "@anthropic-ai/sdk": "^0.30.1",
    
    "nodemailer": "^6.9.15",
    "imap-simple": "^5.1.0",
    "mailparser": "^3.7.1",
    
    "uuid": "^10.0.0",
    "nanoid": "^5.0.7"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^22.7.5",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/uuid": "^10.0.0",
    "@types/nodemailer": "^6.4.16",
    
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    
    "eslint": "^8.57.1",
    "eslint-config-next": "^14.2.15",
    "@typescript-eslint/eslint-plugin": "^8.10.0",
    "@typescript-eslint/parser": "^8.10.0"
  }
}
```

---

## 4. ESTRUCTURA DEL PROYECTO

```
ocasa-warehouse-platform/
│
├── 📁 src/
│   │
│   ├── 📁 app/                              # Next.js App Router
│   │   │
│   │   ├── 📁 (auth)/                       # Grupo: Rutas de autenticación
│   │   │   ├── 📁 login/
│   │   │   │   └── page.tsx
│   │   │   ├── 📁 register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx                   # Layout sin sidebar
│   │   │
│   │   ├── 📁 (dashboard)/                  # Grupo: Rutas protegidas
│   │   │   ├── 📁 dashboard/
│   │   │   │   └── page.tsx                 # Dashboard principal
│   │   │   ├── 📁 tracking/
│   │   │   │   ├── page.tsx                 # Lista de viajes
│   │   │   │   ├── 📁 [id]/
│   │   │   │   │   └── page.tsx             # Detalle viaje
│   │   │   │   └── 📁 new/
│   │   │   │       └── page.tsx             # Nuevo viaje
│   │   │   ├── 📁 claims/
│   │   │   │   ├── page.tsx                 # CRM reclamos
│   │   │   │   ├── 📁 [id]/
│   │   │   │   │   └── page.tsx             # Detalle reclamo
│   │   │   │   └── 📁 new/
│   │   │   │       └── page.tsx             # Nuevo reclamo
│   │   │   ├── 📁 warehouse/
│   │   │   │   └── page.tsx                 # Mapa 2D
│   │   │   ├── 📁 financial/
│   │   │   │   └── page.tsx                 # Panel financiero
│   │   │   ├── 📁 reports/
│   │   │   │   └── page.tsx                 # Reportes
│   │   │   ├── 📁 chat/
│   │   │   │   └── page.tsx                 # Chatbot IA
│   │   │   ├── 📁 settings/
│   │   │   │   ├── page.tsx                 # Config general
│   │   │   │   └── 📁 users/
│   │   │   │       └── page.tsx             # Gestión usuarios
│   │   │   └── layout.tsx                   # Layout con sidebar
│   │   │
│   │   ├── 📁 api/                          # API Routes
│   │   │   ├── 📁 auth/
│   │   │   │   ├── 📁 callback/
│   │   │   │   │   └── route.ts
│   │   │   │   └── 📁 signout/
│   │   │   │       └── route.ts
│   │   │   ├── 📁 dashboard/
│   │   │   │   ├── 📁 kpis/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── 📁 docks/
│   │   │   │   │   └── route.ts
│   │   │   │   └── 📁 inventory/
│   │   │   │       └── route.ts
│   │   │   ├── 📁 trips/
│   │   │   │   ├── route.ts                 # GET (list), POST (create)
│   │   │   │   ├── 📁 [id]/
│   │   │   │   │   ├── route.ts             # GET, PUT, DELETE
│   │   │   │   │   └── 📁 status/
│   │   │   │   │       └── route.ts         # PUT (change status)
│   │   │   │   └── 📁 export/
│   │   │   │       └── route.ts             # POST (export Excel)
│   │   │   ├── 📁 claims/
│   │   │   │   ├── route.ts
│   │   │   │   ├── 📁 [id]/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── 📁 interactions/
│   │   │   │   │       └── route.ts
│   │   │   │   └── 📁 metrics/
│   │   │   │       └── route.ts
│   │   │   ├── 📁 chat/
│   │   │   │   ├── route.ts                 # POST (send message)
│   │   │   │   └── 📁 conversations/
│   │   │   │       └── route.ts
│   │   │   ├── 📁 warehouse/
│   │   │   │   ├── 📁 layout/
│   │   │   │   │   └── route.ts
│   │   │   │   └── 📁 heatmap/
│   │   │   │       └── route.ts
│   │   │   ├── 📁 financial/
│   │   │   │   ├── route.ts
│   │   │   │   └── 📁 verify/
│   │   │   │       └── route.ts
│   │   │   ├── 📁 reports/
│   │   │   │   ├── 📁 generate/
│   │   │   │   │   └── route.ts
│   │   │   │   └── 📁 scheduled/
│   │   │   │       └── route.ts
│   │   │   ├── 📁 notifications/
│   │   │   │   └── route.ts
│   │   │   ├── 📁 users/
│   │   │   │   └── route.ts
│   │   │   └── 📁 agents/
│   │   │       └── 📁 email/
│   │   │           └── route.ts             # Email processing agent
│   │   │
│   │   ├── globals.css                      # Tailwind imports
│   │   ├── layout.tsx                       # Root layout
│   │   └── page.tsx                         # Home (redirect)
│   │
│   ├── 📁 components/
│   │   ├── 📁 ui/                           # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── popover.tsx
│   │   │   └── tooltip.tsx
│   │   │
│   │   ├── 📁 layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── UserMenu.tsx
│   │   │
│   │   ├── 📁 dashboard/
│   │   │   ├── KPICard.tsx
│   │   │   ├── KPIGrid.tsx
│   │   │   ├── DockStatusPanel.tsx
│   │   │   ├── DockStatusCard.tsx
│   │   │   ├── InventoryMovements.tsx
│   │   │   ├── OTIFChart.tsx
│   │   │   ├── OrdersOverview.tsx
│   │   │   └── AlertsPanel.tsx
│   │   │
│   │   ├── 📁 tracking/
│   │   │   ├── TripForm.tsx
│   │   │   ├── TripCard.tsx
│   │   │   ├── TripTable.tsx
│   │   │   ├── TripTimeline.tsx
│   │   │   ├── TripFilters.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── StatusChangeModal.tsx
│   │   │
│   │   ├── 📁 claims/
│   │   │   ├── ClaimForm.tsx
│   │   │   ├── ClaimCard.tsx
│   │   │   ├── ClaimTable.tsx
│   │   │   ├── ClaimTimeline.tsx
│   │   │   ├── ClaimFilters.tsx
│   │   │   ├── ClaimKanban.tsx
│   │   │   ├── ClaimMetrics.tsx
│   │   │   ├── PriorityBadge.tsx
│   │   │   └── SLAIndicator.tsx
│   │   │
│   │   ├── 📁 chat/
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatHistory.tsx
│   │   │   └── SuggestedQuestions.tsx
│   │   │
│   │   ├── 📁 warehouse/
│   │   │   ├── WarehouseCanvas.tsx
│   │   │   ├── DockElement.tsx
│   │   │   ├── ZoneElement.tsx
│   │   │   ├── HeatmapOverlay.tsx
│   │   │   ├── WarehouseLegend.tsx
│   │   │   └── WarehouseControls.tsx
│   │   │
│   │   ├── 📁 financial/
│   │   │   ├── FinancialKPIs.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── CostBreakdown.tsx
│   │   │   ├── MarginAnalysis.tsx
│   │   │   ├── ClientRevenue.tsx
│   │   │   └── PasswordModal.tsx
│   │   │
│   │   ├── 📁 reports/
│   │   │   ├── ReportGenerator.tsx
│   │   │   ├── ReportPreview.tsx
│   │   │   ├── ReportFilters.tsx
│   │   │   ├── ExportButton.tsx
│   │   │   └── ScheduledReports.tsx
│   │   │
│   │   └── 📁 shared/
│   │       ├── DataTable.tsx
│   │       ├── SearchBar.tsx
│   │       ├── DateRangePicker.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── LoadingPage.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── NotificationBell.tsx
│   │       └── PageHeader.tsx
│   │
│   ├── 📁 lib/
│   │   ├── 📁 supabase/
│   │   │   ├── client.ts                    # Browser client
│   │   │   ├── server.ts                    # Server client
│   │   │   └── admin.ts                     # Admin client (service role)
│   │   ├── utils.ts                         # cn() y utilidades
│   │   ├── constants.ts                     # Constantes globales
│   │   ├── validations.ts                   # Schemas Zod
│   │   └── format.ts                        # Formateo de datos
│   │
│   ├── 📁 services/
│   │   ├── 📁 ai/
│   │   │   ├── chatbot.ts                   # Servicio chatbot
│   │   │   ├── email-classifier.ts          # Clasificador de emails
│   │   │   └── prompts.ts                   # System prompts
│   │   ├── 📁 email/
│   │   │   ├── reader.ts                    # IMAP reader
│   │   │   └── sender.ts                    # SMTP sender
│   │   ├── 📁 notifications/
│   │   │   ├── email.ts
│   │   │   └── templates.ts
│   │   ├── 📁 export/
│   │   │   └── excel.ts                     # Excel generation
│   │   └── 📁 integrations/
│   │       ├── google-sheets.ts
│   │       └── sql-server.ts                # Opcional
│   │
│   ├── 📁 hooks/
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── usePermissions.ts
│   │   ├── useRealtime.ts
│   │   ├── useDocks.ts
│   │   ├── useTrips.ts
│   │   ├── useClaims.ts
│   │   ├── useKPIs.ts
│   │   ├── useChat.ts
│   │   └── useExport.ts
│   │
│   ├── 📁 stores/
│   │   ├── auth-store.ts
│   │   ├── ui-store.ts
│   │   ├── notification-store.ts
│   │   └── filters-store.ts
│   │
│   ├── 📁 types/
│   │   ├── database.ts                      # Tipos de tablas
│   │   ├── api.ts                           # Request/Response types
│   │   ├── forms.ts                         # Form types
│   │   └── index.ts                         # Re-exports
│   │
│   └── 📁 config/
│       ├── site.ts                          # Metadata del sitio
│       ├── navigation.ts                    # Items de navegación
│       └── permissions.ts                   # Matriz de permisos
│
├── 📁 public/
│   ├── 📁 images/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   └── og-image.png
│   └── favicon.ico
│
├── .env.local                               # Variables locales (no commitear)
├── .env.example                             # Ejemplo de variables
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── components.json                          # Config shadcn/ui
├── package.json
├── pnpm-lock.yaml
└── README.md
```

---

## 5. CONFIGURACIÓN INICIAL

### 5.1 Crear el Proyecto

```bash
# Crear proyecto Next.js
pnpm create next-app@latest ocasa-warehouse-platform --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Entrar al directorio
cd ocasa-warehouse-platform

# Instalar dependencias principales
pnpm add @supabase/supabase-js @supabase/ssr

# Instalar shadcn/ui
pnpm dlx shadcn@latest init
```

### 5.2 Configurar shadcn/ui

Cuando se ejecute `shadcn init`, seleccionar:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Luego instalar componentes necesarios:

```bash
pnpm dlx shadcn@latest add button card dialog dropdown-menu form input label select table tabs toast badge separator skeleton switch textarea avatar progress popover tooltip accordion alert-dialog checkbox
```

### 5.3 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google avatars
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
```

### 5.4 tailwind.config.ts

```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom colors for the app
        dock: {
          available: "#22c55e",
          occupied: "#ef4444",
          reserved: "#f59e0b",
          maintenance: "#6b7280",
        },
        status: {
          preparation: "#3b82f6",
          ready: "#22c55e",
          in_transit: "#f59e0b",
          delivered: "#10b981",
          cancelled: "#ef4444",
        },
        priority: {
          low: "#6b7280",
          medium: "#f59e0b",
          high: "#f97316",
          critical: "#ef4444",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

### 5.5 tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 6. VARIABLES DE ENTORNO

### 6.1 Archivo .env.example

```bash
# ============================================
# OCASA WAREHOUSE PLATFORM - Environment Variables
# ============================================
# Copiar este archivo a .env.local y completar los valores

# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="OCASA Warehouse"

# ============================================
# AI SERVICES
# ============================================
# OpenAI (Primary)
OPENAI_API_KEY=sk-...

# Claude/Anthropic (Secondary/Backup)
ANTHROPIC_API_KEY=sk-ant-...

# Modelo a usar
AI_MODEL=gpt-4-turbo-preview
# AI_MODEL=claude-3-opus-20240229

# ============================================
# EMAIL CONFIGURATION
# ============================================
# IMAP (para leer emails de reclamos)
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_IMAP_USER=reclamos@ocasa.com
EMAIL_IMAP_PASSWORD=app_password_here
EMAIL_IMAP_TLS=true

# SMTP (para enviar notificaciones)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=notificaciones@ocasa.com
EMAIL_SMTP_PASSWORD=app_password_here
EMAIL_SMTP_FROM_NAME="OCASA Warehouse"
EMAIL_SMTP_FROM_EMAIL=notificaciones@ocasa.com

# ============================================
# INTEGRATIONS (OPTIONAL)
# ============================================
# Google Sheets
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=

# SQL Server (si se usa como fuente adicional)
SQL_SERVER_HOST=
SQL_SERVER_PORT=1433
SQL_SERVER_USER=
SQL_SERVER_PASSWORD=
SQL_SERVER_DATABASE=

# SMS Gateway (opcional)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### 6.2 Configuración de Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **Project Settings** > **API**
3. Copiar:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

4. Configurar Google OAuth:
   - Ir a **Authentication** > **Providers** > **Google**
   - Habilitar y configurar con credenciales de Google Cloud Console

---

## 7. SISTEMA DE USUARIOS Y PERMISOS

### 7.1 Roles del Sistema

```typescript
// src/types/database.ts
export type UserRole = 'operative' | 'supervisor' | 'manager' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  department: string | null
  phone: string | null
  is_active: boolean
  financial_password_hash: string | null
  created_at: string
  updated_at: string
}
```

### 7.2 Matriz de Permisos

```typescript
// src/config/permissions.ts
export const PERMISSIONS = {
  // Dashboard
  'dashboard:view': ['operative', 'supervisor', 'manager', 'admin'],
  'dashboard:edit_kpis': ['manager', 'admin'],
  
  // Tracking/Trips
  'trips:view': ['operative', 'supervisor', 'manager', 'admin'],
  'trips:create': ['supervisor', 'manager', 'admin'],
  'trips:edit': ['supervisor', 'manager', 'admin'],
  'trips:delete': ['manager', 'admin'],
  'trips:change_status': ['supervisor', 'manager', 'admin'],
  'trips:export': ['supervisor', 'manager', 'admin'],
  
  // Claims
  'claims:view': ['operative', 'supervisor', 'manager', 'admin'],
  'claims:create': ['supervisor', 'manager', 'admin'],
  'claims:edit': ['supervisor', 'manager', 'admin'],
  'claims:assign': ['supervisor', 'manager', 'admin'],
  'claims:resolve': ['supervisor', 'manager', 'admin'],
  'claims:delete': ['manager', 'admin'],
  
  // Warehouse Map
  'warehouse:view': ['operative', 'supervisor', 'manager', 'admin'],
  'warehouse:edit_layout': ['manager', 'admin'],
  
  // Financial (requiere password adicional)
  'financial:view': ['manager', 'admin'],
  'financial:edit': ['admin'],
  
  // Chat
  'chat:use': ['operative', 'supervisor', 'manager', 'admin'],
  
  // Reports
  'reports:view': ['supervisor', 'manager', 'admin'],
  'reports:create': ['supervisor', 'manager', 'admin'],
  'reports:schedule': ['manager', 'admin'],
  
  // Users Management
  'users:view': ['admin'],
  'users:create': ['admin'],
  'users:edit': ['admin'],
  'users:delete': ['admin'],
  
  // Settings
  'settings:view': ['manager', 'admin'],
  'settings:edit': ['admin'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission]
  return allowedRoles?.includes(role) ?? false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}
```

### 7.3 Navegación por Rol

```typescript
// src/config/navigation.ts
import {
  LayoutDashboard,
  Truck,
  MessageSquareWarning,
  Map,
  DollarSign,
  FileText,
  MessageCircle,
  Settings,
  Users,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

export interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: string
}

export const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['operative', 'supervisor', 'manager', 'admin'],
  },
  {
    title: 'Tracking',
    href: '/tracking',
    icon: Truck,
    roles: ['operative', 'supervisor', 'manager', 'admin'],
  },
  {
    title: 'Reclamos',
    href: '/claims',
    icon: MessageSquareWarning,
    roles: ['operative', 'supervisor', 'manager', 'admin'],
  },
  {
    title: 'Warehouse',
    href: '/warehouse',
    icon: Map,
    roles: ['operative', 'supervisor', 'manager', 'admin'],
  },
  {
    title: 'Financiero',
    href: '/financial',
    icon: DollarSign,
    roles: ['manager', 'admin'],
  },
  {
    title: 'Reportes',
    href: '/reports',
    icon: FileText,
    roles: ['supervisor', 'manager', 'admin'],
  },
  {
    title: 'Chat IA',
    href: '/chat',
    icon: MessageCircle,
    roles: ['operative', 'supervisor', 'manager', 'admin'],
  },
  {
    title: 'Configuración',
    href: '/settings',
    icon: Settings,
    roles: ['manager', 'admin'],
  },
  {
    title: 'Usuarios',
    href: '/settings/users',
    icon: Users,
    roles: ['admin'],
  },
]

export function getNavigationForRole(role: UserRole): NavItem[] {
  return navigation.filter(item => item.roles.includes(role))
}
```

---

## 8. ESTRATEGIA DE DESARROLLO PARALELO

### 8.1 División de Trabajo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPUTADORA A: BACKEND                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📁 Responsabilidades:                                                      │
│  ├── Configuración de Supabase                                             │
│  │   ├── Ejecutar SQL del schema                                           │
│  │   ├── Configurar Auth (Google OAuth)                                    │
│  │   ├── Configurar Storage buckets                                        │
│  │   └── Configurar Realtime                                               │
│  │                                                                          │
│  ├── API Routes (/src/app/api/*)                                           │
│  │   ├── /auth/*                                                           │
│  │   ├── /dashboard/*                                                      │
│  │   ├── /trips/*                                                          │
│  │   ├── /claims/*                                                         │
│  │   ├── /chat/*                                                           │
│  │   ├── /warehouse/*                                                      │
│  │   ├── /financial/*                                                      │
│  │   ├── /reports/*                                                        │
│  │   ├── /notifications/*                                                  │
│  │   └── /agents/*                                                         │
│  │                                                                          │
│  ├── Services (/src/services/*)                                            │
│  │   ├── AI (chatbot, email classifier)                                    │
│  │   ├── Email (IMAP reader, SMTP sender)                                  │
│  │   ├── Notifications                                                     │
│  │   ├── Export (Excel)                                                    │
│  │   └── Integrations                                                      │
│  │                                                                          │
│  ├── Lib (/src/lib/*)                                                      │
│  │   ├── Supabase clients                                                  │
│  │   ├── Validations (Zod schemas)                                         │
│  │   └── Utils                                                              │
│  │                                                                          │
│  └── Types (/src/types/*)                                                  │
│                                                                             │
│  🔀 Rama Git: feature/backend-core                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPUTADORA B: FRONTEND                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📁 Responsabilidades:                                                      │
│  ├── Pages (/src/app/(auth)/* y /src/app/(dashboard)/*)                    │
│  │   ├── Login/Register                                                    │
│  │   ├── Dashboard                                                         │
│  │   ├── Tracking (list, detail, new)                                      │
│  │   ├── Claims (list, detail, new)                                        │
│  │   ├── Warehouse (2D map)                                                │
│  │   ├── Financial                                                         │
│  │   ├── Reports                                                           │
│  │   ├── Chat                                                              │
│  │   └── Settings                                                          │
│  │                                                                          │
│  ├── Components (/src/components/*)                                        │
│  │   ├── UI (shadcn components)                                            │
│  │   ├── Layout (Sidebar, Header, etc.)                                    │
│  │   ├── Dashboard components                                              │
│  │   ├── Tracking components                                               │
│  │   ├── Claims components                                                 │
│  │   ├── Chat components                                                   │
│  │   ├── Warehouse components (Konva)                                      │
│  │   ├── Financial components                                              │
│  │   ├── Reports components                                                │
│  │   └── Shared components                                                 │
│  │                                                                          │
│  ├── Hooks (/src/hooks/*)                                                  │
│  │   ├── useAuth, useUser, usePermissions                                  │
│  │   ├── useRealtime                                                       │
│  │   └── Custom hooks por módulo                                           │
│  │                                                                          │
│  ├── Stores (/src/stores/*)                                                │
│  │   ├── auth-store                                                        │
│  │   ├── ui-store                                                          │
│  │   └── filters-store                                                     │
│  │                                                                          │
│  └── Config (/src/config/*)                                                │
│      ├── navigation                                                        │
│      ├── permissions                                                       │
│      └── site                                                              │
│                                                                             │
│  🔀 Rama Git: feature/frontend-core                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Flujo de Git

```
main (producción)
  │
  └── develop (integración)
        │
        ├── feature/backend-core   ← Computadora A
        │     └── commits de backend
        │
        └── feature/frontend-core  ← Computadora B
              └── commits de frontend

FASE 1: Desarrollo paralelo
─────────────────────────────
Cada computadora trabaja en su rama

FASE 2: Integración
─────────────────────────────
1. Computadora A: git push origin feature/backend-core
2. Computadora B: git push origin feature/frontend-core
3. Crear PR de ambas ramas a develop
4. Resolver conflictos (principalmente en types/ y lib/)
5. Testing de integración en develop

FASE 3: Producción
─────────────────────────────
1. PR de develop a main
2. Build de producción
3. Deploy a VPS
```

### 8.3 Puntos de Sincronización

Archivos que AMBAS computadoras deben mantener sincronizados:

```
/src/types/database.ts      ← Tipos de la DB (A define, B usa)
/src/types/api.ts           ← Tipos de API (A define, B usa)
/src/lib/constants.ts       ← Constantes compartidas
/src/config/permissions.ts  ← Permisos (compartido)
```

**Protocolo de sincronización:**

1. Computadora A define los tipos primero
2. Push a rama compartida o `develop`
3. Computadora B hace pull antes de integrar
4. Comunicación constante sobre cambios en interfaces

### 8.4 Mock Data para Frontend

Mientras el backend no esté listo, el frontend puede usar datos mock:

```typescript
// src/lib/mock-data.ts (solo para desarrollo frontend)
export const mockTrips = [
  {
    id: '1',
    trip_number: 1001,
    client: { id: '1', code: 'CLI001', name: 'Cliente Demo' },
    status: 'in_transit',
    destination_city: 'Buenos Aires',
    total_packages: 5,
    created_at: new Date().toISOString(),
  },
  // ... más datos
]

export const mockDocks = Array.from({ length: 40 }, (_, i) => ({
  id: `dock-${i + 1}`,
  dock_number: i + 1,
  status: ['available', 'occupied', 'reserved', 'maintenance'][Math.floor(Math.random() * 4)],
  name: `Dock ${i + 1}`,
}))

// Usar en desarrollo:
// const trips = process.env.NODE_ENV === 'development' ? mockTrips : await fetchTrips()
```

---

## 9. CONVENCIONES DE CÓDIGO

### 9.1 Nomenclatura

```typescript
// Archivos y carpetas: kebab-case
claim-form.tsx
use-auth.ts
trip-status-history.ts

// Componentes React: PascalCase
export function ClaimForm() { }
export function TripStatusBadge() { }

// Hooks: camelCase con prefijo "use"
export function useAuth() { }
export function useTrips() { }

// Utilidades y funciones: camelCase
export function formatDate() { }
export function calculateOTIF() { }

// Constantes: SCREAMING_SNAKE_CASE
export const API_BASE_URL = '/api'
export const DEFAULT_PAGE_SIZE = 20

// Tipos e Interfaces: PascalCase
interface TripFormData { }
type UserRole = 'operative' | 'supervisor' | 'manager' | 'admin'

// Enums en DB: snake_case
trip_status: 'in_transit'
claim_priority: 'high'
```

### 9.2 Estructura de Componentes

```tsx
// src/components/tracking/TripCard.tsx

// 1. Imports (ordenados: react, next, libs externas, internos)
import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Truck, Calendar, Package } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './StatusBadge'
import type { Trip } from '@/types/database'
import { cn } from '@/lib/utils'

// 2. Types/Interfaces del componente
interface TripCardProps {
  trip: Trip
  onStatusChange?: (tripId: string, newStatus: string) => void
  className?: string
}

// 3. Componente
export function TripCard({ trip, onStatusChange, className }: TripCardProps) {
  // 3.1 Hooks
  const [isLoading, setIsLoading] = useState(false)

  // 3.2 Handlers
  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    try {
      await onStatusChange?.(trip.id, newStatus)
    } finally {
      setIsLoading(false)
    }
  }

  // 3.3 Render
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Viaje #{trip.trip_number}</span>
          <StatusBadge status={trip.status} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* ... contenido */}
      </CardContent>
    </Card>
  )
}
```

### 9.3 Estructura de API Routes

```typescript
// src/app/api/trips/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 1. Schema de validación
const createTripSchema = z.object({
  client_id: z.string().uuid(),
  shipping_method: z.enum(['ground', 'air', 'sea', 'multimodal']),
  // ...
})

// 2. GET handler
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener parámetros
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Query
    const { data, error, count } = await supabase
      .from('trips')
      .select('*', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return NextResponse.json({
      data,
      pagination: { page, limit, total: count }
    })
  } catch (error) {
    console.error('GET /api/trips error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 3. POST handler
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validar body
    const body = await request.json()
    const validation = createTripSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Insert
    const { data, error } = await supabase
      .from('trips')
      .insert({ ...validation.data, created_by: user.id })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/trips error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 9.4 Manejo de Errores

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 'FORBIDDEN', 403)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 'NOT_FOUND', 404)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}
```

---

## PRÓXIMOS DOCUMENTOS

Este documento es el **01 de 5**. Los siguientes documentos a generar son:

| # | Documento | Destino | Contenido |
|---|-----------|---------|-----------|
| 02 | `02_DATABASE_SCHEMA.md` | Computadora A | SQL completo, tipos, RLS, triggers, seeds |
| 03 | `03_BACKEND_API.md` | Computadora A | API routes, services, agentes IA |
| 04 | `04_FRONTEND_COMPONENTS.md` | Computadora B | Componentes, páginas, hooks, stores |
| 05 | `05_INTEGRACION.md` | Ambas | Guía de merge, testing, deploy |

---

**Fin del Documento 01: Proyecto Base**
