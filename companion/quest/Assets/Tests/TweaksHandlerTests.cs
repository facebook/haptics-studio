// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using NUnit.Framework;
using UnityEngine;
using Newtonsoft.Json;
using System.IO;
using TMPro;
using System.Threading.Tasks;

namespace HapticStudio.Tests
{
    public class TweaksHandlerTests
    {
        protected TweaksHandler tweaks;

        [SetUp]
        public void SetUp()
        {
            var path = $"{Application.persistentDataPath}/{HapticStudio.Utils.TEST_SAMPLE_DIRECTORY}/settings.json";
            var settings = new Settings
            {
                hapticDelay = 42,
                overridePlayButton = true
            };
            HapticStudio.Utils.CreateFile(path);
            File.WriteAllText(path, JsonConvert.SerializeObject(settings));
            GameObject gameObject = new();
            tweaks = (TweaksHandler)gameObject.AddComponent(typeof(TweaksHandler));
            tweaks.tweaksPanel = gameObject.AddComponent<Canvas>();
            tweaks.delayField = gameObject.AddComponent<TMP_InputField>();
        }

        [TearDown]
        public void TearDown()
        {
            PlayerPrefs.DeleteAll();
            Directory.Delete($"{Application.persistentDataPath}/{HapticStudio.Utils.TEST_SAMPLE_DIRECTORY}", true);
        }

        [Test]
        public async Task ShouldLoadCustomSettings()
        {
            await tweaks.LoadSettingsFromFileAsync();
            Assert.AreEqual(TweaksHandler.HapticDelay, 42);
            Assert.AreEqual(TweaksHandler.ShouldOverridePlayButton, true);
        }
    }
}
