// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System;
using System.IO;
using System.Threading.Tasks;
using NUnit.Framework;
using UnityEngine;

namespace HapticStudio.Tests
{
    public class SocketEndpointTests
    {
        private SocketEndpoint _endpoint = new();

        [SetUp]
        public void SetUp()
        {
            _endpoint.ip = "127.0.0.1";
            _endpoint.port = "12345";
            _endpoint.hostname = "Local";
        }

        [TearDown]
        public void TearDown()
        {
            PlayerPrefs.DeleteAll();
        }

        [Test]
        public void ShouldStoreAndLoadFromPlayerPrefs()
        {
            _endpoint.StoreInPrefs();

            var loadedEndpoint = SocketEndpoint.LoadFromPrefs();

            Assert.AreEqual(_endpoint.ip, loadedEndpoint.ip);
            Assert.AreEqual(_endpoint.port, loadedEndpoint.port);
            Assert.AreEqual(_endpoint.hostname, loadedEndpoint.hostname);
        }

        [Test]
        public void ShouldClearFromPlayerPrefs()
        {
            _endpoint.StoreInPrefs();

            SocketEndpoint.ClearPrefs();

            var loadedEndpoint = SocketEndpoint.LoadFromPrefs();
            Assert.AreEqual(loadedEndpoint, null);
        }
    }
}
