// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Oculus.Haptics;
using Oculus.Interaction.Samples;
using TMPro;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;

namespace HapticStudio
{
    /// <summary>
    /// Handles the creation of clips and groups for the current live project
    /// </summary>
    public class CurrentProjectHandler : MonoBehaviour
    {
        private const bool PLAY_ON_TRIGGER = true;
        private const bool PLAY_ON_SELECTION = false;

        [SerializeField] private AudioSource audioSource;

        [Header("Handlers")][SerializeField] private NetworkHandler networkHandler;


        [Header("Loaded Project fields")]
        [SerializeField]
        private GameObject clipItemPrefab;

        [SerializeField] private GameObject groupHeaderPrefab;
        [SerializeField] private ToggleGroup clipsToggleGroup;
        [SerializeField] private GameObject clipsContainer;

        [SerializeField] private Toggle pinButton;
        private AnimatorOverrideLayerWeigth pinButtonAnimatorLayerWeight;

        private Project _currentProject;
        private string _selectedClipId;
        private Dictionary<string, TextMeshProUGUI> _timeLabels = new();
        private Dictionary<string, bool> _groupCollapsedState = new();
        private HapticClipPlayer _hapticPlayer;
        private bool _shouldPlayHaptics = true;
        private Controller _activeController;
        private bool _missingAudioFile;
        private bool _isLiveProject;

        private PlayButton _currentPlayButton;
        private Coroutine _playHapticsCoroutine;

        private void Awake()
        {
            pinButtonAnimatorLayerWeight = pinButton.GetComponent<AnimatorOverrideLayerWeigth>();
        }

        private void OnEnable()
        {
            LocalProjects.Instance.OnOpenProject += OnOpenProject;
            networkHandler.OnSetCurrentProject += OnSetCurrentProject;
            networkHandler.OnGetClipData += OnGetClipData;
            networkHandler.OnGetClipAudio += OnGetClipAudio;
            networkHandler.OnSetCurrentClipId += OnSetCurrentClipID;
            networkHandler.OnPlayTestPattern += OnPlayTestPattern;
            MuteHapticsButton.OnMuteHaptics += OnMuteHaptics;
            MuteAudioButton.OnMuteAudio += OnMuteAudio;

            networkHandler.SendProjectRequest();
        }

        private void OnDisable()
        {
            LocalProjects.Instance.OnOpenProject -= OnOpenProject;
            networkHandler.OnSetCurrentProject -= OnSetCurrentProject;
            networkHandler.OnGetClipData -= OnGetClipData;
            networkHandler.OnGetClipAudio -= OnGetClipAudio;
            networkHandler.OnSetCurrentClipId -= OnSetCurrentClipID;
            networkHandler.OnPlayTestPattern -= OnPlayTestPattern;
            MuteHapticsButton.OnMuteHaptics -= OnMuteHaptics;
            MuteAudioButton.OnMuteAudio -= OnMuteAudio;
        }

        private void OnOpenProject(Project project, bool live)
        {
            _isLiveProject = live;
            LoadProject(project);
            SetPinState();
        }

        private void OnSetCurrentProject(Project project)
        {
            if (project == null) return;

            LocalProjects.Instance.UpdateLiveProject();

            _currentProject = project;

            if (_isLiveProject)
            {
                LoadProject(project);
            }
        }

        private void OnGetClipData(Clip data)
        {
            // Store the haptic
            var path = Utils.PathForHapticClip(data.clipId);
            Utils.CreateFile(path);
            File.WriteAllText(path, data.haptic);

            // Check if the project updated is the current one
            if (_currentProject != null && _currentProject.HasClip(data.clipId))
            {
                UpdateClipData(data);
            }
        }

        private void OnGetClipAudio(AudioBinaryData audioData)
        {
            if (audioData.audio != null)
            {
                StoreClipAudioData(audioData);
            }
        }

        private void OnSetCurrentClipID(string clipId)
        {
            if (_isLiveProject && _currentProject != null && _selectedClipId != clipId &&
                _currentProject.HasClip(clipId))
            {
                SetCurrentClip(clipId, false, PLAY_ON_SELECTION);
                UnityThread.executeInUpdate(UpdateClipList);
            }
        }

