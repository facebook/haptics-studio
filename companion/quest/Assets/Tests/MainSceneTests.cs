// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System.Collections;
using NUnit.Framework;
using UnityEngine.TestTools;

namespace HapticStudio.Tests
{
    public class MainSceneTests
    {
        [SetUp]
        public void Setup()
        {
            // EditorSceneManager.LoadScene("MainScene");
        }

        [UnityTest]
        public IEnumerator VerifyScene()
        {
            // Connection connection;
            // var connectionPanel = GameObject.FindObjectOfType<Connection>(true);
            // connection = connectionPanel.GetComponent<Connection>();
            // Assert.AreEqual(connection.ipAddrFields.Length, 4);

            yield return null;
        }

        [UnityTest]
        public IEnumerator ShouldMuteAduio()
        {
            // var mainPanel = GameObject.FindObjectOfType<ProjectHandler>(true);
            // ProjectHandler projectHandler = mainPanel.GetComponent<ProjectHandler>();
            //
            // projectHandler.OnMuteAudioToggle();
            // Assert.IsTrue(projectHandler.audioSource.mute);
            //
            // projectHandler.OnMuteAudioToggle();
            // Assert.IsFalse(projectHandler.audioSource.mute);

            yield return null;
        }
    }
}
