# PaqTracker - App Cliente

Aplicación móvil desarrollada para la gestión y seguimiento de paquetes desde la perspectiva del cliente. Permite visualizar el historial de envíos, monitorear entregas en tiempo real y gestionar reportes de incidencias.

## Características Principales

La aplicación consta de 4 vistas principales construidas con un enfoque declarativo y navegación basada en archivos:

* **Dashboard (Inicio):** Panel principal que muestra un resumen de usuario, barra de búsqueda de folios y una lista interactiva de envíos recientes con indicadores de estado.
* **Detalles del Envío:** Vista dedicada al desglose de un paquete específico, implementando una línea de tiempo vertical para ilustrar el historial y progreso logístico.
* **Rastreo en Vivo:** Interfaz de simulación cartográfica que posiciona la unidad de reparto en tiempo real, con una tarjeta inferior (bottom sheet) superpuesta para detalles de llegada estimada.
* **Centro de Ayuda:** Formulario interactivo para levantamiento de reportes, utilizando selección de estado dinámico para categorizar el problema (paquete no llegado, dirección incorrecta, daño).
* **Navegación Global:** Menú lateral desplegable (Modal) para el acceso rápido a las secciones principales y gestión de sesión.

## Tecnologías Utilizadas

* **Framework:** [React Native](https://reactnative.dev/)
* **Entorno:** [Expo](https://expo.dev/) (SDK más reciente)
* **Enrutamiento:** [Expo Router](https://docs.expo.dev/router/introduction/) (Navegación basada en la estructura del directorio `src/app`)
* **Iconografía:** `@expo/vector-icons` (Feather y MaterialCommunityIcons)

## Estructura del Proyecto

El código fuente está centralizado en el directorio `src/app/`, utilizando el sistema de rutas de Expo:

```text
app-cliente/
├── src/
│   └── app/
│       ├── _layout.tsx      # Configuración del Stack de navegación base
│       ├── index.tsx        # Dashboard principal y Menú Lateral (Modal)
│       ├── detalles.tsx     # Vista de línea de tiempo y detalles del folio
│       ├── rastreo.tsx      # Vista de simulación de mapa en tiempo real
│       └── ayuda.tsx        # Formulario de reportes e incidencias
├── assets/                  # Imágenes y recursos estáticos
├── package.json             # Dependencias del proyecto
└── app.json                 # Configuración general de Expo
```
⚙️ Requisitos e Instalación

**1. Clonar el repositorio:**

```Bash
git clone [https://github.com/Carpep824/app-cliente.git](https://github.com/Carpep824/app-cliente.git)
```
**2. Instalar las dependencias requeridas:**

```Bash
cd app-cliente
npm install
```
**3. Iniciar el servidor de desarrollo:**

```Bash
npx expo start
```

**Visualización**
- Dispositivo físico: Descarga la aplicación Expo Go (disponible en iOS y Android) y escanea el código QR generado en la terminal.
- Navegador Web: Presiona la tecla w en la terminal durante la ejecución para previsualizar la interfaz compilada para web.
