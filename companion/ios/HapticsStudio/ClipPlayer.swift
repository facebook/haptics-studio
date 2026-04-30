/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import AVFoundation
import CoreHaptics
import Foundation
import os

private let logger = Logger(subsystem: "com.example.HapticsStudio", category: "ClipPlayer")

struct AhapHaptic: Codable {
  var continuous: String
  var transients: String?
}

struct AhapPlayer {
  let continuousEngine: CHHapticEngine
  let transientsEngine: CHHapticEngine

  init() throws {
    self.continuousEngine = try CHHapticEngine()
    self.transientsEngine = try CHHapticEngine()
  }

  public func start() throws {
    try continuousEngine.start()
    try transientsEngine.start()
  }

  public func stop() {
    continuousEngine.stop()
    transientsEngine.stop()
  }

  public func playPattern(pattern: AhapHaptic) {
    try? continuousEngine.playPattern(from: Data(pattern.continuous.utf8))
    if let transients = pattern.transients {
      try? transientsEngine.playPattern(from: Data(transients.utf8))
    }
  }
}

class ClipPlayer: NSObject {
  public typealias ClipDidFinishCompletion = (_ didFinish: Bool) -> Void

  static let shared = ClipPlayer()

  private var ahapPlayer: AhapPlayer?
  private var audioPlayer: AVAudioPlayer?
  private var clipCompletionHandler: ClipDidFinishCompletion?

  override init() {
    ahapPlayer = try? AhapPlayer()
    try? AVAudioSession.sharedInstance().setCategory(AVAudioSession.Category.playback, options: .mixWithOthers)
    try? AVAudioSession.sharedInstance().setActive(true)
    try? ahapPlayer?.start()
  }

  func playClip(clipId: String, pattern: AhapHaptic, completion: @escaping ClipDidFinishCompletion) {
    self.clipCompletionHandler = completion

    if audioPlayer?.isPlaying ?? false {
      audioPlayer?.stop()
    }
    ahapPlayer?.stop()

    var hasAudio = true

    do {
      let data = try Data(contentsOf: CacheHelper.audioURL(for: clipId), options: .mappedIfSafe)
      audioPlayer = try AVAudioPlayer(data: data, fileTypeHint: AVFileType.wav.rawValue)
      audioPlayer?.delegate = self
      audioPlayer?.prepareToPlay()
    } catch {
      hasAudio = false
      logger.error("\(error.localizedDescription)")
    }

    ahapPlayer?.playPattern(pattern: pattern)
    if hasAudio {
      audioPlayer?.play()
    }
  }
}

extension ClipPlayer: AVAudioPlayerDelegate {
  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    clipCompletionHandler?(flag)
  }
}
