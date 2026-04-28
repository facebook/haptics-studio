/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Combine
import Foundation
import SocketIO
import UIKit
import os

private let logger = Logger(subsystem: "com.example.HapticsStudio", category: "ProjectViewModel")

struct Clip: Codable {
  var clipId: String
  var name: String
  var mime: String
  var lastUpdate: Int
}

struct ClipGroup: Codable {
  var id: String
  var name: String?
  var isFolder: Bool
  var clips: [String]
}

struct Project: Codable {
  var id: String
  var name: String
  var currentClipId: String
  var clips: [Clip]
  var groups: [ClipGroup]
  var lastUpdate: Int
}

class SocketIOManager {
  private var socketManager: SocketManager?

  var defaultSocket: SocketIOClient? {
    return self.socketManager?.defaultSocket
  }

  func connect(to socketEndpoint: SocketEndpoint, onConnection: () -> Void) {
    if let url = URL(string: "ws://\(socketEndpoint.ip):\(socketEndpoint.port)") {
      self.socketManager = SocketManager(
        socketURL: url,
        config: [
          .log(false),
          .version(SocketIOVersion.three),
          .path("/ws"),
          .reconnects(true),
          .reconnectWait(1),
          .connectParams(["deviceId": UIDevice.current.identifierForVendor?.uuidString ?? "unknown", "name": UIDevice.current.name, "model": UIDevice.current.model, "version": "1.0.0"]),
        ]
      )

      onConnection()

      self.socketManager?.defaultSocket.connect()
    }
  }

  func disconnect() {
    self.socketManager?.disconnect()
    self.socketManager = nil
  }
}

class ProjectViewModel: ObservableObject {
  @Published private(set) var isConnecting = true
  @Published private(set) var isConnected = false
  @Published private(set) var shouldAuthenticate = false
  @Published private(set) var project: Project?
  @Published private(set) var currentPlayingClip: String?

  private var socketEndpoint: SocketEndpoint?
  private var socketManager: SocketIOManager?

  func connect(to socketEndpoint: SocketEndpoint, socketManager: SocketIOManager = SocketIOManager()) {
    self.socketEndpoint = socketEndpoint
    self.socketManager = socketManager

    socketManager.connect(to: socketEndpoint) {
      registerSocketHandlers()
    }
  }

  func disconnect() {
    self.socketManager?.disconnect()
  }

  func sendAuthenticationCode(code: String) {
    guard let socket = self.socketManager?.defaultSocket else { return }

    socket.emit("auth_request", ["authCode": code])
  }

  private func registerSocketHandlers() {
    guard let socket = self.socketManager?.defaultSocket else { return }

    socket.on(clientEvent: .connect) { data, ack in
      logger.info("socket connected")
    }

    socket.on("auth_required") { [weak self] _, _ in
      self?.shouldAuthenticate = true
    }

    socket.on("auth_granted") { [weak self] _, _ in
      self?.onAuthenticationGranted()
    }

    socket.on("auth_request") { [weak self] data, _ in
      if let message = data.first as? [String: String] {
        if message["status"] == "ok" {
          self?.onAuthenticationGranted()
        }
      }
    }

    socket.on("current_project") { [weak self] data, _ in
      if let message = data.first as? [String: Any],
        let data = try? JSONSerialization.data(withJSONObject: message),
        let project = try? JSONDecoder().decode(Project.self, from: data)
      {
        self?.project = project
        self?.project?.clips.forEach({ clip in
          socket.emit("get_clip", ["clipId": clip.clipId])
          if !CacheHelper.fileExists(clipId: clip.clipId) {
            socket.emit("get_audio", ["clipId": clip.clipId])
          }
        })
      }
    }

    socket.on("get_ahap") { data, _ in
      if let message = data.first as? [String: Any],
        let clipId = message["clipId"] as? String,
        let haptic = message["ahap"] as? [String: String?],
        let continuous = haptic["continuous"] as? String
      {
        let transients = haptic["transients"] ?? nil
        let ahap = AhapHaptic(continuous: continuous, transients: transients)
        ClipPlayer.shared.playClip(clipId: clipId, pattern: ahap) { [weak self] _ in
          self?.currentPlayingClip = nil
        }
      }
    }

    socket.on("get_audio") { data, _ in
      if let message = data.first as? [String: String],
        let clipId = message["clipId"],
        let base64 = message["audio"]
      {
        let base64Data = String(base64.split(separator: ",").last ?? "")
        if let data = Data(base64Encoded: base64Data) {
          CacheHelper.storeAudio(for: clipId, data: data)
        }
      }
    }
  }

  public func playClip(clipId: String) {
    guard let socket = self.socketManager?.defaultSocket else { return }
    socket.emit("get_ahap", ["clipId": clipId])
    currentPlayingClip = clipId
  }

  private func onAuthenticationGranted() {
    guard let socket = self.socketManager?.defaultSocket else { return }

    self.shouldAuthenticate = false
    self.isConnected = true
    self.isConnecting = false

    socket.emit("current_project")
  }
}
