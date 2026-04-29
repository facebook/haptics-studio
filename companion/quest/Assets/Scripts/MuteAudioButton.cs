// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using UnityEngine;
using UnityEngine.UI;

namespace HapticStudio
{
    public class MuteAudioButton : MonoBehaviour
    {
        [SerializeField] private Image icon;
        [SerializeField] private Sprite audioMutedIcon;
        [SerializeField] private Sprite audioOnIcon;

        public delegate void MuteAudio(bool isMuted);

        public static event MuteAudio OnMuteAudio;

        private static bool isMuted = false;

        private void OnEnable()
        {
            OnMuteAudio += UpdateIcon;
            UpdateIcon(isMuted);
        }

        private void OnDisable()
        {
            OnMuteAudio -= UpdateIcon;
        }

        public void ToggleAudio()
        {
            isMuted = !isMuted;
            OnMuteAudio?.Invoke(isMuted);
        }

        private void UpdateIcon(bool muted)
        {
            icon.sprite = muted ? audioMutedIcon : audioOnIcon;
        }
    }
}
