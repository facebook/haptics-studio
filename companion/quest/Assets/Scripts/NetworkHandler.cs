// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using SocketIOClient.Newtonsoft.Json;
using UnityEngine;

namespace HapticStudio
{
    public class NetworkHandler : MonoBehaviour
    {
        const int DISCOVERY_PORT = 9998;

        public delegate void NewHostDelegate();

        public event NewHostDelegate OnNewHost;

        public delegate void SocketConnected(SocketEndpoint endpoint);

        public event SocketConnected OnSocketConnected;

        public delegate void SocketDisconnected();

        public event SocketDisconnected OnSocketDisconnected;

        public delegate void SocketError();

        public event SocketError OnSocketError;

        public delegate void SocketAuthRequest();

        public event SocketAuthRequest OnSocketAuthenticationRequest;

        public delegate void SocketAuthGranted(SocketEndpoint endpoint);

        public event SocketAuthGranted OnSocketAuthenticationGranted;

        public delegate void SocketAuthError();

        public event SocketAuthError OnSocketAuthenticationError;

        public delegate void SetCurrentProject(Project project);

        public event SetCurrentProject OnSetCurrentProject;
        public Project CurrentProject { get; private set; }

        public delegate void ProjectLoaded();

        public event ProjectLoaded OnProjectLoaded;

        public delegate void CloseCurrentProhect();

        public event CloseCurrentProhect OnCloseCurrentProject;

        public delegate void SetCurrentClipId(string clipId);

        public event SetCurrentClipId OnSetCurrentClipId;

        public delegate void GetClipData(Clip data);

        public event GetClipData OnGetClipData;

        public delegate void GetClipAudio(AudioBinaryData data);

        public event GetClipAudio OnGetClipAudio;

        public delegate void PlayTestPattern();

        public event PlayTestPattern OnPlayTestPattern;

        public Dictionary<string, SocketEndpoint> Endpoints => _endpoints;

        private SocketClient _socketClient;
        private SocketClient _pingClient;
        private UdpClient _udpClient;
        private readonly Dictionary<string, bool> _fetchingHaptics = new();
        private readonly Dictionary<string, bool> _fetchingAudio = new();
        private bool _listening = true;
        private readonly Dictionary<string, SocketEndpoint> _endpoints = new();

        private SocketEndpoint UsbEndpoint
        {
            get
            {
                var local = new SocketEndpoint();
                local.hostname = "USB Connection";
                local.port = "9999";
                local.ip = "localhost";
                return local;
            }
        }

        /// <summary>
        /// Creates the UDP client that listens for the discovery messages
        /// </summary>
        public void Listen()
        {
            Task.Run(() =>
            {
                Debug.Log("Listening for broadcast UDP messages");
                _udpClient = new UdpClient(DISCOVERY_PORT);
                var from = new IPEndPoint(0, 0);

                while (_listening)
                {
                    var receive = _udpClient.Receive(ref from);
                    var msg = Encoding.UTF8.GetString(receive);
                    SocketEndpoint endpoint = JsonUtility.FromJson<SocketEndpoint>(msg);
                    var isEndpointNew = !_endpoints.ContainsKey(endpoint.hostname);
                    endpoint.ip = from.Address.ToString();
                    _endpoints[endpoint.hostname] = endpoint;
                    if (isEndpointNew)
                    {
                        Debug.Log($"Found host: {endpoint.hostname}, ip: {endpoint.ip}, port: {endpoint.port}");
                        OnNewHost();
                        ReconnectIfPossible(endpoint);
                    }
                }
            });
        }