        private void OnPlayTestPattern()
        {
            Task.Run(PlayTestPattern);
        }

        protected virtual void Update()
        {
            // Listen for B (Button.Two) and Y (Button.Four)
            if (OVRInput.GetDown(OVRInput.RawButton.B))
            {
                PlayCurrentClip(Controller.Right);
            }

            if (OVRInput.GetDown(OVRInput.RawButton.Y))
            {
                PlayCurrentClip(Controller.Left);
            }

            if (OVRInput.GetDown(OVRInput.RawButton.LThumbstick)
                || OVRInput.GetDown(OVRInput.RawButton.RThumbstick)
                || (TweaksHandler.ShouldOverridePlayButton && OVRInput.GetDown(OVRInput.RawButton.A))
                || (TweaksHandler.ShouldOverridePlayButton && OVRInput.GetDown(OVRInput.RawButton.X)))
            {
                Task.Run(() => PlayTestPattern());
            }

            // Keep track of the active controller to determine the playback target
            if (OVRInput.GetDown(OVRInput.RawButton.Y) || OVRInput.Get(OVRInput.RawAxis1D.LIndexTrigger) > 0)
            {
                _activeController = Controller.Left;
            }

            if (OVRInput.GetDown(OVRInput.RawButton.B) || OVRInput.Get(OVRInput.RawAxis1D.RIndexTrigger) > 0)
            {
                _activeController = Controller.Right;
            }
        }

        protected virtual void OnApplicationPause(bool pause)
        {
            if (pause)
            {
                LocalProjects.Instance.ClearCacheStorage(_currentProject?.clips.Select(c => c.clipId).ToArray());
            }
        }

        public void OnProjectPin()
        {
            if (_currentProject != null)
            {
                if (LocalProjects.Instance.IsProjectPinned(_currentProject))
                {
                    LocalProjects.Instance.Remove(_currentProject.id);
                }
                else
                {
                    LocalProjects.Instance.Add(_currentProject);
                }
            }

            SetPinState();
        }

        private void SetPinState()
        {
            bool isPinOn = LocalProjects.Instance.IsProjectPinned(_currentProject);
            pinButton.SetIsOnWithoutNotify(isPinOn);
            pinButtonAnimatorLayerWeight.SetOverrideLayerActive(isPinOn);
        }

        /// <summary>
        /// Re-render the clip list
        /// </summary>
        private void UpdateClipList()
        {
            _timeLabels.Clear();

            foreach (Transform child in clipsContainer.transform)
            {
                Destroy(child.gameObject);
            }

            if (_currentProject != null)
            {
                if (_currentProject.groups.Count() == 0)
                {
                    clipsContainer.SetActive(false);
                    return;
                }

                clipsContainer.SetActive(true);

                foreach (ClipGroup group in _currentProject.groups)
                {
                    if (group.isFolder)
                    {
                        // Show the group header
                        GameObject item = Instantiate(groupHeaderPrefab);
                        item.GetComponent<Toggle>().onValueChanged.AddListener(delegate
                        {
                            _groupCollapsedState[group.id] = !_groupCollapsedState[group.id];
                            UpdateClipList();
                        });
                        var textComponent = item.GetComponentInChildren<TMP_Text>();
                        textComponent.text = group.name;

                        item.transform.SetParent(clipsContainer.transform, false);

                        // Show the group content if the group is expanded
                        if (!_groupCollapsedState[group.id])
                        {
                            for (int i = 0; i < group.clips.Length; i++)
                            {
                                AppendClipToList(group.clips[i], i == 0, i == group.clips.Length - 1);
                            }
                        }
                    }
                    else
                    {
                        // The group holds a single clip
                        AppendClipToList(group.clips[0], true, true);
                    }
                }
            }
        }

