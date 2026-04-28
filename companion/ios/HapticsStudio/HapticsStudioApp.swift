/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SwiftUI

@main
struct HapticsStudioApp: App {
  @State private var udpListener = UDPListener(on: 9998)

  var body: some Scene {
    WindowGroup {
      DiscoveryView(udpListener: udpListener)
    }
  }
}
