# Capacitor

A comprehensive guide for adding [Capacitor](https://capacitorjs.com/) to this project to build native iOS and Android apps from your web codebase.

---

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Adding Platforms](#adding-platforms)
4. [Development Workflow](#development-workflow)
5. [Remote Console Logging](#remote-console-logging)
6. [Building for Production](#building-for-production)
7. [Troubleshooting](#troubleshooting)
8. [Useful Resources](#useful-resources)

---

## Installation

### Step 1: Install Capacitor Core and CLI

```bash
bun add @capacitor/core
bun add -d @capacitor/cli
```

📖 **Reference:** [Installing Capacitor](https://capacitorjs.com/docs/getting-started#install-capacitor)

### Step 2: Initialize Capacitor

```bash
bunx cap init <appName> <appID> --web-dir dist-static
```

You need to replace
- **appName:** The display name of your app
- **appID:** A unique identifier (e.g., `dev.zerodays.fullstackstarter`)

📖 **Reference:** [Capacitor Init Command](https://capacitorjs.com/docs/cli/commands/init)

### Step 3: Install Platform Packages

```bash
# iOS
bun add @capacitor/ios @capacitor/android
bunx cap add ios
bunx cap add android
```

📖 **Reference:** [Adding Platforms](https://capacitorjs.com/docs/getting-started#create-your-android-and-ios-projects)

> [!NOTE]
> You should update the `.gitignore` with the following folders:
> ```
> # Capacitor - Android
> android/app/build/
> android/.gradle/
> android/build/
> android/local.properties
> android/*.iml
> android/capacitor-cordova-android-plugins/build/
> 
> # Capacitor - iOS
> ios/App/Pods/
> ios/DerivedData/
> ios/App/App.xcworkspace/xcuserdata/
> ios/App/App.xcodeproj/xcuserdata/
> ios/App/App.xcodeproj/project.xcworkspace/xcuserdata/
> ios/App/App/public/
> ```

---

## Configuration

### capacitor.config.ts

The configuration file defines how Capacitor builds and runs your app:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.zerodays.fullstackstarter',
  appName: 'Full Stack Starter',
  webDir: 'dist-static'
};

export default config;
```

**Key options:**
| Option | Description |
|--------|-------------|
| `appId` | Unique app identifier (reverse domain notation) |
| `appName` | Display name shown to users |
| `webDir` | Directory containing built web assets |

📖 **Reference:** [Capacitor Configuration](https://capacitorjs.com/docs/config)

---

## Development Workflow

### Build and Sync

Before running on a device, build your web app and sync it to native platforms:

```bash
# Build web app and sync to all platforms
bun run build
bunx cap sync
```

The `sync` command:
1. Copies the built web assets to native platforms
2. Updates native dependencies (CocoaPods for iOS, Gradle for Android)
3. Updates native project configuration

📖 **Reference:** [Capacitor Sync Command](https://capacitorjs.com/docs/cli/commands/sync)

---

## Remote Console Logging

This project includes a WebSocket-based remote logging system for debugging on physical devices.

### How It Works

1. **Server** (`scripts/mobile-logs.ts`): A Bun WebSocket server that receives and displays logs
2. **Client** (`web/client.tsx`): Overrides `console.*` methods to send logs over WebSocket

### Server Script

```typescript
// scripts/mobile-logs.ts
Bun.serve({
  port: 8765,
  hostname: "0.0.0.0",
  fetch: (req, server) => server.upgrade(req) ? undefined : new Response("ws"),
  websocket: {
    open: () => console.log("✅ Device connected\n"),
    close: () => console.log("📱 Device disconnected\n"),
    message: (_, msg) => {
      const { level, args } = JSON.parse(msg.toString());
      console.log(`[${level.toUpperCase()}]`, ...args);
    },
  },
});
```

### Client Integration

```typescript
// web/client.tsx
if (import.meta.env.DEV) {
  const ws = new WebSocket(`ws://${location.hostname}:8765`);
  for (const level of ["log", "info", "warn", "error", "debug"] as const) {
    const orig = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      orig(...args);
      if (ws.readyState === 1) ws.send(JSON.stringify({ level, args }));
    };
  }
}
```

---

### Update package.json scripts
To simplify the development you can update the `package.json` scripts to something like this:
```
"cap:logs": "bun run scripts/mobile-logs.ts",
"cap:sync": "bun run build && bunx cap sync",
"cap:android": "bun run cap:logs & bunx cap run android --live-reload --port 5173; kill %1 2>/dev/null",
"cap:ios: "bun run cap:logs & bunx cap run ios --live-reload --port 5173; kill %1 2>/dev/null"
```

> [!NOTE]
> Before running `cap:android` or `cap:ios` you should run `bun dev` in a separate terminal.

### Manual IDE Opening

```bash
# Open Xcode
bunx cap open ios

# Open Android Studio
bunx cap open android
```

📖 **Reference:** [Open Command](https://capacitorjs.com/docs/cli/commands/open)

---

## Building for Production

### iOS Production Build

First edit the `package.json` scripts:
```js
"cap:ios:build": "infisical run --env=prod -- bun run build && bunx cap build ios"
```

Then you can build your iOS app:

```bash
bun run cap:ios:build
```

This will:
1. Build the web app with production settings
2. Build .ipa file

📖 **Reference:** [iOS Deployment](https://capacitorjs.com/docs/ios/deploying-to-app-store)

### Android Production Build

Firs edit the `package.json` scripts:
```js
"cap:android:build": "infisical run --env=prod -- bun run build && bunx cap build android"
```

Then you can build your Android app:

```bash
bun run cap:android:build
```

This will:
1. Build the web app with production settings
2. Build .aab file

📖 **Reference:** [Android Deployment](https://capacitorjs.com/docs/android/deploying-to-google-play)

### App Store / Play Store Guides

- [Deploying to App Store](https://capacitorjs.com/docs/ios/deploying-to-app-store)
- [Deploying to Google Play](https://capacitorjs.com/docs/android/deploying-to-google-play)

---

## Useful Resources

### Official Documentation

| Resource | Link |
|----------|------|
| Capacitor Docs | https://capacitorjs.com/docs |
| Getting Started | https://capacitorjs.com/docs/getting-started |
| CLI Reference | https://capacitorjs.com/docs/cli |
| Configuration | https://capacitorjs.com/docs/config |
| iOS Guide | https://capacitorjs.com/docs/ios |
| Android Guide | https://capacitorjs.com/docs/android |
| Live Reload | https://capacitorjs.com/docs/guides/live-reload |
| Debugging | https://capacitorjs.com/docs/guides/debugging |

### Plugins

| Plugin | Description | Link |
|--------|-------------|------|
| Camera | Take photos and videos | https://capacitorjs.com/docs/apis/camera |
| Filesystem | Read/write files | https://capacitorjs.com/docs/apis/filesystem |
| Geolocation | GPS coordinates | https://capacitorjs.com/docs/apis/geolocation |
| Push Notifications | Firebase/APNs | https://capacitorjs.com/docs/apis/push-notifications |
| Local Notifications | Schedule notifications | https://capacitorjs.com/docs/apis/local-notifications |
| Splash Screen | Control splash screen | https://capacitorjs.com/docs/apis/splash-screen |
| Status Bar | Style the status bar | https://capacitorjs.com/docs/apis/status-bar |
| Keyboard | Keyboard events | https://capacitorjs.com/docs/apis/keyboard |
| Haptics | Vibration feedback | https://capacitorjs.com/docs/apis/haptics |
| Share | Native share dialog | https://capacitorjs.com/docs/apis/share |

📖 **Full Plugin List:** https://capacitorjs.com/docs/plugins

---

## Package.json Scripts Reference

| Script | Description |
|--------|-------------|
| `bun run cap:sync` | Build web app and sync to native platforms |
| `bun run cap:ios` | Run iOS app with live reload |
| `bun run cap:android` | Run Android app with live reload |
| `bun run cap:ios:build` | Production build for iOS |
| `bun run cap:android:build` | Production build for Android |
| `bun run logs` | Start remote console log server |

---

## Version Information

This guide is based on:
- Capacitor v7.x
- @capacitor/cli: ^7.4.5
- @capacitor/core: ^7.4.5
- @capacitor/ios: ^7.4.5
- @capacitor/android: ^7.4.5