        /// <summary>
        /// Instantiates a new GameObject with the clip data, and shows it in the clip list
        /// </summary>
        /// <param name="clipId">The clip Id</param>
        /// <param name="topClip">Rounds top side of clip</param>
        /// <param name="bottomClip">Rounds bottom side of clip</param>
        private void AppendClipToList(string clipId, bool topClip, bool bottomClip)
        {
            var clip = Array.Find(_currentProject.clips, element => element.clipId.Equals(clipId));

            if (clip == null) return;

            GameObject item = Instantiate(clipItemPrefab);

            if (topClip)
            {
                RoundedBoxUIProperties boxUIProperties = item.GetComponentInChildren<RoundedBoxUIProperties>();
                boxUIProperties.borderRadius.x = 10;
                boxUIProperties.borderRadius.z = 10;
            }

            if (bottomClip)
            {
                RoundedBoxUIProperties boxUIProperties = item.GetComponentInChildren<RoundedBoxUIProperties>();
                boxUIProperties.borderRadius.y = 10;
                boxUIProperties.borderRadius.w = 10;
            }


            Toggle toggle = item.GetComponent<Toggle>();
            toggle.group = clipsToggleGroup;
            PlayButton playButton = item.GetComponentInChildren<PlayButton>();
            playButton.SetProjectHandler(this);
            GameObject muteAudioButton = item.GetComponentInChildren<MuteAudioButton>().gameObject;
            GameObject muteHapticsButton = item.GetComponentInChildren<MuteHapticsButton>().gameObject;
            bool isSelectedClip = clip.clipId == _selectedClipId;
            if (isSelectedClip)
            {
                _currentPlayButton = playButton;
            }

            toggle.SetIsOnWithoutNotify(isSelectedClip);
            muteAudioButton.SetActive(isSelectedClip);
            muteHapticsButton.SetActive(isSelectedClip);
            toggle.onValueChanged.AddListener(delegate
            {
                if (toggle.isOn)
                {
                    _currentPlayButton = playButton;
                    SetCurrentClip(clipId, true, PLAY_ON_TRIGGER);
                    muteAudioButton.SetActive(true);
                    muteHapticsButton.SetActive(true);
                }
                else
                {
                    playButton.SetIconToPlay();
                    muteAudioButton.SetActive(false);
                    muteHapticsButton.SetActive(false);
                }
            });
            var textComponents = item.GetComponentsInChildren<TextMeshProUGUI>();
            textComponents[0].text = clip.name;
            textComponents[1].text = $"Last updated {Utils.TimeAgo(clip.lastUpdate)}";
            _timeLabels.Add(clipId, textComponents[1]);

            item.transform.SetParent(clipsContainer.transform, false);
        }

        /// <summary>
        /// Set the selected clip.
        /// </summary>
        /// <param name="clipId">The clipId, must be present in the current project.</param>
        /// <param name="notify">If set to true, it notifies Desktop of the change</param>
        /// <param name="play">If set to true, it also plays the clip</param>
        private void SetCurrentClip(string clipId, bool notify, bool play)
        {
            _selectedClipId = clipId;
            string groupId = Array.Find(_currentProject.groups, element => element.clips.Contains(clipId)).id;
            _groupCollapsedState[groupId] = false;
            Task.Run(() => PrepareClip(clipId, notify, play));
        }

        /// <summary>
        /// Prepare the haptic and audio engines after a clip selection
        /// </summary>
        /// <param name="clipId">The clipId, must be present in the current project.</param>
        /// <param name="notify">If set to true, it notifies Desktop of the change</param>
        /// <param name="play">If set to true, it also plays the clip</param>
        private async Task PrepareClip(string clipId, bool notify, bool play)
        {
            var clip = Array.Find(_currentProject.clips, element => element.clipId.Equals(clipId));
            if (clip != null)
            {
                var json = await File.ReadAllTextAsync(Utils.PathForHapticClip(clip.clipId));
                await PrepareAudioPlayerAsync(_selectedClipId, clip.AudioFormat());

                UnityThread.executeInUpdate(() =>
                {
                    PrepareHapticPlayer(json);
                });

                if (notify && _isLiveProject)
                {
                    // Send a message to Desktop to set the current clip
                    networkHandler.SendCurrentClip(clipId);
                }

                if (play)
                {
                    PlayCurrentClip(_activeController);
                }
            }
        }

        /// <summary>
        /// Play the test fileslocated in /storage/emulated/0/Android/data/com.oculus.HapticsStudio/files/xrihe2etestdir/[audio | pattern.haptic]
        /// </summary>
        private async Task PlayTestPattern()
        {
            var json = await File.ReadAllTextAsync(Utils.PathForHapticClip(Utils.TEST_SAMPLE_DIRECTORY));
            _selectedClipId = "xrihe2etestdir";

            if (json != null)
            {
                await PrepareAudioPlayerAsync(Utils.TEST_SAMPLE_DIRECTORY, AudioType.WAV);

                UnityThread.executeInUpdate(() =>
                {
                    PrepareHapticPlayer(json);
                });

                Debug.Log("Playing test pattern");
                PlayCurrentClip(Controller.Both);
            }
        }

