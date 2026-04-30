// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using NUnit.Framework;
using UnityEngine;

namespace HapticStudio.Tests
{
    public class HapticsStudioTests
    {
        [SetUp]
        public void SetUp()
        {
        }

        [TearDown]
        public void TearDown()
        {
        }

        [Test]
        public void ClipsShouldParseMimeType()
        {
            Clip clip = new()
            {
                mime = "audio/wav"
            };
            Assert.AreEqual(clip.AudioFormat(), AudioType.WAV);
            clip.mime = "audio/x-wav";
            Assert.AreEqual(clip.AudioFormat(), AudioType.WAV);
            clip.mime = "audio/ogg";
            Assert.AreEqual(clip.AudioFormat(), AudioType.OGGVORBIS);
            clip.mime = "audio/mpeg";
            Assert.AreEqual(clip.AudioFormat(), AudioType.MPEG);
            clip.mime = "audio/x-aiff";
            Assert.AreEqual(clip.AudioFormat(), AudioType.AIFF);
            clip.mime = "audio/aiff";
            Assert.AreEqual(clip.AudioFormat(), AudioType.AIFF);
            clip.mime = "wrong/format";
            Assert.AreEqual(clip.AudioFormat(), AudioType.UNKNOWN);
        }
    }
}
