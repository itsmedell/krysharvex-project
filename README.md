# Moonveil — Offline 2D Anime RPG

**By Krysharvex Selenia**

Moonveil is a small, offline-first, anime-inspired 2D action RPG prototype. It uses HTML Canvas and JavaScript, with Vite for the web build and Capacitor to package the game as an Android app.

## Prototype features

- Top-down moonlit forest with original canvas-drawn scenery and characters.
- Silver-haired wanderer, forest slimes, a moon shrine, and a starter quest.
- Touch D-pad movement and attack button for phones and tablets.
- Keyboard controls for desktop testing: WASD or arrow keys to move; Space or J to attack.
- XP, levels, HP, moon coins, enemy respawns, and simple sound effects.
- No account, network, external asset, or online service required at runtime.

## Run on a computer or browser IDE

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To make a production web build:

```sh
npm run build
npm run preview
```

## Build an Android APK

The Android project is generated locally by Capacitor; it is not committed to this repository.

Requirements:
- Node.js 20+
- Android Studio with an Android SDK installed
- A supported JDK (use the version recommended by your installed Android Gradle Plugin/Android Studio)

Commands:

```sh
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio, wait for Gradle sync, then select **Build > Build Bundle(s) / APK(s) > Build APK(s)**. For a signed release APK, use **Build > Generate Signed Bundle / APK** and keep the signing key private.

After changing the game code, run `npm run android:sync` and rebuild in Android Studio.

## Important notes

- This repository contains the source code, not a prebuilt APK.
- Android APK compilation requires Android build tools; it cannot be completed by GitHub source files alone.
- Gameplay is a prototype and can be expanded with dialogue, inventory, more areas, save data, quests, and bosses.

## Project structure

```text
.
├── index.html
├── src/
│   ├── main.js
│   └── style.css
├── package.json
├── capacitor.config.json
├── vite.config.js
└── README.md
```
