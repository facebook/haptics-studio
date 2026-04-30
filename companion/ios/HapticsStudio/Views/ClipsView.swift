/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SwiftUI

struct ClipsView: View {
  var endpoint: SocketEndpoint?

  @StateObject var viewModel: ProjectViewModel
  @State private var code: String = ""
  @FocusState private var codeFieldFocussed: Bool

  init(endpoint: SocketEndpoint?, viewModel: ProjectViewModel? = nil) {
    self.endpoint = endpoint
    self._viewModel = .init(wrappedValue: viewModel ?? ProjectViewModel())
  }

  var body: some View {
    ZStack {
      if viewModel.isConnecting && !viewModel.shouldAuthenticate {
        Text("Connecting to Haptics Studio...")
      }
      if viewModel.shouldAuthenticate {
        VStack {
          Text("To connect Studio Desktop enter the code displayed in the Desktop App")
            .multilineTextAlignment(.center)
          TextField("----", text: $code)
            .focused($codeFieldFocussed)
            .keyboardType(.numberPad)
            .autocorrectionDisabled()
            .font(Font.system(size: 60))
            .tracking(20)
            .bold()
            .multilineTextAlignment(.center)
            .padding()
            .onSubmit {
              viewModel.sendAuthenticationCode(code: code)
            }
          Button("Submit") {
            viewModel.sendAuthenticationCode(code: code)
          }
          .buttonStyle(.borderedProminent)
        }
      }
      if viewModel.isConnected && viewModel.project == nil {
        Text("Connected")
      }
      if let project = viewModel.project {
        VStack {
          Text(project.name)
          List {
            ForEach(project.groups, id: \.id) { group in
              if group.isFolder {
                Section(group.name ?? "") {
                  ForEach(group.clips, id: \.self) { clipId in
                    if let clip = project.clips.first(where: { clip in
                      clip.clipId == clipId
                    }) {
                      ClipView(clip: clip, viewModel: viewModel, isPlaying: viewModel.currentPlayingClip == clip.clipId)
                    }
                  }
                }
              } else {
                if let clip = project.clips.first(where: { clip in
                  clip.clipId == group.clips.first
                }) {
                  ClipView(clip: clip, viewModel: viewModel, isPlaying: viewModel.currentPlayingClip == clip.clipId)
                }
              }
            }
          }
          .background(Color("BackgroundColor"))
          .scrollContentBackground(.hidden)
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color("BackgroundColor"))
    .foregroundColor(Color("TextColor"))
    .onAppear {
      if let endpoint {
        viewModel.connect(to: endpoint)
      }
    }
    .onDisappear {
      viewModel.disconnect()
    }
  }
}

struct ClipView: View {
  var clip: Clip
  var viewModel: ProjectViewModel
  var isPlaying: Bool

  var body: some View {
    Button {
      viewModel.playClip(clipId: clip.clipId)
    } label: {
      HStack {
        Image("ClipIcon")
          .foregroundStyle(isPlaying ? .blue : .white)
        Text(clip.name)
          .foregroundColor(Color("TextColor"))
      }
    }
    .listRowBackground(Color("LightBackgroundColor"))
    .foregroundColor(.white)
  }
}