        /// <summary>
        /// Attempts the connection to an endpoint and sets the message handlers
        /// </summary>
        /// <param name="socketClient">The socket client</param>
        public virtual void ConnectToSocket(SocketClient socketClient)
        {
            _socketClient = socketClient;
            _socketClient.JsonSerializer = new NewtonsoftJsonSerializer();
            _socketClient.OnConnected += (sender, e) =>
            {
                Debug.Log("socket connected");
                OnSocketConnected?.Invoke(socketClient.Endpoint);
            };
            _socketClient.OnDisconnected += (sender, e) =>
            {
                Debug.Log("socket disconnected");
                OnSocketDisconnected?.Invoke();
            };
            _socketClient.OnError += (sender, e) =>
            {
                Debug.Log($"Socket OnError: {e}");
                OnSocketError?.Invoke();
            };
            _socketClient.On("auth_granted", (response) =>
            {
                OnSocketAuthenticationGranted?.Invoke(socketClient.Endpoint);
            });
            _socketClient.On("auth_required", (response) =>
            {
                OnSocketAuthenticationRequest?.Invoke();
            });
            _socketClient.On("auth_request", (response) =>
            {
                if (response.GetValue<SocketResponse>().status.Equals("ok"))
                {
                    OnSocketAuthenticationGranted?.Invoke(socketClient.Endpoint);
                }
                else
                {
                    OnSocketAuthenticationError?.Invoke();
                }
            });
            _socketClient.On("current_project", (response) =>
            {
                _fetchingHaptics.Clear();
                _fetchingAudio.Clear();
                Project project = response.GetValue<Project>();
                if (project != null && project.IsValid)
                {
                    Debug.Log($"OnSetCurrentProject {project.name}");
                    CurrentProject = project;
                    OnSetCurrentProject?.Invoke(project);

                    foreach (Clip clip in project.clips)
                    {
                        _fetchingHaptics.TryAdd(clip.clipId, true);
                        _socketClient.EmitStringAsJSON("get_clip", $"{{ \"clipId\": \"{clip.clipId}\" }}");

                        if (!CurrentProjectHandler.HasAudioForClip(clip.clipId))
                        {
                            _fetchingAudio.TryAdd(clip.clipId, true);
                            _socketClient.EmitStringAsJSON("get_audio",
                                $"{{ \"clipId\": \"{clip.clipId}\", \"binary\": true }}");
                        }
                    }
                }
            });
            _socketClient.On("get_clip", (response) =>
            {
                Clip data = response.GetValue<Clip>();
                _fetchingHaptics[data.clipId] = false;
                OnGetClipData?.Invoke(data);

                if (IsCurrentProjectLoaded())
                {
                    OnProjectLoaded?.Invoke();
                }
            });
            _socketClient.On("get_audio", (response) =>
            {
                // Legacy support to previous versions of Studio that do not support the bytearray audio
                AudioData audioData = response.GetValue<AudioData>();
                AudioBinaryData binaryData = AudioBinaryData.FromAudioData(audioData);
                _fetchingAudio[audioData.clipId] = false;

                if (binaryData != null)
                {
                    OnGetClipAudio?.Invoke(binaryData);

                    if (IsCurrentProjectLoaded())
                    {
                        OnProjectLoaded?.Invoke();
                    }
                }
            });
            _socketClient.On("get_audio_binary", (response) =>
            {
                AudioBinaryData data = response.GetValue<AudioBinaryData>();
                _fetchingAudio[data.clipId] = false;
                OnGetClipAudio?.Invoke(data);

                if (IsCurrentProjectLoaded())
                {
                    OnProjectLoaded?.Invoke();
                }
            });
            _socketClient.On("project_close", (response) =>
            {
                OnCloseCurrentProject?.Invoke();
            });
            _socketClient.On("current_clip", (response) =>
            {
                CurrentClipMessage message = response.GetValue<CurrentClipMessage>();
                if (message != null)
                {
                    OnSetCurrentClipId?.Invoke(message.currentClipId);
                }
            });
            _socketClient.On("clip_update", (response) =>
            {
                Clip data = response.GetValue<Clip>();
                OnGetClipData?.Invoke(data);
            });
            _socketClient.On("play_test_pattern", (response) =>
            {
                OnPlayTestPattern?.Invoke();
            });
            _socketClient.Connect();
        }

