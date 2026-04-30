/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Combine
import Foundation
import Network
import os

private let logger = Logger(subsystem: "com.example.HapticsStudio", category: "UDPListener")

nonisolated struct SocketEndpointMessage: Codable {
  var hostname: String
  var port: Int
}

struct SocketEndpoint {
  var hostname: String
  var ip: String
  var port: Int

  init(message: SocketEndpointMessage, ip: String) {
    self.hostname = message.hostname
    self.ip = ip
    self.port = message.port
  }
}

class UDPConnection {
  let connection: NWConnection

  init(connection: NWConnection) {
    self.connection = connection
    self.connection.start(queue: .main)
  }

  func receive(done: @escaping (_ socketEndpoint: SocketEndpoint?) -> Void) {
    self.connection.receiveMessage { [connection] content, context, isComplete, error in
      if let error {
        logger.info("Error: NWError received in \(#function) - \(error.localizedDescription)")
        return
      }

      guard isComplete, let content else {
        logger.info("Error: Received nil Data with context - \(String(describing: context))")
        return
      }

      var endpoint: SocketEndpoint?
      if let endpointMessage = try? JSONDecoder().decode(SocketEndpointMessage.self, from: content) {
        switch connection.endpoint {
        case .hostPort(let host, _):
          endpoint = SocketEndpoint(message: endpointMessage, ip: "\(host)")
        default: break
        }
      }

      connection.cancel()

      done(endpoint)
    }
  }
}

class UDPListener: ObservableObject {
  private var listener: NWListener?
  private var connection: UDPConnection?

  private var queue = DispatchQueue.global(qos: .userInitiated)
  var isListening: Bool = false

  @Published private(set) var endpoints: [String: SocketEndpoint] = [:]

  convenience init(on port: Int) {
    self.init()
    startListening(on: NWEndpoint.Port(integerLiteral: NWEndpoint.Port.IntegerLiteralType(port)))
  }

  private func startListening(on port: NWEndpoint.Port) {
    let params = NWParameters.udp
    params.allowLocalEndpointReuse = true
    params.allowFastOpen = true
    self.listener = try? NWListener(using: params, on: port)
    self.listener?.stateUpdateHandler = { [weak self] update in
      switch update {
      case .failed(let error):
        logger.info("Unable to start UDP listener \(error.localizedDescription)")
      default:
        logger.info("Listening on \(port.rawValue)")
        self?.isListening = true
      }
    }
    self.listener?.newConnectionHandler = { [weak self] connection in
      self?.createConnection(connection: connection)
    }
    self.listener?.start(queue: queue)
  }

  private func createConnection(connection: NWConnection) {
    self.connection = UDPConnection(connection: connection)
    self.connection?.receive { [weak self] socketEndpoint in
      if let socketEndpoint {
        self?.endpoints[socketEndpoint.hostname] = socketEndpoint
      }
    }
  }

  private func cancel() {
    isListening = false
  }
}
