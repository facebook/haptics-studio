// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using UnityEngine;
using UnityEngine.UI;

namespace HapticStudio
{
    public class MuteHapticsButton : MonoBehaviour
    {
        [SerializeField] private Image icon;
        [SerializeField] private Sprite hapticsMutedIcon;
        [SerializeField] private Sprite hapticsOnIcon;

        public delegate void MuteHaptics(bool isMuted);

        public static event MuteHaptics OnMuteHaptics;

        private static bool isMuted = false;

        private void OnEnable()
        {
            OnMuteHaptics += UpdateIcon;
            UpdateIcon(isMuted);
        }

        private void OnDisable()
        {
            OnMuteHaptics -= UpdateIcon;
        }

        public void ToggleHaptics()
        {
            isMuted = !isMuted;
            OnMuteHaptics?.Invoke(isMuted);
        }

        private void UpdateIcon(bool muted)
        {
            icon.sprite = muted ? hapticsMutedIcon : hapticsOnIcon;
        }
    }
}
