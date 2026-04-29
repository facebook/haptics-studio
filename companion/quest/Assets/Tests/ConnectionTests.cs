// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System.Collections;
using NUnit.Framework;
using UnityEngine.TestTools;

namespace HapticStudio.Tests
{
    public class MockNetworkHandler : NetworkHandler
    {
        public MockSocket MockSocket => _mockSocket;
        public static SocketEndpoint Endpoint = new() { ip = "127.0.0.1", port = "9999", hostname = "host" };

        private MockSocket _mockSocket;

        override public void ConnectToSocket(SocketClient socketClient)
        {
            _mockSocket = new(Endpoint);

            base.ConnectToSocket(_mockSocket);
        }
    }

    public class ConnectionTests
    {
        private Connection _connection;

        [SetUp]
        public void SetUp()
        {
            // GameObject gameObject = new();
            // _connection = gameObject.AddComponent<Connection>();
            //
            // _connection.connectionItemPrefab = new GameObject();
            // _connection.connectionContainer = new GameObject();
            // _connection.connectControls = new GameObject();
            // _connection.manualControls = new GameObject();
            // _connection.disconnectControls = new GameObject();
            // _connection.disconnectControls.AddComponent<TextMeshProUGUI>();
            // _connection.codeControls = new GameObject();
            // _connection.ipAddrFields = new TMP_InputField[]
            // {
            //     new GameObject().AddComponent<TMP_InputField>(), new GameObject().AddComponent<TMP_InputField>(),
            //     new GameObject().AddComponent<TMP_InputField>(), new GameObject().AddComponent<TMP_InputField>()
            // };
            // _connection.codeField = new GameObject().AddComponent<TMP_InputField>();
            // _connection.connectedHostLabel = new GameObject().AddComponent<TextMeshProUGUI>();
            // _connection.codeHeaderLabel = new GameObject().AddComponent<TextMeshProUGUI>();
            // _connection.connectionButton = new GameObject().AddComponent<Toggle>();
            // _connection.manualConnectionButton = new GameObject().AddComponent<Toggle>();
            // _connection.codeConfirmationButton = new GameObject().AddComponent<Toggle>();
            // _connection.networkHandler = new GameObject().AddComponent<MockNetworkHandler>();
        }

        [TearDown]
        public void TearDown()
        {
            // GameObject.Destroy(_connection);
        }

        [UnityTest]
        public IEnumerator ConnectionAndAuthFlow()
        {
            // Assert.IsTrue(_connection.connectControls.activeSelf);
            // Assert.IsFalse(_connection.disconnectControls.activeSelf);
            //
            // _connection.networkHandler.ConnectToSocket(new SocketClient(MockNetworkHandler.Endpoint));
            //
            // yield return 0;
            //
            // Assert.IsFalse(_connection.connectControls.activeSelf);
            // Assert.IsTrue(_connection.codeControls.activeSelf);
            //
            // _connection.OnCodeNumberClick(1);
            // _connection.OnCodeNumberClick(2);
            // _connection.OnCodeNumberClick(3);
            //
            // Assert.IsFalse(_connection.codeConfirmationButton.interactable);
            //
            // _connection.OnCodeNumberClick(4);
            //
            // Assert.IsTrue(_connection.codeConfirmationButton.interactable);
            //
            // _connection.OnAuthenticationClick();
            //
            // Assert.AreEqual(((MockNetworkHandler)_connection.networkHandler).MockSocket.EmittedEvents[0],
            //     "auth_request");
            //
            // List<JsonElement> list = new() { JsonDocument.Parse("{}").RootElement };
            // SocketIO socketIO = new("ws://127.0.0.1");
            // SocketIOResponse response = new(list, socketIO);
            // ((MockNetworkHandler)_connection.networkHandler).MockSocket.MockEvent("auth_granted", response);
            //
            // yield return 0;
            //
            // Assert.IsFalse(_connection.codeControls.activeSelf);
            // Assert.IsTrue(_connection.disconnectControls.activeSelf);
            // Assert.IsFalse(_connection.connectControls.activeSelf);
            // Assert.AreEqual(_connection.connectedHostLabel.text, "host");
            //
            yield return null;
        }

        [UnityTest]
        public IEnumerator ManualConnectionFlow()
        {
            // Assert.IsTrue(_connection.connectControls.activeSelf);
            //
            // _connection.ipAddrFields[0].text = "127";
            // _connection.ipAddrFields[1].text = "0";
            // _connection.ipAddrFields[2].text = "0";
            // _connection.ipAddrFields[3].text = "256";
            //
            // yield return 0;
            //
            // Assert.IsFalse(_connection.manualConnectionButton.interactable);
            //
            // _connection.ipAddrFields[3].text = "1";
            //
            // yield return 0;
            //
            // Assert.IsTrue(_connection.manualConnectionButton.interactable);
            //
            // _connection.OnManualConnectClick();
            //
            // yield return 0;
            //
            // Assert.IsFalse(_connection.connectControls.activeSelf);
            // Assert.IsTrue(_connection.codeControls.activeSelf);
            //
            yield return null;
        }
    }
}
