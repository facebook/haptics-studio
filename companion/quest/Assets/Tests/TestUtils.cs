// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace HapticStudio.Tests.Utils
{
    public class LoadScene : CustomYieldInstruction
    {
        private readonly string _sceneName;

        public override bool keepWaiting
        {
            get
            {
                var scene = SceneManager.GetSceneByName(_sceneName);
                return scene.IsValid() && scene.isLoaded;
            }
        }

        public LoadScene(string scene)
        {
            _sceneName = scene;
        }
    }
}

public static class UnityTestUtils
{
    public static void RunAsyncMethodSync(this Func<Task> asyncMethod)
    {
        Task.Run(async () => await asyncMethod()).GetAwaiter().GetResult();
    }
}