        /// <summary>
        /// Updates all labels under the clip list to reflect the last updated time
        /// </summary>
        private void UpdateAllLastUpdated()
        {
            if (_currentProject == null) return;

            foreach (Clip clip in _currentProject.clips)
            {
                UpdateLastUpdated(clip.clipId);
            }
        }

        /// <summary>
        /// Updates a specific label under the clip list to reflect the last updated time
        /// </summary>
        /// <param name="clipId">The id of the clip to update</param>
        private void UpdateLastUpdated(string clipId)
        {
            UnityThread.executeInUpdate(() =>
            {
                if (_currentProject != null && _timeLabels.ContainsKey(clipId))
                {
                    var clip = Array.Find(_currentProject.clips, element => element.clipId.Equals(clipId));

                    var timeString = $"Last updated {Utils.TimeAgo(clip.lastUpdate)}";
                    _timeLabels[clipId].text = timeString;
                    if (_selectedClipId != null && _selectedClipId == clipId)
                    {
                        // selectedClipLastUpdated.text = timeString;
                    }
                }
            });
        }

        /// <summary>
        /// Fetches the files from the file system and plays the current selected clip
        /// </summary>
        private void PlayCurrentClip(Controller controller)
        {
            Debug.Log("Play current clip");
            if (_selectedClipId != null)
            {
                UnityThread.executeInUpdate(() =>
                {
                    if (!_missingAudioFile)
                    {
                        audioSource.Play();
                    }

                    float delay = TweaksHandler.HapticDelay;
                    if (_playHapticsCoroutine != null)
                    {
                        StopCoroutine(_playHapticsCoroutine);
                    }

                    _playHapticsCoroutine = StartCoroutine(PlayHapticsWithDelay(delay / 1000.0f, controller));
                });
            }
        }

        private IEnumerator PlayHapticsWithDelay(float time, Controller controller)
        {
            if (_currentPlayButton != null)
            {
                _currentPlayButton.SetIconToPause();
            }

            yield return new WaitForSeconds(time);

            if (_hapticPlayer == null)
            {
                yield break;
            }

            _hapticPlayer.Play(controller);
            yield return new WaitForSeconds(_hapticPlayer.clipDuration);
            if (_currentPlayButton != null)
            {
                _currentPlayButton.SetIconToPlay();
            }
        }

        /// <summary>
        /// Creates a new instance of HapticClipPlayer with the provided json haptic
        /// </summary>
        /// <param name="json">The haptic pattern</param>
        private void PrepareHapticPlayer(string json)
        {
            StopSoundAndHaptics();
            HapticClip hapticClip = ScriptableObject.CreateInstance<HapticClip>();
            hapticClip.json = json;
            _hapticPlayer = new HapticClipPlayer(hapticClip) { amplitude = _shouldPlayHaptics ? 1.0f : 0 };
        }

        public void StopSoundAndHaptics()
        {
            if (_playHapticsCoroutine != null)
            {
                StopCoroutine(_playHapticsCoroutine);
                if (_currentPlayButton != null)
                {
                    _currentPlayButton.SetIconToPlay();
                }
            }

            _hapticPlayer?.Stop();
            audioSource.Stop();
        }

        /// <summary>
        /// Loads a clip from the local cache
        /// </summary>
        /// <param name="clipId">The clip id</param>
        /// <returns></returns>
        private async Task PrepareAudioPlayerAsync(string clipId, AudioType format)
        {
            Debug.Log("Preparing audio");
            if (!HasAudioForClip(clipId))
            {
                _missingAudioFile = true;
                return;
            }

            var audioFile = Utils.PathForAudioClip(clipId);

            Debug.Log("Sending web request");
            using UnityWebRequest www = UnityWebRequestMultimedia.GetAudioClip(new Uri(audioFile), format);
            await www.SendWebRequest();
            Debug.Log("Web request answer");
            if (www.result == UnityWebRequest.Result.ConnectionError)
            {
                Debug.Log($"Play error: {www.error}");
            }
            else
            {
                _missingAudioFile = false;
                audioSource.clip = DownloadHandlerAudioClip.GetContent(www);
            }
        }

