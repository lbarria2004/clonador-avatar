# 🎬 AI Avatar Studio

Generador de videos con avatares personalizados impulsado por IA. Sube tu foto, escribe tu guión, clona tu voz y genera videos profesionales.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![OpenAI](https://img.shields.io/badge/OpenAI-API-green?style=flat-square&logo=openai)

## ✨ Características

- 📸 **Avatar Personalizado** - Sube tu foto y analiza automáticamente tus características faciales con GPT-4 Vision
- 🎤 **Clonación de Voz** - Sube una muestra de tu voz (WAV/WebM/MP3) para personalizar el audio
- 🗣️ **5 Voces en Español Latino** - Carlos, Diego, María, Sofia, Alex (neutro)
- 📝 **Editor de Guiones** - Templates en español e inglés
- 🎬 **Escenarios Personalizables** - Fondos, ángulos de cámara, iluminación, vestimenta
- 🎥 **Generación de Videos con IA** - Procesamiento asíncrono
- 🌐 **Interfaz en Español** - Completamente localizada para hispanohablantes

## 🚀 Deploy en Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lbarria2004/clonador-avatar)

### Pasos para deploy:

1. **Haz clic en el botón de arriba** o ve a [vercel.com/new](https://vercel.com/new)
2. **Importa** el repositorio `lbarria2004/clonador-avatar`
3. **Configura** las variables de entorno (ver sección abajo)
4. **Deploy** automático

## 🔧 Variables de Entorno

### 🔑 Obtener OpenAI API Key

1. Ve a [platform.openai.com](https://platform.openai.com)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** → **Create new secret key**
4. Copia la key (empieza con `sk-`)

### Configuración en Vercel

En **Project Settings → Environment Variables**, añade:

| Variable | Valor |
|----------|-------|
| `OPENAI_API_KEY` | `sk-proj-...` (tu API key) |

### Configuración Local

```bash
# Clonar repositorio
git clone https://github.com/lbarria2004/clonador-avatar.git
cd clonador-avatar

# Instalar dependencias
npm install

# Crear archivo .env.local
echo "OPENAI_API_KEY=sk-proj-tu-api-key-aqui" > .env.local

# Iniciar servidor
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 💰 Costos Estimados (OpenAI)

| Función | Modelo | Costo aprox. |
|---------|--------|--------------|
| Text-to-Speech | tts-1 | ~$0.015/min |
| Speech-to-Text | whisper-1 | ~$0.006/min |
| Vision (Avatar) | gpt-4o-mini | ~$0.01/análisis |
| Generar Imagen | dall-e-3 | ~$0.04/imagen |

> 💡 **Tip**: Usa `tts-1` en lugar de `tts-1-hd` para ahorrar costos con calidad similar.

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Next.js 16** | Framework React con App Router |
| **React 19** | UI Library |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Styling |
| **shadcn/ui** | Componentes UI |
| **OpenAI API** | TTS, Whisper, GPT-4 Vision, DALL-E |
| **Prisma** | ORM para base de datos |
| **Framer Motion** | Animaciones |

## 🎤 Voces Disponibles

### Español Latino (mapeadas a OpenAI)

| Voz | Género | OpenAI Voice |
|-----|--------|--------------|
| 🇲🇽 Carlos | Masculina | Onyx (profunda) |
| 🇦🇷 Diego | Masculina | Echo (cálida) |
| 🇲🇽 María | Femenina | Nova (profesional) |
| 🇨🇴 Sofia | Femenina | Shimmer (suave) |
| 🌎 Alex | Neutral | Alloy (versátil) |

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx              # Página principal
│   ├── layout.tsx            # Layout raíz
│   └── api/
│       ├── avatar/analyze/   # Análisis de avatar (GPT-4 Vision)
│       ├── voice/
│       │   ├── preview/      # TTS Preview
│       │   └── clone/        # Análisis de voz (Whisper)
│       ├── video/
│       │   ├── generate/     # Generación de video
│       │   └── status/       # Polling de estado
│       └── scenario/generate/ # Generación de fondos (DALL-E)
├── components/
│   ├── AvatarUploader.tsx    # Subida de foto
│   ├── VoiceCloner.tsx       # Clonación de voz
│   ├── VoiceConfigurator.tsx # Configuración de voz
│   ├── ScriptEditor.tsx      # Editor de guiones
│   ├── ScenarioSelector.tsx  # Selector de escenario
│   ├── VideoGenerator.tsx    # Generador de video
│   └── VideoPlayer.tsx       # Reproductor
├── lib/
│   ├── openai-provider.ts    # Cliente OpenAI
│   ├── ai-provider.ts        # Provider unificado
│   ├── video-utils.ts        # Utilidades de video
│   └── text-utils.ts         # Utilidades de texto
└── types/
    └── index.ts              # Tipos TypeScript
```

## 🔮 Roadmap

- [ ] Integración con D-ID para videos con avatar animado
- [ ] Soporte para múltiples idiomas en TTS
- [ ] Templates de video predefinidos
- [ ] Exportación en diferentes formatos
- [ ] Historial de videos generados
- [ ] Compartir videos directamente a redes sociales

## 📄 Licencia

MIT

## 🤝 Contribuir

1. Fork del repositorio
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

Desarrollado con ❤️ usando Next.js y OpenAI API
