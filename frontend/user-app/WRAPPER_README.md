# Campust App Wrapper

Este proyecto contiene la configuración necesaria para ejecutar la aplicación web de Campust como una aplicación nativa en diferentes plataformas.

## Plataformas soportadas

- Windows (Electron)
- macOS (Electron)
- Android (Capacitor)
- iOS (Capacitor)

## Requisitos previos

- Node.js y npm
- Android Studio (para Android)
- Xcode (para iOS)
- Cocoapods (para iOS)

## Instalación

```bash
# Instalar dependencias
npm install --legacy-peer-deps
```

## Desarrollo

### Web (Navegador)
```bash
npm run dev
```

### Electron (Windows/macOS)
```bash
npm run electron:start
```

### Android
```bash
npm run cap:android
```
Esto abrirá Android Studio con el proyecto. Desde allí, puede ejecutar la aplicación en un emulador o dispositivo.

### iOS
```bash
npm run cap:ios
```
Esto abrirá Xcode con el proyecto. Desde allí, puede ejecutar la aplicación en un simulador o dispositivo.

## Construcción para producción

### Web
```bash
npm run build
```

### Electron (macOS)
```bash
npm run electron:build:mac
```

### Electron (Windows)
```bash
npm run electron:build:win
```

### Electron (Todos)
```bash
npm run electron:build:all
```

### Android/iOS
Después de ejecutar `npm run cap:android` o `npm run cap:ios`, puede generar el APK o archivo IPA desde Android Studio o Xcode respectivamente.

## Estructura del proyecto

- `src/` - Código fuente de la aplicación web
- `dist/` - Código compilado de la aplicación web
- `electron.cjs` - Archivo principal para Electron
- `capacitor.config.ts` - Configuración de Capacitor
- `android/` - Código nativo de Android
- `ios/` - Código nativo de iOS

## Notas

- Para iOS, asegúrese de tener Xcode instalado y configurado correctamente.
- Para Android, asegúrese de tener Android Studio instalado y configurado correctamente.
- Para Electron, las compilaciones se generarán en la carpeta `release/`. 