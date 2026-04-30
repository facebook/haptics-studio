// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System;
using System.Collections;
using System.Collections.Generic;
using Oculus.Interaction.Samples;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace HapticStudio
{
    /// <summary>
    /// Handles which panels to show, the flow inside the project panels and the pinned projects.
    /// </summary>
    public class ProjectsPanelsHandler : MonoBehaviour
    {
        [Header("Handlers")][SerializeField] private NetworkHandler networkHandler;
        [SerializeField] private NuxHandler nuxHandler;
        [SerializeField] private Connection connectionHandler;
        [SerializeField] private SamplesProjectHandler sampleProjectHandler;
        [SerializeField] private CurrentProjectHandler currentProjectHandler;

        [Header("Panels")][SerializeField] private GameObject liveProjectPanel;
        [SerializeField] private GameObject noLiveProjectPanel;
        [SerializeField] private GameObject studioDisconnectedPanel;
        [SerializeField] private GameObject pinnedProjectsPanel;
        [SerializeField] private GameObject emptyPinnedProjectsPanel;

        [Header("Current project")]
        [SerializeField]
        private TMP_Text currentProjectName;

        [SerializeField] private TMP_Text currentProjectLastUpdated;

        [Header("Pinned projects")]
        [SerializeField]
        private GameObject pinnedProjectsContainer;

        [SerializeField] private GameObject pinnedProjectItemPrefab;

        [Header("Connection button")]
        [SerializeField]
        private Image connectedButton;

        [SerializeField] private Sprite connectedImage;
        [SerializeField] private Sprite disconnectedImage;

        [Header("Tab buttons")]
        [SerializeField]
        private AnimatorOverrideLayerWeigth currentProjectTab;

        [SerializeField] private AnimatorOverrideLayerWeigth pinnedProjectsTab;

        private Dictionary<string, TextMeshProUGUI> _timeLabels = new();
        public PanelState CurrentPanelState { get; private set; }

        /// <summary>
        /// Maps the possible states of the panels
        /// </summary>
        public enum PanelState
        {
            LiveProject, NoLiveProject, StudioDisconnected, PinnedProjects, EmptyPinnedProjects
        }

        private void OnEnable()
        {
            networkHandler.OnSocketConnected += OnSocketConnected;
            networkHandler.OnSocketDisconnected += OnSocketDisconnected;
            networkHandler.OnSetCurrentProject += OnSetCurrentProject;
            networkHandler.OnCloseCurrentProject += OnCloseCurrentProject;

            StartCoroutine(InitializationCoroutine());
        }

        private void OnDisable()
        {
            networkHandler.OnSocketConnected -= OnSocketConnected;
            networkHandler.OnSocketDisconnected -= OnSocketDisconnected;
            networkHandler.OnSetCurrentProject -= OnSetCurrentProject;
            networkHandler.OnCloseCurrentProject -= OnCloseCurrentProject;
        }

        protected virtual void Start()
        {
            InvokeRepeating(nameof(UpdateLastUpdated), 5, 1);
        }

        private void OnSocketConnected(SocketEndpoint endpoint)
        {
            UnityThread.executeInUpdate(() =>
            {
                CurrentPanelState = PanelState.NoLiveProject;
                UpdateCurrentPanel();
                UpdateConnectedIcon();
            });
        }

        private void OnSocketDisconnected()
        {
            UnityThread.executeInUpdate(() =>
            {
                CurrentPanelState = PanelState.StudioDisconnected;
                currentProjectHandler.StopSoundAndHaptics();
                UpdateCurrentPanel();
                UpdateConnectedIcon();
            });
        }

        private void OnSetCurrentProject(Project project)
        {
            LocalProjects.Instance.SetLiveProject(project);
            UnityThread.executeInUpdate(() =>
            {
                UpdateLastUpdated();
                currentProjectName.text = project.name;
                CurrentPanelState = PanelState.LiveProject;
                UpdateCurrentPanel();
                LoadCurrentProject();
            });
        }

        private void OnCloseCurrentProject()
        {
            UnityThread.executeInUpdate(() =>
            {
                currentProjectHandler.StopSoundAndHaptics();
                LocalProjects.Instance.SetLiveProject(null);
                CurrentPanelState = PanelState.NoLiveProject;
                UpdateCurrentPanel();
            });
        }

        private IEnumerator InitializationCoroutine()
        {
            //Wait for the rest of the classes to subscribe to network events
            yield return new WaitForEndOfFrame();
            if (networkHandler.CurrentProject != null)
            {
                networkHandler.TriggerCurrentProjectEvent();
            }

            UpdateConnectedIcon();
        }

        private void LoadCurrentProject()
        {
            LocalProjects.Instance.LoadCurrent();
        }

        public void LoadSampleProject()
        {
            currentProjectHandler.StopSoundAndHaptics();
            sampleProjectHandler.gameObject.SetActive(true);
            sampleProjectHandler.ComesFromNUX = false;
            CloseProjectPanel();
        }

        public void OpenProjectPanel()
        {
            gameObject.SetActive(true);

            if (networkHandler.IsConnected())
            {
                CurrentPanelState = (LocalProjects.Instance.LiveProject != null &&
                                     LocalProjects.Instance.LiveProject.IsValid &&
                                     !LocalProjects.Instance.LiveProject.isSample)
                    ? PanelState.LiveProject
                    : PanelState.NoLiveProject;
            }
            else
            {
                CurrentPanelState = PanelState.StudioDisconnected;
            }

            LoadCurrentProject();
            UpdateCurrentPanel();
        }

        public void OpenPinnedProjectsPanel()
        {
            CurrentPanelState = (LocalProjects.Instance.Projects != null &&
                                 LocalProjects.Instance.Projects.Count != 0)
                ? PanelState.PinnedProjects
                : PanelState.EmptyPinnedProjects;

            currentProjectHandler.StopSoundAndHaptics();
            UpdateProjectsList();
            UpdateCurrentPanel();
        }

        public void OpenConnectionPanel()
        {
            currentProjectHandler.StopSoundAndHaptics();
            connectionHandler.OpenConnectPanel();
            CloseProjectPanel();
        }

        public void OpenNUX()
        {
            currentProjectHandler.StopSoundAndHaptics();
            nuxHandler.RestartNux();
            CloseProjectPanel();
        }

        private void UpdateCurrentPanel()
        {
            DisableAllPanels();

            switch (CurrentPanelState)
            {
                case PanelState.PinnedProjects:
                    pinnedProjectsPanel.SetActive(true);
                    currentProjectTab.SetOverrideLayerActive(false);
                    pinnedProjectsTab.SetOverrideLayerActive(true);
                    break;
                case PanelState.EmptyPinnedProjects:
                    emptyPinnedProjectsPanel.SetActive(true);
                    currentProjectTab.SetOverrideLayerActive(false);
                    pinnedProjectsTab.SetOverrideLayerActive(true);
                    break;
                case PanelState.LiveProject:
                    liveProjectPanel.SetActive(true);
                    currentProjectTab.SetOverrideLayerActive(true);
                    pinnedProjectsTab.SetOverrideLayerActive(false);
                    break;
                case PanelState.NoLiveProject:
                    noLiveProjectPanel.SetActive(true);
                    currentProjectTab.SetOverrideLayerActive(true);
                    pinnedProjectsTab.SetOverrideLayerActive(false);
                    break;
                case PanelState.StudioDisconnected:
                    studioDisconnectedPanel.SetActive(true);
                    currentProjectTab.SetOverrideLayerActive(true);
                    pinnedProjectsTab.SetOverrideLayerActive(false);
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
        }

        private void UpdateConnectedIcon()
        {
            connectedButton.sprite = networkHandler.IsConnected() ? connectedImage : disconnectedImage;
        }

        private void DisableAllPanels()
        {
            liveProjectPanel.SetActive(false);
            noLiveProjectPanel.SetActive(false);
            studioDisconnectedPanel.SetActive(false);
            pinnedProjectsPanel.SetActive(false);
            emptyPinnedProjectsPanel.SetActive(false);
        }

        private void CloseProjectPanel()
        {
            DisableAllPanels();
            gameObject.SetActive(false);
        }

        /// <summary>
        /// Re-render the projects list
        /// </summary>
        private void UpdateProjectsList()
        {
            var projects = LocalProjects.Instance.Projects.Values;
            _timeLabels.Clear();

            foreach (Transform child in pinnedProjectsContainer.transform)
            {
                Destroy(child.gameObject);
            }

            foreach (PinnedProject pinnedProject in projects)
            {
                GameObject item = Instantiate(pinnedProjectItemPrefab, pinnedProjectsContainer.transform, false);
                Toggle toggle = item.GetComponent<Toggle>();
                toggle.onValueChanged.AddListener(async delegate
                {
                    if (!toggle.isOn)
                    {
                        return;
                    }

                    await LocalProjects.Instance.Load(pinnedProject.id);
                    CurrentPanelState = PanelState.LiveProject;
                    currentProjectName.text = pinnedProject.name;
                    currentProjectLastUpdated.text = $"Last updated {Utils.TimeAgo(pinnedProject.lastUpdate)}";
                    UpdateCurrentPanel();
                });
                var textComponents = item.GetComponentsInChildren<TextMeshProUGUI>();
                textComponents[0].text = pinnedProject.name;
                textComponents[2].text = $"Last updated {Utils.TimeAgo(pinnedProject.lastUpdate)}";
                textComponents[3].text = $"{pinnedProject.clipIds.Length} clips";
                _timeLabels.Add(pinnedProject.id, textComponents[2]);
            }
        }

        /// <summary>
        /// Updates a specific label under the project list to reflect the last updated time
        /// </summary>
        private void UpdateLastUpdated()
        {
            UnityThread.executeInUpdate(() =>
            {
                if (LocalProjects.Instance.LiveProject != null)
                {
                    string timeString = $"Last updated {Utils.TimeAgo(LocalProjects.Instance.LiveProjectLastUpdate)}";
                    currentProjectLastUpdated.text = timeString;
                }

                foreach (PinnedProject project in LocalProjects.Instance.Projects.Values)
                {
                    if (_timeLabels.ContainsKey(project.id))
                    {
                        string timeString = $"Last updated {Utils.TimeAgo(project.lastUpdate)}";
                        _timeLabels[project.id].text = timeString;
                    }
                }
            });
        }
    }
}