        /// <summary>
        /// Attempts the connection to an the localhost endpoint, if successful, the connection will close immediately
        /// </summary>
        public void PingUSBMonitor()
        {
            // Avoid pinging the usb connection if a socket is already live
            if (_socketClient != null && _socketClient.Connected) return;

            if (_pingClient == null)
            {
                _pingClient = new SocketClient(UsbEndpoint, true);
                _pingClient.JsonSerializer = new NewtonsoftJsonSerializer();
                _pingClient.OnConnected += (sender, e) =>
                {
                    AddUSBConnection();
                    _pingClient.Disconnect();
                };
                _pingClient.OnError += (sender, e) =>
                {
                    RemoveUSBConnection();
                };
            }

            _pingClient.Connect();
        }

        /// <summary>
        /// Helper to trigger event on Start, handles the case Studio is already open with a project
        /// </summary>
        public void TriggerCurrentProjectEvent()
        {
            OnSetCurrentProject?.Invoke(CurrentProject);
        }

        private void AddUSBConnection()
        {
            if (_endpoints.ContainsKey(UsbEndpoint.hostname)) return;

            _endpoints[UsbEndpoint.hostname] = UsbEndpoint;
            OnNewHost();
            ReconnectIfPossible(UsbEndpoint);
        }

        private void RemoveUSBConnection()
        {
            if (!_endpoints.ContainsKey(UsbEndpoint.hostname)) return;

            _endpoints.Remove(UsbEndpoint.hostname);
            OnNewHost();
        }

        /// <summary>
        /// Check if a clip is fully loaded
        /// </summary>
        /// <param name="clip">The clip id</param>
        /// <returns>The loading state of the clip, `true` if there are no pending fetch requests</returns>
        public bool IsLoadingClip(string clip)
        {
            return (_fetchingHaptics.ContainsKey(clip) && _fetchingHaptics[clip]) ||
                   (_fetchingAudio.ContainsKey(clip) && _fetchingAudio[clip]);
        }

        /// <summary>
        /// Check if there are pending fetch requests for haptics or audio files
        /// </summary>
        /// <returns>True if the project is fully loaded</returns>
        public bool IsCurrentProjectLoaded()
        {
            return
                !_fetchingHaptics.Values.Aggregate(false, (state, next) => state || next) &&
                !_fetchingAudio.Values.Aggregate(false, (state, next) => state || next);
        }

        /// <summary>
        /// Send the `auth_request` message
        /// </summary>
        public void SendAuthenticationRequest(string code)
        {
            _socketClient.EmitStringAsJSON("auth_request", $"{{ \"authCode\": \"{code}\" }}");
        }

        /// <summary>
        /// Send the `current_project` message
        /// </summary>
        public void SendProjectRequest()
        {
            _socketClient.Emit("current_project");
            Debug.Log("project request sent");
        }

        /// <summary>
        /// Send the `set_current_clip` message
        /// </summary>
        /// <param name="clipId"></param>
        public void SendCurrentClip(string clipId)
        {
            _socketClient.EmitStringAsJSON("set_current_clip", $"{{ \"clipId\": \"{clipId}\" }}");
        }

        /// <summary>
        /// Returns the connection state
        /// </summary>
        /// <returns>A boolean value with the connection state</returns>
        public bool IsConnected()
        {
            return _socketClient != null && _socketClient.Connected;
        }

        /// <summary>
        /// Disconnects the current socket
        /// </summary>
        public void Disconnect()
        {
            Task.Run(() => _socketClient?.Disconnect());
        }

        /// <summary>
        /// Checks if there is an endpoint saved and attempts a connection
        /// </summary>
        /// <param name="hostname">The hostname found</param>
        private void ReconnectIfPossible(SocketEndpoint endpoint)
        {
            // Check if there is an endpoint saved for automatic connection
            SocketEndpoint stored = SocketEndpoint.LoadFromPrefs();
            if (stored != null) Debug.Log($"Found stored socket: {stored.hostname}");
            if (stored != null && stored.hostname == endpoint.hostname)
            {
                Debug.Log($"Reconnecting to: {endpoint.hostname} - {endpoint.ip}");
                Task.Run(() => { ConnectToSocket(new SocketClient(endpoint)); });
            }
        }

        protected void OnApplicationQuit()
        {
            _listening = false;
            _udpClient?.Dispose();
            Disconnect();
        }
    }
}
