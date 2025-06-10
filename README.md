# 🛍️ Bamkz - Tienda Online Premium

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/bamkz/deploys)

## 📋 Descripción

**Bamkz** es una moderna tienda online de productos premium en Colombia, desarrollada como Single Page Application (SPA) con React, TypeScript y Vite. Ofrece una experiencia de compra optimizada con Progressive Web App (PWA) capabilities.

## ✨ Características

- 🎨 **UI/UX Moderno**: Diseño responsive con Tailwind CSS
- ⚡ **Performance**: Optimizado con Vite y lazy loading
- 📱 **PWA**: Instalable como app móvil
- 🔒 **Seguro**: Autenticación con Supabase
- 💳 **Pagos**: Integración con MercadoPago
- 📦 **E-commerce**: Carrito, favoritos, órdenes
- 🚚 **Envíos**: Pago contra entrega disponible
- 🌐 **SEO**: Optimizado para motores de búsqueda

## 🚀 Tecnologías

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **Backend**: Supabase
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Animations**: Framer Motion
- **Forms**: React Hook Form
- **Icons**: Lucide React

## 📦 Instalación

```bash
# Clonar repositorio
git clone https://github.com/Manuelkz1/Bamkz_definitivo.git
cd Bamkz_definitivo

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
npm run dev
```

## 🛠️ Scripts Disponibles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run preview    # Preview del build
npm run lint       # Linting con ESLint
npm run type-check # Verificación de tipos
npm run format     # Formatear código
```

## 🌐 Despliegue

El proyecto se despliega automáticamente en Netlify:

1. **Push a main** → Trigger automático de build
2. **Build command**: `npm run build`
3. **Publish directory**: `dist`
4. **Node version**: 18.x

## 📱 PWA Features

- ✅ Service Worker para cache offline
- ✅ Manifest para instalación
- ✅ Iconos optimizados
- ✅ Theme color personalizado
- ✅ Splash screens

## 🔧 Configuración de Desarrollo

### Variables de Entorno

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MERCADOPAGO_PUBLIC_KEY=your_mp_public_key
```

### IDE Recomendado

- Visual Studio Code
- Extensiones: ES7+ React/Redux/React-Native snippets, Tailwind CSS IntelliSense, TypeScript Importer

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Desarrollador

Desarrollado por **BAMKZ Team**

- 🌐 Website: [bamkz.com](https://bamkz.com)
- 📧 Email: dev@bamkz.com
- 📱 Instagram: [@bamkz](https://instagram.com/bamkz)

---

⭐ **¡Dale una estrella si te gusta el proyecto!**
