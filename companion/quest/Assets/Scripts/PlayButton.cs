// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using UnityEngine;
using UnityEngine.UI;

namespace HapticStudio
{
    public class PlayButton : MonoBehaviour
    {
        [SerializeField] private Image playIcon, interactableArea;
        [SerializeField] private Sprite playIconSprite, pauseIconSprite;

        private bool _canStopHaptics;
        private bool _isSample;

        private CurrentProjectHandler _currentProjectHandler;
        private SamplesProjectHandler _currentSamplesHandler;

        public void SetSamplesHandler(SamplesProjectHandler samplesProjectHandler)
        {
            _currentSamplesHandler = samplesProjectHandler;
            _isSample = true;
        }

        public void SetProjectHandler(CurrentProjectHandler currentProjectHandler)
        {
            _currentProjectHandler = currentProjectHandler;
        }

        public void StopSoundAndHaptics()
        {
            if (_canStopHaptics)
            {
                if (!_isSample)
                {
                    _currentProjectHandler.StopSoundAndHaptics();
                }
                else
                {
                    _currentSamplesHandler.StopSoundAndHaptics();
                }
            }
        }

        public void SetIconToPlay()
        {
            playIcon.sprite = playIconSprite;
            interactableArea.raycastTarget = false;
            _canStopHaptics = false;
        }

        public void SetIconToPause()
        {
            playIcon.sprite = pauseIconSprite;
            _canStopHaptics = true;
            interactableArea.raycastTarget = true;
        }
    }
}
