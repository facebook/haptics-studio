// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System;
using System.Collections.Generic;
using SocketIOClient;
using SocketIOClient.JsonSerializer;
using UnityEngine;

namespace HapticStudio
{
    /// <summary>
    /// Socket client that wraps the SocketIO dependency
    /// </summary>
    public class SocketClient
    {
        public SocketEndpoint Endpoint => _endpoint;

        private SocketIOUnity _socket;
        protected SocketEndpoint _endpoint;
        protected bool _isPingSocket;

        /// <summary>
        /// Initializer.
        /// </summary>
        /// <param name="endpoint">The socket endpoint</param>
        /// <param name="ping">Flag that marks the socket as a ping socket, used to check for server availability.</param>
        public SocketClient(SocketEndpoint endpoint, bool ping = false)
        {
            _endpoint = endpoint;
            _isPingSocket = ping;
            var uri = new Uri($"ws://{endpoint.ip}:{endpoint.port}");

            _socket = new SocketIOUnity(uri, new SocketIOOptions
            {
                Query = new Dictionary<string, string>
                    {
                        { "deviceId", SystemInfo.deviceUniqueIdentifier },
                        { "name", SystemInfo.deviceName },
                        { "model", SystemInfo.deviceModel },
                        { "version", Application.version },
                        { "ping", ping.ToString() }
                    },
                // @oss-disable
                // EIO = EngineIO.V4, // @oss-enable
                Path = "/ws",
                Reconnection = !ping,
                Transport = SocketIOClient.Transport.TransportProtocol.WebSocket
            });
        }

        public virtual void Connect()
        {
            if (_endpoint == null) return;

            if (!_isPingSocket)
            {
                Debug.Log($"Connecting to ws://{_endpoint.ip}:{_endpoint.port}");
            }

            _socket.Connect();
        }

        public virtual void Disconnect()
        {
            _socket.Disconnect();
        }

        public IJsonSerializer JsonSerializer { get => _socket.JsonSerializer; set => _socket.JsonSerializer = value; }

        public virtual bool Connected { get => _socket.Connected; }

        public virtual event EventHandler OnConnected { add { _socket.OnConnected += value; } remove { _socket.OnConnected -= value; } }
        public virtual event EventHandler<string> OnError { add { _socket.OnError += value; } remove { _socket.OnError -= value; } }
        public virtual event EventHandler<string> OnDisconnected { add { _socket.OnDisconnected += value; } remove { _socket.OnDisconnected -= value; } }

        public virtual void On(string eventName, Action<SocketIOResponse> callback)
        {
            _socket.On(eventName, callback);
        }

        public virtual void Emit(string eventName, params object[] data)
        {
            _socket.Emit(eventName, data);
        }

        public virtual void EmitStringAsJSON(string eventName, string json)
        {
            _socket.EmitStringAsJSON(eventName, json);
        }
    }
}
