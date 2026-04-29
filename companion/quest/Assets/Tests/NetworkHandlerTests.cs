// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System;
using System.Collections.Generic;
using NUnit.Framework;
using SocketIOClient;
using System.Text.Json;
using SocketIOClient.Newtonsoft.Json;

namespace HapticStudio.Tests
{
    public class MockSocket : SocketClient
    {
        public override event EventHandler OnConnected;
        public override event EventHandler<string> OnError;
        public override event EventHandler<string> OnDisconnected;

        public override bool Connected => _isConnected;

        public List<string> EmittedEvents = new();

        bool _isConnected = false;
        readonly Dictionary<string, Action<SocketIOResponse>> _callbacks = new();

        public MockSocket(SocketEndpoint endpoint, bool ping = false) : base(endpoint, ping)
        {
            _endpoint = endpoint;
        }

        public override void Connect()
        {
            _isConnected = true;
            OnConnected?.Invoke(this, EventArgs.Empty);
        }

        public override void Disconnect() { }

        public override void On(string eventName, Action<SocketIOResponse> callback) => _callbacks.TryAdd(eventName, callback);

        public override void Emit(string eventName, params object[] data) { }

        public override void EmitStringAsJSON(string eventName, string json) => EmittedEvents.Add(eventName);

        public void MockEvent(string name, SocketIOResponse payload) => _callbacks[name].Invoke(payload);
    }

    public class NetworkHandlerTest
    {
        NetworkHandler networkHandler = new();

        SocketEndpoint endpoint = new()
        {
            ip = "127.0.0.1",
            port = "9999",
            hostname = "host"
        };
        SocketIO socketIO = new("ws://127.0.0.1");
        SocketIOResponse currentProjectResponse;
        SocketIOResponse getClipResponse;
        SocketIOResponse getAudioResponse;

        [SetUp]
        public void SetUp()
        {
            MockSocket mockSocket = new(endpoint);

            socketIO.JsonSerializer = new NewtonsoftJsonSerializer();
            mockSocket.EmittedEvents.Clear();

            List<JsonElement> list = new()
            {
                JsonDocument.Parse("{ \"id\": \"1\", \"name\": \"project\", \"currentClipId\": \"clip1\", \"clips\": [{ \"clipId\": \"clip1\", \"name\": \"Clip\", \"haptic\": \"{}\", \"mime\": \"audio/wav\", \"lastUpdate\": 0 }] }").RootElement
            };
            currentProjectResponse = new(list, socketIO);

            List<JsonElement> clipList = new()
            {
                JsonDocument.Parse("{ \"clipId\": \"clip1\", \"name\": \"white-noise\", \"haptic\": \"{}\", \"mime\": \"{}\", \"lastUpdate\": 0 }").RootElement
            };
            getClipResponse = new(clipList, socketIO);

            List<JsonElement> audioList = new()
            {
                JsonDocument.Parse("{ \"clipId\": \"clip1\", \"audio\": \"data:audio-wav;base64,0\" }").RootElement
            };
            getAudioResponse = new(audioList, socketIO);
        }

        [Test]
        public void ShouldTriggerTheConnectedEvent()
        {
            MockSocket mockSocket = new(endpoint);
            networkHandler.OnSocketConnected += (e) =>
            {
                Assert.AreEqual(e.ip, "127.0.0.1");
                Assert.AreEqual(e.port, "9999");
                Assert.AreEqual(e.hostname, "host");
            };
            networkHandler.ConnectToSocket(mockSocket);

            Assert.AreEqual(mockSocket.Connected, true);
        }

        [Test]
        public void ShouldCallTheAuthGrantedCallback()
        {
            SocketEndpoint callbackEndpoint = null;
            MockSocket mockSocket = new(endpoint);
            networkHandler.OnSocketAuthenticationGranted += (end) =>
            {
                callbackEndpoint = end;
            };
            networkHandler.ConnectToSocket(mockSocket);

            List<JsonElement> list = new()
            {
                JsonDocument.Parse("{}").RootElement
            };
            SocketIOResponse response = new(list, socketIO);
            mockSocket.MockEvent("auth_granted", response);

            Assert.AreEqual(callbackEndpoint.hostname, endpoint.hostname);
        }

