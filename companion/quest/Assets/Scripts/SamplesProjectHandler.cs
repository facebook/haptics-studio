// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System;
using System.Collections;
using System.Collections.Generic;
using HapticStudio;
using Oculus.Haptics;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class SamplesProjectHandler : MonoBehaviour
{
    private class SampleGroup
    {
        public bool isShown;
        public GameObject groupHeader;
        public GameObject clipsContainer;
    }

    [SerializeField] private NuxHandler nuxHandler;
    [SerializeField] private ProjectsPanelsHandler projectsPanelsHandler;

    [SerializeField] private AudioSource audioSource;

    [SerializeField] private GameObject groupHeaderPrefab;
    [SerializeField] private GameObject groupTabPrefab;
    [SerializeField] private GameObject groupTabsContainer;
    [SerializeField] private GameObject clipItemPrefab;
    [SerializeField] private GameObject generalContainer;
    [SerializeField] private GameObject clipsContainer;
    [SerializeField] private ToggleGroup clipsToggleGroup;

    private Dictionary<string, SampleGroup> _groupsInstantiated = new();
    private Project _samplesProject;

    private HapticClipPlayer _hapticPlayer;
    private string _selectedClipId;

    private PlayButton _currentPlayButton;

    private Controller _activeController;
    private Coroutine _playHapticsCoroutine;

    [HideInInspector] public bool ComesFromNUX = false;

    private void Awake()
    {
        LoadSampleProject();
        CreateClips();
        UpdateClipList();
    }

    private void OnEnable()
    {
        StartCoroutine(SetAllTogglesOffCoroutine());
    }

    private IEnumerator SetAllTogglesOffCoroutine()
    {
        yield return new WaitForEndOfFrame();
        StopSoundAndHaptics();
        PrepareClip("null", false);
        audioSource.clip = null;
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

    public void ShowAll()
    {
        foreach (var groupID in _groupsInstantiated.Keys)
        {
            _groupsInstantiated[groupID].isShown = true;
        }

        StopSoundAndHaptics();
        UpdateClipList();
    }

    public void GoBack()
    {
        if (ComesFromNUX)
        {
            nuxHandler.RestartNux();
        }
        else
        {
            projectsPanelsHandler.OpenProjectPanel();
        }

        StopSoundAndHaptics();
        gameObject.SetActive(false);
    }

    public void StopSoundAndHaptics()
    {
        if (_playHapticsCoroutine != null)
        {
            StopCoroutine(_playHapticsCoroutine);
            _currentPlayButton.SetIconToPlay();
        }

        _hapticPlayer?.Stop();
        audioSource.Stop();
        clipsToggleGroup.SetAllTogglesOff();
    }

    private void LoadSampleProject()
    {
        var projectJson = Resources.Load<TextAsset>("SampleProject/project");
        var sample = JsonUtility.FromJson<SampleProject>(projectJson.text);
        var project = new Project
        {
            name = "Sample Project",
            clips = sample.clips,
            groups = sample.groups,
            isSample = true
        };
        _samplesProject = project;
    }

    private void CreateClips()
    {
        foreach (ClipGroup group in _samplesProject.groups)
        {
            if (!group.isFolder)
            {
                continue;
            }

            GameObject groupHeader = Instantiate(groupHeaderPrefab, generalContainer.transform, false);
            var textComponent = groupHeader.GetComponentInChildren<TMP_Text>();
            textComponent.text = group.name;

            GameObject groupTab = Instantiate(groupTabPrefab, groupTabsContainer.transform, false);
            TMP_Text groupTabName = groupTab.GetComponentInChildren<TMP_Text>();
            groupTabName.text = group.name;
            groupTab.GetComponent<RectTransform>().sizeDelta = new Vector2(groupTabName.text.Length * 5f + 45f, 30f);

            Toggle groupTabToggle = groupTab.GetComponent<Toggle>();
            groupTabToggle.group = groupTabsContainer.GetComponent<ToggleGroup>();
            groupTabToggle.onValueChanged.AddListener(delegate
            {
                if (groupTabToggle.isOn)
                {
                    foreach (var groupID in _groupsInstantiated.Keys)
                    {
                        _groupsInstantiated[groupID].isShown = false;
                    }

                    _groupsInstantiated[group.id].isShown = true;
                    StopSoundAndHaptics();
                    UpdateClipList();
                }
            });

            GameObject clipsContainerInstance = Instantiate(clipsContainer, generalContainer.transform, false);
            foreach (var clip in group.clips)
            {
                AppendClipToList(clip, clipsContainerInstance);
            }

            clipsToggleGroup.SetAllTogglesOff();

            SampleGroup sampleGroup = new SampleGroup
            {
                isShown = group.isCollapsed,
                groupHeader = groupHeader,
                clipsContainer = clipsContainerInstance
            };
            _groupsInstantiated.TryAdd(group.id, sampleGroup);
        }
    }

    private void UpdateClipList()
    {
        foreach (var groupID in _groupsInstantiated.Keys)
        {
            _groupsInstantiated[groupID].groupHeader.SetActive(_groupsInstantiated[groupID].isShown);
            _groupsInstantiated[groupID].clipsContainer.SetActive(_groupsInstantiated[groupID].isShown);
        }
    }

    private void AppendClipToList(string clipId, GameObject clipsContainer)
    {
        var clip = Array.Find(_samplesProject.clips, element => element.clipId.Equals(clipId));

        if (clip == null) return;

        GameObject item = Instantiate(clipItemPrefab, clipsContainer.transform, false);

        Toggle toggle = item.GetComponent<Toggle>();
        toggle.group = clipsToggleGroup;
        PlayButton playButton = item.GetComponentInChildren<PlayButton>();
        playButton.SetSamplesHandler(this);
        toggle.onValueChanged.AddListener(delegate
        {
            if (toggle.isOn)
            {
                _currentPlayButton = playButton;
                SetCurrentClip(clipId, true);
            }
            else
            {
                _currentPlayButton.SetIconToPlay();
            }
        });
        var textComponents = item.GetComponentsInChildren<TextMeshProUGUI>();
        textComponents[0].text = clip.name;
    }

    private void SetCurrentClip(string clipId, bool play)
    {
        _selectedClipId = clipId;
        PrepareClip(clipId, play);
    }

    private void PrepareClip(string clipId, bool play)
    {
        var clip = Array.Find(_samplesProject.clips, element => element.clipId.Equals(clipId));
        if (clip != null)
        {
            var json = Resources.Load<HapticClip>($"SampleProject/{clip.clipId}").json;
            audioSource.clip = Resources.Load<AudioClip>($"SampleProject/{clipId}");
            PrepareHapticPlayer(json);

            if (play)
            {
                PlayCurrentClip(_activeController);
            }
        }
    }

    private void PrepareHapticPlayer(string json)
    {
        _hapticPlayer?.Stop();
        HapticClip hapticClip = ScriptableObject.CreateInstance<HapticClip>();
        hapticClip.json = json;
        _hapticPlayer = new HapticClipPlayer(hapticClip);
    }

    private void PlayCurrentClip(Controller controller)
    {
        if (_selectedClipId == null || audioSource.clip.loadState != AudioDataLoadState.Loaded)
        {
            return;
        }

        audioSource.Play();
        float delay = TweaksHandler.HapticDelay;
        if (_playHapticsCoroutine != null)
        {
            StopCoroutine(_playHapticsCoroutine);
        }

        _playHapticsCoroutine = StartCoroutine(PlayHapticsWithDelay(delay / 1000.0f, controller));
    }

    private IEnumerator PlayHapticsWithDelay(float time, Controller controller)
    {
        _currentPlayButton.SetIconToPause();

        yield return new WaitForSeconds(time);

        if (_hapticPlayer == null)
        {
            yield break;
        }

        _hapticPlayer.Play(controller);
        yield return new WaitForSeconds(_hapticPlayer.clipDuration);
        _currentPlayButton.SetIconToPlay();
    }
}
