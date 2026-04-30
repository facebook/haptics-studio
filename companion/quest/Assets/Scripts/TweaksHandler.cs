// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System;
using System.IO;
using System.Threading.Tasks;
using Newtonsoft.Json;
using TMPro;
using UnityEngine;

namespace HapticStudio
{
    /// <summary>
    /// Settings for the E2E testing
    /// </summary>
    [Serializable]
    public class Settings
    {
        // A custom delay between haptics and audio
        public int hapticDelay;

        // If enabled the A and X buttons will trigger the test play
        public bool overridePlayButton;
    }

    /// <summary>
    /// Handles the debug tweaks panel. The panel is hidden by default, and is only
    /// shown with a button combination on the Quest controllers.
    /// </summary>
    public class TweaksHandler : MonoBehaviour
    {
        public static TweaksHandler Instance { get; private set; }
        protected Settings _settings;
        [SerializeField] private NuxHandler _nuxHandler;

        /// <summary>
        /// The delay applied to the haptic engine when triggering audio and haptics
        /// </summary>
        public static int HapticDelay
        {
            get
            {
                if (PlayerPrefs.HasKey("DELAY"))
                {
                    return PlayerPrefs.GetInt("DELAY");
                }

                return DefaultDelay;
            }
        }

        /// <summary>
        /// Used in E2E testing, if true the X and A buttons will trigger the test play
        /// </summary>
        public static bool ShouldOverridePlayButton
        {
            get
            {
                if (PlayerPrefs.HasKey("OVERRIDE_PLAY_BUTTON"))
                {
                    return PlayerPrefs.GetInt("OVERRIDE_PLAY_BUTTON") == 1;
                }

                return false;
            }
        }

        private static readonly int DefaultDelay = 170;

        public Canvas tweaksPanel;
        public TMP_InputField delayField;

        protected virtual void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
            }
            else
            {
                Instance = this;
            }

            _ = LoadSettingsFromFileAsync();
        }

        protected virtual void Start()
        {
            tweaksPanel.enabled = false;
            delayField.text = HapticDelay.ToString();
        }

        protected virtual void Update()
        {
            // Enable the panel when the user presses B+Y+Rtrigger+Ltrigger
            if (OVRInput.Get(OVRInput.Button.Two) && OVRInput.Get(OVRInput.Button.Four) &&
                OVRInput.Get(OVRInput.RawAxis1D.LIndexTrigger) > 0.5 &&
                OVRInput.Get(OVRInput.RawAxis1D.RIndexTrigger) > 0.5)
            {
                if (!tweaksPanel.enabled)
                {
                    tweaksPanel.enabled = true;
                }
            }
        }

        /// <summary>
        /// Attempt to load the custom settings in /storage/emulated/0/Android/data/com.oculus.HapticsStudio/files/xrihe2etestdir/settings.json
        /// </summary>
        public async Task LoadSettingsFromFileAsync()
        {
            var path = $"{Application.persistentDataPath}/{Utils.TEST_SAMPLE_DIRECTORY}/settings.json";
            if (File.Exists(path))
            {
                try
                {
                    var json = await File.ReadAllTextAsync(path);
                    _settings = JsonConvert.DeserializeObject<Settings>(json);
                    PlayerPrefs.SetInt("DELAY", _settings.hapticDelay);
                    PlayerPrefs.SetInt("OVERRIDE_PLAY_BUTTON", _settings.overridePlayButton ? 1 : 0);
                    PlayerPrefs.Save();
                    UnityThread.executeInUpdate(() =>
                    {
                        if (_nuxHandler != null)
                        {
                            _nuxHandler.CloseNux();
                        }
                    });
                }
                catch (System.Exception e)
                {
                    Debug.LogError($"Failed to load settings: {e}");
                }
            }
        }

        public void OnApply()
        {
            PlayerPrefs.SetInt("DELAY", int.Parse(delayField.text));
        }
    }
}
