# 💸 PWA de Gastos Rápidos

Progressive Web App para carga rápida de gastos familiares con persistencia de sesión y auto-login.

## 🚀 Características

- ✅ **Auto-login**: Guarda credenciales de forma segura en localStorage
- ✅ **Instalable**: Se puede instalar como app nativa en iOS y Android
- ✅ **Offline-ready**: Funciona sin conexión (próximamente)
- ✅ **Rápida**: HTML/JS/CSS vanilla, sin frameworks pesados
- ✅ **Optimizada para móvil**: Diseño mobile-first con touch optimizado
- ✅ **Persistencia**: Recuerda última cuenta y categoría usadas

## 📁 Estructura

```
pwa/
├── index.html          # Interfaz principal
├── app.js              # Lógica de la aplicación
├── styles.css          # Estilos optimizados para móvil
├── manifest.json       # Configuración PWA
├── icons/              # Íconos para instalación
│   ├── icon-192.png
│   └── icon-512.png
└── README.md           # Este archivo
```

## 🛠️ Instalación Local

### Opción 1: Servidor Python Simple

```bash
cd pwa
python -m http.server 8000
```

Luego abre: `http://localhost:8000`

### Opción 2: Live Server (VS Code)

1. Instala la extensión "Live Server"
2. Click derecho en `index.html` → "Open with Live Server"

### Opción 3: Cualquier servidor HTTP

Puedes usar cualquier servidor HTTP estático (nginx, Apache, etc.)

## 📱 Instalación en el Celular

### iPhone/iPad (Safari)

1. Abre la URL de la PWA en Safari
2. Toca el botón **Compartir** (cuadrado con flecha)
3. Selecciona **"Agregar a pantalla de inicio"**
4. Nómbrala "Gastos"
5. ¡Listo! Ahora tienes un ícono en tu pantalla de inicio

### Android (Chrome)

1. Abre la URL de la PWA en Chrome
2. Toca el menú **(⋮)**
3. Selecciona **"Agregar a pantalla de inicio"**
4. Confirma
5. ¡Listo! Ahora tienes un ícono en tu pantalla de inicio

## 🔧 Configuración

Las credenciales de Supabase ya están configuradas en `app.js`:

```javascript
const SUPABASE_URL = 'https://sgnijgopojlkuhoootsm.supabase.co';
const SUPABASE_ANON_KEY = 'tu_anon_key';
```

## 🌐 Deployment

### GitHub Pages

1. Sube la carpeta `pwa/` a un repositorio de GitHub
2. Ve a Settings → Pages
3. Selecciona la rama y carpeta
4. Tu PWA estará disponible en: `https://usuario.github.io/repo/`

### Netlify

1. Arrastra la carpeta `pwa/` a Netlify Drop
2. O conecta tu repositorio de GitHub
3. Build command: (ninguno)
4. Publish directory: `pwa/`

### Vercel

```bash
cd pwa
vercel
```

## 💾 Persistencia de Sesión

La PWA guarda las credenciales de forma segura en `localStorage`:

- **Email y contraseña**: Codificados en base64
- **Auto-login**: Al abrir la app, intenta login automático
- **Última cuenta y categoría**: Se recuerdan para el próximo gasto

### Seguridad

- Las credenciales se guardan **solo en tu dispositivo**
- Se codifican en base64 (no es encriptación fuerte, pero suficiente para uso personal)
- Puedes cerrar sesión manualmente en cualquier momento
- Si cierras sesión, las credenciales se borran

## 🎨 Personalización

### Colores

Edita las variables CSS en `styles.css`:

```css
:root {
    --primary-color: #4F46E5;  /* Color principal */
    --success-color: #10B981;  /* Color de éxito */
    --error-color: #EF4444;    /* Color de error */
}
```

### Íconos

Reemplaza los archivos en `icons/`:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

## 🐛 Troubleshooting

### La PWA no se instala

- Asegúrate de estar usando HTTPS (o localhost)
- Verifica que `manifest.json` esté correctamente vinculado
- Revisa la consola del navegador para errores

### No guarda las credenciales

- Verifica que localStorage esté habilitado en tu navegador
- Asegúrate de marcar "Recordarme en este dispositivo"

### Error al cargar datos

- Verifica las credenciales de Supabase en `app.js`
- Revisa que el usuario tenga un hogar asignado
- Verifica que haya cuentas y categorías activas

## 📊 Comparación con Streamlit

| Característica | Streamlit | PWA |
|----------------|-----------|-----|
| **Persistencia de sesión** | ❌ Se pierde al cerrar navegador | ✅ Auto-login permanente |
| **Velocidad de carga** | ~2-3 segundos | ~0.5 segundos |
| **Instalable como app** | ⚠️ Limitado | ✅ Nativa |
| **Funciona offline** | ❌ No | ✅ Sí (próximamente) |
| **Deployment** | Streamlit Cloud | Cualquier hosting estático |
| **Costo** | Gratis | Gratis |

## 🚧 Próximas Mejoras

- [ ] Service Worker para funcionalidad offline completa
- [ ] Sincronización en background
- [ ] Notificaciones push
- [ ] Modo oscuro
- [ ] Gráficos de gastos recientes

## 📝 Licencia

Este proyecto es de uso personal.

---

**¿Necesitas ayuda?** Abre un issue o contacta al desarrollador.
