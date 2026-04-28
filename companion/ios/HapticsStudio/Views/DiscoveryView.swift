/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Combine
import Network
import SwiftUI

struct DiscoveryView: View {
  @ObservedObject var udpListener: UDPListener
  @State private var showManualConnection: Bool
  @State private var ipAddress: String
  @State private var connectToManualIp: Bool

  init(udpListener: UDPListener, showManualConnection: Bool = false, ipAddress: String = "", connectToManualIp: Bool = false) {
    self.udpListener = udpListener
    self.showManualConnection = showManualConnection
    self.ipAddress = UserDefaults.standard.string(forKey: "IP_ADDRESS") ?? "192.168.0.1"
    self.connectToManualIp = connectToManualIp
  }

  var keys: [String] {
    return udpListener.endpoints.keys.sorted().map { String($0) }
  }

  func isIpValid(text: String) -> Bool {
    var ipv4 = sockaddr_in()
    var ipv6 = sockaddr_in6()
    return
      text.withCString({ cstring in inet_pton(AF_INET, cstring, &ipv4.sin_addr) }) == 1 || text.withCString({ cstring in inet_pton(AF_INET6, cstring, &ipv6.sin6_addr) }) == 1
  }

  var body: some View {
    NavigationStack {
      VStack {
        if showManualConnection {
          VStack {
            Text("Enter the IP address")
              .padding(.top, 20)
            ManualIpView(showManualConnection: $showManualConnection, ipAddress: $ipAddress, connectToManualIp: $connectToManualIp)
          }
        } else {
          List {
            Section(header: Text("Hosts")) {
              ForEach(keys, id: \.self) { key in
                NavigationLink {
                  ClipsView(endpoint: udpListener.endpoints[key])
                } label: {
                  HStack {
                    Image(systemName: "laptopcomputer")
                    Text(key)
                  }
                  .foregroundColor(Color("TextColor"))
                }
                .listRowBackground(Color("LightBackgroundColor"))
                .foregroundColor(.white)
              }
              if keys.count == 0 {
                Text("No hosts available")
              }
            }
          }
          .scrollContentBackground(.hidden)
        }

        if !showManualConnection {
          Button {
            showManualConnection = true
          } label: {
            Text("Can't find your device?")
              .font(.footnote)
          }
          .offset(y: -10)
        }
      }
      .background(Color("BackgroundColor"))
      .foregroundColor(Color("TextColor"))
      .navigationDestination(isPresented: $connectToManualIp) {
        ClipsView(endpoint: SocketEndpoint(message: SocketEndpointMessage(hostname: ipAddress, port: 9999), ip: ipAddress))
      }
    }.onAppear {
      connectToManualIp = false
    }
  }
}

struct ManualIpView: View {
  @State private var hasManualAddress: Bool = false
  @Binding var showManualConnection: Bool
  @Binding var ipAddress: String
  @Binding var connectToManualIp: Bool

  func isIpValid(text: String) -> Bool {
    var ipv4 = sockaddr_in()
    var ipv6 = sockaddr_in6()
    return
      text.withCString({ cstring in inet_pton(AF_INET, cstring, &ipv4.sin_addr) }) == 1 || text.withCString({ cstring in inet_pton(AF_INET6, cstring, &ipv6.sin6_addr) }) == 1
  }

  var body: some View {
    VStack {
      TextField("IP Address", text: $ipAddress) {}
        .cornerRadius(16)
        .padding()
        .background(Color("LightBackgroundColor"))
        .onReceive(Just(ipAddress)) { ipAddress in
          hasManualAddress = isIpValid(text: ipAddress)
        }

      HStack(spacing: 20) {
        Button {
          showManualConnection = false
        } label: {
          Text("Cancel")
            .frame(width: 100)
            .padding(10)
            .background(Color("LightBackgroundColor"))
            .cornerRadius(8)
        }

        Button {
          UserDefaults.standard.setValue(ipAddress, forKey: "IP_ADDRESS")
          connectToManualIp = true
        } label: {
          Text("Connect")
            .frame(width: 100)
            .padding(10)
            .background(Color("AccentColor"))
            .cornerRadius(8)
        }
        .disabled(!hasManualAddress)
        .opacity(hasManualAddress ? 1 : 0.6)
      }
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}