        [Test]
        public void ShouldHandleTheAuthFlow()
        {
            bool authRequest = false;
            bool authGranted = false;
            bool authFailed = false;
            MockSocket mockSocket = new(endpoint);
            networkHandler.OnSocketAuthenticationRequest += () =>
            {
                authRequest = true;
            };
            networkHandler.OnSocketAuthenticationGranted += (end) =>
            {
                authGranted = true;
            };
            networkHandler.OnSocketAuthenticationError += () =>
            {
                authFailed = true;
            };
            networkHandler.ConnectToSocket(mockSocket);

            List<JsonElement> list = new()
            {
                JsonDocument.Parse("{}").RootElement
            };
            SocketIOResponse response = new(list, socketIO);
            mockSocket.MockEvent("auth_required", response);
            Assert.AreEqual(authRequest, true);

            networkHandler.SendAuthenticationRequest("12345");
            Assert.AreEqual(mockSocket.EmittedEvents[0], "auth_request");

            list = new()
            {
                JsonDocument.Parse("{ \"status\": \"ok\" }").RootElement
            };
            response = new(list, socketIO);
            mockSocket.MockEvent("auth_request", response);
            Assert.AreEqual(authGranted, true);

            list = new()
            {
                JsonDocument.Parse("{ \"status\": \"error\" }").RootElement
            };
            response = new(list, socketIO);
            mockSocket.MockEvent("auth_request", response);
            Assert.AreEqual(authFailed, true);
        }

        [Test]
        public void ShouldTriggerSetCurrentProjectEvent()
        {
            MockSocket mockSocket = new(endpoint);
            networkHandler.ConnectToSocket(mockSocket);
            networkHandler.OnSetCurrentProject += (project) =>
            {
                Assert.AreEqual(project.name, "project");
            };
            mockSocket.MockEvent("current_project", currentProjectResponse);

            Assert.AreEqual(networkHandler.IsLoadingClip("clip1"), true);
            Assert.AreEqual(mockSocket.EmittedEvents.Count, 2);
            Assert.AreEqual(mockSocket.EmittedEvents[0], "get_clip");
            Assert.AreEqual(mockSocket.EmittedEvents[1], "get_audio");
        }

        [Test]
        public void ShouldStartLoadingTheClipsOnCurrentProjectMessage()
        {
            MockSocket mockSocket = new(endpoint);
            networkHandler.ConnectToSocket(mockSocket);
            mockSocket.MockEvent("current_project", currentProjectResponse);

            Assert.AreEqual(networkHandler.IsLoadingClip("clip1"), true);
        }

        [Test]
        public void ShouldTriggerPlayTestPattern()
        {
            bool callback = false;
            MockSocket mockSocket = new(endpoint);
            networkHandler.ConnectToSocket(mockSocket);
            networkHandler.OnPlayTestPattern += () =>
            {
                callback = true;
            };
            List<JsonElement> emptyRespone = new();
            mockSocket.MockEvent("play_test_pattern", new SocketIOResponse(emptyRespone, socketIO));
            Assert.IsTrue(callback);
        }

        [Test]
        public void ShouldUpdateClipData()
        {
            Clip receivedClip = null;
            AudioBinaryData receivedAudio = null;

            MockSocket mockSocket = new(endpoint);
            networkHandler.ConnectToSocket(mockSocket);
            networkHandler.OnGetClipData += (data) =>
            {
                receivedClip = data;
            };

            networkHandler.OnGetClipAudio += (data) =>
            {
                receivedAudio = data;
            };

            mockSocket.MockEvent("current_project", currentProjectResponse);
            mockSocket.MockEvent("get_clip", getClipResponse);
            mockSocket.MockEvent("get_audio_binary", getAudioResponse);

            Assert.AreEqual(receivedClip.clipId, "clip1");
            Assert.AreEqual(receivedClip.name, "white-noise");
            Assert.AreEqual(receivedAudio.clipId, "clip1");
        }

