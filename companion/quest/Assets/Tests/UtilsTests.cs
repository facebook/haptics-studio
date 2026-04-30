// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System.IO;
using NUnit.Framework;
using UnityEngine;

namespace HapticStudio.Tests
{
    public class UtilsTests
    {
        [SetUp]
        public void SetUp()
        {
            Directory.Delete(Application.persistentDataPath, true);
            GameObject gameObject = new();
            gameObject.AddComponent(typeof(LocalProjects));
        }

        [TearDown]
        public void TearDown()
        {
            Directory.Delete(Application.persistentDataPath, true);
        }

        [Test]
        public void ShouldListCachedClips()
        {
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForHapticClip("clip1"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForHapticClip("clip2"));

            Assert.AreEqual(HapticStudio.Utils.StoredClips(), new string[] { "clip1", "clip2" });
        }

        [Test]
        public void ShouldListCachedProjects()
        {
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForHapticClip("clip1"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForHapticClip("clip2"));
            HapticStudio.Utils.DeleteDirectory(HapticStudio.Utils.PathForClip("clip1"));

            Assert.AreEqual(HapticStudio.Utils.StoredClips(), new string[] { "clip2" });
        }
    }
}
