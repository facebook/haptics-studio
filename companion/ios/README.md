# Haptics Studio iOS Companion App

Sample iOS companion app that pairs with the Haptics Studio desktop application. It auditions haptic clips authored on the desktop on a real iOS device.

This project is intended as **sample code** demonstrating how to build a companion app for Haptics Studio.

## Requirements

- Xcode 16 or later
- iOS 17 or later (deployment target is currently set to the latest iOS, adjust in project settings if needed)
- A physical iOS device — haptic feedback does not play in the Simulator

## Getting Started

1. Open `HapticsStudio.xcodeproj` in Xcode.
2. Update the **Signing & Capabilities** section with your own development team and a unique bundle identifier.
3. Select your iOS device as the run destination and press ⌘R.

## How It Works

| File | Purpose |
| --- | --- |
| `HapticsStudioApp.swift` | App entry point. Hosts the `DiscoveryView` and starts the UDP listener on port 9998. |
| `UDPListener.swift` | Listens for UDP broadcasts from the desktop app to discover available hosts on the local network. |
| `ProjectViewModel.swift` | Connects to the desktop app over Socket.IO (port 9999, path `/ws`), handles authentication, fetches the current project, and plays clips on demand. |
| `ClipPlayer.swift` | Wraps `CHHapticEngine` and `AVAudioPlayer` to play `.ahap` patterns alongside their `.wav` audio. |
| `CacheHelper.swift` | Caches clip audio downloaded from the desktop app in the app's Caches directory. |
| `Views/DiscoveryView.swift` | Root navigation. Lists discovered desktop hosts and falls back to manual IP entry. |
| `Views/ClipsView.swift` | Displays the project clips received from the desktop and triggers playback. |

## Network Permissions

The first launch will prompt for **local network** access (`NSLocalNetworkUsageDescription`). This is required to discover the desktop app on the LAN.