        public void OnMuteAudio(bool shouldMuteAudio)
        {
            audioSource.mute = shouldMuteAudio;
        }

        private void OnMuteHaptics(bool isMuted)
        {
            _shouldPlayHaptics = !isMuted;
            _hapticPlayer.amplitude = _shouldPlayHaptics ? 1.0f : 0.0f;
        }

        /// <summary>
        /// Loads a project
        /// </summary>
        /// <param name="project">The project data received</param>
        private void LoadProject(Project project)
        {
            _currentProject = project;
            _groupCollapsedState.Clear();
            foreach (ClipGroup group in _currentProject.groups)
            {
                if (group.isFolder)
                {
                    _groupCollapsedState.TryAdd(group.id, group.isCollapsed);
                }
            }

            if (_currentProject.currentClipId.Length != 0) // CurrentClipId is never null, but it can be empty
            {
                SetCurrentClip(_currentProject.currentClipId, false, false);
            }
            else if (project.clips.Length != 0)
            {
                SetCurrentClip(_currentProject.clips[0].clipId, false, false);
            }

            UnityThread.executeInUpdate(UpdateClipList);
            CancelInvoke();
            InvokeRepeating(nameof(UpdateAllLastUpdated), 5, 1);
        }

        /// <summary>
        /// Check if the audio for a clip was already stored
        /// </summary>
        /// <param name="clipId">The clip Id</param>
        public static bool HasAudioForClip(string clipId)
        {
            return File.Exists(Utils.PathForAudioClip(clipId));
        }

        /// <summary>
        /// Updates the haptic pattern
        /// </summary>
        /// <param name="clipData">The clip Id</param>
        private void UpdateClipData(Clip clipData)
        {
            // Update the clip stored in the project
            var clip = Array.Find(_currentProject.clips, element => element.clipId.Equals(clipData.clipId));

            if (clip.lastUpdate == clipData.lastUpdate) return;

            clip.lastUpdate = clipData.lastUpdate;
            clip.name = clipData.name;

            if (clipData.clipId == _selectedClipId)
            {
                UnityThread.executeInUpdate(() =>
                {
                    PrepareHapticPlayer(clipData.haptic);
                });
                // Refresh the current haptic if receiving haptic data for the currently selected clip
                SetCurrentClip(_selectedClipId, false, false);
            }

            UpdateLastUpdated(clipData.clipId);
        }

        /// <summary>
        /// Stores the audio data for a clip in the local cache
        /// </summary>
        /// <param name="audioData">The audio data received from the socket</param>
        private void StoreClipAudioData(AudioBinaryData audioData)
        {
            string path = Utils.PathForAudioClip(audioData.clipId);
            Utils.CreateFile(path);
            File.WriteAllBytes(path, audioData.audio);

            if (_selectedClipId == audioData.clipId)
            {
                // Refresh the current haptic if receiving audio data for the currently selected clip
                SetCurrentClip(audioData.clipId, false, false);
            }
        }
    }

    /// <summary>
    /// Extend the UnityWebRequest to be awaitable
    /// </summary>
    public class UnityWebRequestAwaiter : INotifyCompletion
    {
        private readonly UnityWebRequestAsyncOperation asyncOperation;
        private Action action;

        public UnityWebRequestAwaiter(UnityWebRequestAsyncOperation asyncOperation)
        {
            this.asyncOperation = asyncOperation;
            asyncOperation.completed += OnRequestCompleted;
        }

        public bool IsCompleted { get { return asyncOperation.isDone; } }

        public void GetResult() { }

        public void OnCompleted(Action action)
        {
            this.action = action;
        }

        private void OnRequestCompleted(AsyncOperation operation)
        {
            action();
        }
    }

    public static class ExtensionMethods
    {
        public static UnityWebRequestAwaiter GetAwaiter(this UnityWebRequestAsyncOperation asyncOperation)
        {
            return new UnityWebRequestAwaiter(asyncOperation);
        }
    }
}
