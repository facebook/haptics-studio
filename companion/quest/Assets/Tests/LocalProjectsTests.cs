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
    public class LocalProjectsTest
    {
        [SetUp]
        public void SetUp()
        {
            GameObject gameObject = new();
            gameObject.AddComponent(typeof(LocalProjects));
        }

        [TearDown]
        public void TearDown()
        {
            PlayerPrefs.DeleteAll();
            Directory.Delete(Application.persistentDataPath, true);
        }

        [Test]
        public void ShouldUpdateTheLiveProject()
        {
            Project project = new()
            {
                id = "project-id"
            };
            LocalProjects.Instance.SetLiveProject(project);
            Assert.IsTrue(LocalProjects.Instance.LiveProjectLastUpdate != 0 && LocalProjects.Instance.LiveProjectLastUpdate <= DateTimeOffset.Now.ToUnixTimeMilliseconds());
            Assert.AreEqual(LocalProjects.Instance.LiveProject.id, "project-id");
        }

        [Test]
        public void ShouldAddNewProjects()
        {
            int previous = LocalProjects.Instance.Projects.Count;
            Project project = new()
            {
                id = "project-id"
            };
            bool callback = false;
            LocalProjects.Instance.OnProjectListChange += () =>
            {
                callback = true;
            };
            LocalProjects.Instance.Add(project);
            Assert.AreEqual(LocalProjects.Instance.Projects.Count, previous + 1);
            Assert.IsTrue(callback);
        }

        [Test]
        public void ShouldRemoveProjects()
        {
            int previous = LocalProjects.Instance.Projects.Count;
            Project project = new()
            {
                id = "project-id"
            };
            LocalProjects.Instance.Add(project);

            bool callback = false;
            LocalProjects.Instance.OnProjectListChange += () =>
            {
                callback = true;
            };
            LocalProjects.Instance.Remove(project.id);
            Assert.AreEqual(LocalProjects.Instance.Projects.Count, previous - 1);
            Assert.IsTrue(callback);
        }

        [Test]
        public async Task ShouldOpenProjectAsync()
        {
            Project project = new()
            {
                id = "project-id"
            };
            LocalProjects.Instance.Add(project);

            bool callback = false;
            Project loaded = null;
            bool isLive = false;
            LocalProjects.Instance.OnOpenProject += (proj, live) =>
            {
                callback = true;
                loaded = proj;
                isLive = live;
            };
            await LocalProjects.Instance.Load(project.id);
            Assert.AreEqual(loaded.id, "project-id");
            Assert.IsTrue(callback);
            Assert.IsFalse(isLive);
        }

        [Test]
        public void ShouldLoadTheCurrentProject()
        {
            Project project = new()
            {
                id = "project-id"
            };
            LocalProjects.Instance.SetLiveProject(project);

            bool callback = false;
            Project loaded = null;
            bool isLive = false;
            LocalProjects.Instance.OnOpenProject += (proj, live) =>
            {
                callback = true;
                loaded = proj;
                isLive = live;
            };
            LocalProjects.Instance.LoadCurrent();
            Assert.AreEqual(loaded.id, "project-id");
            Assert.IsTrue(callback);
            Assert.IsTrue(isLive);
        }


        [Test]
        public void ShouldClearTheClipsStorage()
        {
            Clip clip1 = new()
            {
                clipId = "clip1"
            };
            Clip clip2 = new()
            {
                clipId = "clip2"
            };
            Clip clip3 = new()
            {
                clipId = "clip3"
            };
            Project pinnedProject = new()
            {
                id = "project1",
                clips = new Clip[] { clip1 }
            };
            Project liveProject = new()
            {
                id = "project2",
                clips = new Clip[] { clip2 }
            };
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForHapticClip("clip1"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForAudioClip("clip1"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForHapticClip("clip2"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForAudioClip("clip2"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForHapticClip("clip3"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForAudioClip("clip3"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForHapticClip("clip4"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForAudioClip("clip4"));

            LocalProjects.Instance.Add(pinnedProject);
            LocalProjects.Instance.SetLiveProject(liveProject);
            LocalProjects.Instance.ClearCacheStorage(new string[] { clip3.clipId }, 0);

            // Clip1 is in a pinned project, clip2 in a live project, clip3 in a currently opened project
            // Only clip4 should be deleted
            Assert.AreEqual(HapticStudio.Utils.StoredClips(), new string[] { "clip1", "clip2", "clip3" });
        }

        [Test]
        public void ShouldNotClearTheClipsStorageIfTheCacheSizeIsSmall()
        {
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForHapticClip("clip1"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForAudioClip("clip1"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForHapticClip("clip2"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForAudioClip("clip2"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForHapticClip("clip3"));
            HapticStudio.Utils.CreateFile(HapticStudio.Utils.PathForAudioClip("clip3"));

            LocalProjects.Instance.ClearCacheStorage(null, 3);
            Assert.AreEqual(HapticStudio.Utils.StoredClips(), new string[] { "clip1", "clip2", "clip3" });
        }
    }
}
