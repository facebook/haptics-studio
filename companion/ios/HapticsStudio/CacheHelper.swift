/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Foundation
import os

private let logger = Logger(subsystem: "com.example.HapticsStudio", category: "CacheHelper")

class CacheHelper {
  public static var cachePath: String {
    let cachePath = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].path()
    return URL(fileURLWithPath: cachePath).appendingPathComponent("audio").path()
  }

  public static func audioURL(for clipId: String) -> URL {
    return URL(fileURLWithPath: CacheHelper.cachePath).appendingPathComponent(clipId)
  }

  public static func fileExists(clipId: String) -> Bool {
    return FileManager.default.fileExists(atPath: audioURL(for: clipId).path())
  }

  public static func storeAudio(for clipId: String, data: Data) {
    let url = audioURL(for: clipId)
    try? FileManager.default.createDirectory(atPath: CacheHelper.cachePath, withIntermediateDirectories: true)
    do {
      try data.write(to: url)
    } catch {
      logger.error("\(error.localizedDescription)")
    }
  }
}
