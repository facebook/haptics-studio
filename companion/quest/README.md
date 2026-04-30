# Haptics Studio Companion App

The Haptics Studio Companion app is a Unity application built for Meta Quest. It pairs with the [Haptics Studio desktop app](../../README.md) over your local network, letting you preview and audition haptic clips directly on Quest controllers as you design them.

## How it works

The companion app connects to a running instance of the Haptics Studio desktop app via WiFi or USB. Once paired using a 4-digit security code, the companion app syncs your current project and streams haptic clips and audio to the headset in real time. As you iterate on clips in the desktop app, the companion app stays in sync so you can feel every change immediately on the controllers.

## Quick start

### Prerequisites

- [Unity 6](https://unity.com/releases/editor/archive) (6000.2.x or later)
- Meta Quest headset
- [Haptics Studio desktop app](../../README.md) installed and running

### Build and install

1. Open the project in Unity.
2. Open **File > Build Settings**, select **Android**, and click **Switch Platform**.
3. Under **IL2CPP Code Generation**, select **Faster (smaller) builds**.
4. Confirm that **Scenes/MainScene** is listed in **Scenes in Build**.
5. Connect your Quest headset via USB and click **Build and Run**.

### Pair with the desktop app

1. Launch the Haptics Studio desktop app on your computer and open a project.
2. Put on your Quest headset and launch the Haptics Studio Companion app.
3. The companion app will automatically discover the desktop app if both devices are on the same WiFi network. You can also connect over USB or enter the desktop app's IP address manually.
4. Enter the 4-digit security code shown in the desktop app to complete pairing.
5. Your project's haptic clips are now synced to the headset. Select a clip in the desktop app to feel it on the controllers.

## License

This project is licensed under the MIT License. See [LICENSE](../../LICENSE) for details.
