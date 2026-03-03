

# Grilla de Contenido para Community Manager 📅

## 1. Autenticación y Roles (Admin)
- Login con email y contraseña (sin registro público)
- Un **administrador** crea las cuentas de los usuarios desde un panel de gestión
- Panel admin: crear, editar y eliminar usuarios
- Roles: **Admin** y **Usuario**
- Usuarios solo ven su contenido; admin ve todo

## 2. Dashboard Principal
- Selector de mes/año
- Tres vistas intercambiables: **Calendario mensual**, **Tabla/Grilla**, **Semanal**
- Botón para crear nueva publicación

## 3. Vistas de Contenido

### Calendario Mensual
- Cuadrícula de días con tarjetas de publicaciones (color, red social, estado)
- Click en día para agregar/ver publicaciones

### Tabla/Grilla
- Columnas: Fecha, Red Social, Tipo, Título, Copy, Copy Arte, Link Referencia, Estado, Color
- Colores de fondo personalizables por fila
- Filtros por red social, estado, tipo de contenido

### Vista Semanal
- Semana expandida con tarjetas detalladas

## 4. Formulario de Publicación (modal)
- Campos: Título, Descripción/Copy, Red Social, Tipo de contenido, Estado, Copy del arte, Link de referencia, Color, Fecha

## 5. Exportación
- **Exportar a Excel (.xlsx)** — descarga la grilla del mes con todos los datos y colores
- **Exportar a PDF** — descarga el calendario/grilla como documento PDF con formato visual

## 6. Pestaña de Métricas
- Dashboard con gráficos:
  - **Publicaciones por red social** (gráfico de barras/dona)
  - **Publicaciones por estado** (cuántas en borrador, aprobadas, publicadas)
  - **Publicaciones por tipo de contenido** (Reels, Stories, Posts, etc.)
  - **Actividad por día/semana** (línea temporal de publicaciones)
- Filtros por rango de fechas y red social

## 7. Backend (Lovable Cloud / Supabase)
- Tabla **profiles** (nombre, email, vinculada a auth.users)
- Tabla **user_roles** (admin / user)
- Tabla **publicaciones** (todos los campos del formulario + user_id)
- RLS: usuarios ven solo su contenido, admin ve todo
- Admin crea usuarios vía Supabase Admin API (edge function)