        [Test]
        public void ShouldNotifyWhenProjectLoadedWhenClipIsFirst()
        {
            bool callback = false;

            MockSocket mockSocket = new(endpoint);
            networkHandler.ConnectToSocket(mockSocket);
            networkHandler.OnProjectLoaded += () =>
            {
                callback = true;
            };

            mockSocket.MockEvent("current_project", currentProjectResponse);
            Assert.AreEqual(callback, false);
            mockSocket.MockEvent("get_clip", getClipResponse);
            Assert.AreEqual(callback, false);
            mockSocket.MockEvent("get_audio_binary", getAudioResponse);
            Assert.AreEqual(callback, true);
        }

        [Test]
        public void ShouldNotifyWhenProjectLoadedWhenAudioIsFirst()
        {
            bool callback = false;

            MockSocket mockSocket = new(endpoint);
            networkHandler.ConnectToSocket(mockSocket);
            networkHandler.OnProjectLoaded += () =>
            {
                callback = true;
            };

            mockSocket.MockEvent("current_project", currentProjectResponse);
            Assert.AreEqual(callback, false);
            mockSocket.MockEvent("get_audio_binary", getAudioResponse);
            Assert.AreEqual(callback, false);
            mockSocket.MockEvent("get_clip", getClipResponse);
            Assert.AreEqual(callback, true);
        }

        [Test]
        public void ShouldTriggerProjectClosedEvent()
        {
            bool callback = false;
            MockSocket mockSocket = new(endpoint);
            networkHandler.OnCloseCurrentProject += () =>
            {
                callback = true;
            };
            networkHandler.ConnectToSocket(mockSocket);

            List<JsonElement> list = new()
            {
                JsonDocument.Parse("{}").RootElement
            };
            SocketIOResponse response = new(list, socketIO);
            mockSocket.MockEvent("project_close", response);
            Assert.AreEqual(callback, true);
        }


        [Test]
        public void ShouldNotifyTheCurrentClipChange()
        {
            string clipId = "clip1";
            MockSocket mockSocket = new(endpoint);
            networkHandler.OnSetCurrentClipId += (newClipId) =>
            {
                clipId = newClipId;
            };
            networkHandler.ConnectToSocket(mockSocket);

            List<JsonElement> list = new()
            {
                JsonDocument.Parse("{ \"currentClipId\": \"clip2\" }").RootElement
            };
            SocketIOResponse response = new(list, socketIO);
            mockSocket.MockEvent("current_clip", response);
            Assert.AreEqual(clipId, "clip2");
        }

        [Test]
        public void ShouldNotifyTheClipUpdate()
        {
            Clip clip = null;
            MockSocket mockSocket = new(endpoint);
            networkHandler.OnGetClipData += (data) =>
            {
                clip = data;
            };
            networkHandler.ConnectToSocket(mockSocket);

            List<JsonElement> clipList = new()
            {
                JsonDocument.Parse("{ \"clipId\": \"clip1\", \"name\": \"white-noise-2\", \"haptic\": \"{}\", \"mime\": \"{}\", \"lastUpdate\": 0 }").RootElement
            };
            SocketIOResponse newClipData = new(clipList, socketIO);

            mockSocket.MockEvent("clip_update", newClipData);
            Assert.AreEqual(clip.name, "white-noise-2");
        }

        [Test]
        public void ShouldSendSetCurrentClipRequest()
        {
            MockSocket mockSocket = new(endpoint);
            networkHandler.ConnectToSocket(mockSocket);
            networkHandler.SendCurrentClip("clip1");

            Assert.AreEqual(mockSocket.EmittedEvents[0], "set_current_clip");
        }
    }
}
