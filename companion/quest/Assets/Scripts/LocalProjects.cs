// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using UnityEngine;

namespace HapticStudio
{
    [ExecuteInEditMode]
    public class LocalProjects : MonoBehaviour
    {
        public static LocalProjects Instance { get; private set; }

        /// <summary>
        /// A dictionary with the stored projects. The key is the project id, the value is of type `Project`
        /// </summary>
        public Dictionary<string, PinnedProject> Projects { get; private set; } = new();

        /// <summary>
        /// Stores the project that is beign edited in Studio Desktop when the connection is established
        /// </summary>
        public Project LiveProject { get; private set; }

        /// <summary>
        /// The time the project was last updated
        /// </summary>
        public long LiveProjectLastUpdate { get; private set; }

        public delegate void AddProjectDelegate();

        /// <summary>
        /// Delegate method called when a project is added or removed
        /// </summary>
        public event AddProjectDelegate OnProjectListChange;

        public delegate void OpenProjectDelegate(Project project, bool live);

        /// <summary>
        /// Delegate method called when the user selects a project
        /// </summary>
        public event OpenProjectDelegate OnOpenProject;

        private const string PINNED_PROJECT_KEY = "PINNED_PROJECTS";
        private const int DEFAULT_CACHE_SIZE = 100;

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

            LiveProject = null;
            LoadProjects();
        }

        /// <summary>
        /// Set a project as the current project on Studio Desktop
        /// </summary>
        /// <param name="project">The project received via socket</param>
        public void SetLiveProject(Project project)
        {
            LiveProject = project;
            UpdateLiveProject();

            // If the project was previously stored, update its contents
            if (project != null && Projects.ContainsKey(project.id))
            {
                StoreProject(project);
            }
        }

        /// <summary>
        /// Update the 'last update' field
        /// </summary>
        public void UpdateLiveProject()
        {
            LiveProjectLastUpdate = DateTimeOffset.Now.ToUnixTimeMilliseconds();
        }

        /// <summary>
        /// Add a new project to the list, store it and notify the change to listeners
        /// </summary>
        /// <param name="project">The Project</param>
        public void Add(Project project)
        {
            StoreProject(project);
            Projects[project.id] = new PinnedProject(project.id, project.name,
                project.clips.Select(c => c.clipId).ToArray(), DateTimeOffset.Now.ToUnixTimeMilliseconds());

            SaveProjects();
            OnProjectListChange?.Invoke();
        }

        /// <summary>
        /// Remove a project from the list, remove the file and notify the change to listeners
        /// </summary>
        /// <param name="projectId">The Project</param>
        public void Remove(string projectId)
        {
            string path = Utils.PathForProject(projectId);
            Utils.DeleteFile(path);
            Projects.Remove(projectId);

            SaveProjects();
            OnProjectListChange?.Invoke();
        }

        /// <summary>
        /// Load a project from the disk
        /// </summary>
        /// <param name="projectId">The project id</param>
        /// <returns></returns>
        public async Task Load(string projectId)
        {
            string path = Utils.PathForProject(projectId);
            if (File.Exists(path))
            {
                string json = await File.ReadAllTextAsync(path);
                Project project = JsonUtility.FromJson<Project>(json);
                OnOpenProject?.Invoke(project, false);
            }
        }

        /// <summary>
        /// Load the current project loaded in Studio Desktop
        /// </summary>
        public void LoadCurrent()
        {
            if (LiveProject != null)
            {
                OnOpenProject?.Invoke(LiveProject, true);
            }
        }

        /// <summary>
        /// Check if the project is stored in the pinned projects
        /// </summary>
        /// <param name="project">The project</param>
        /// <returns>True if is stored</returns>
        public bool IsProjectPinned(Project project)
        {
            return Projects.ContainsKey(project.id);
        }

        /// <summary>
        /// Clear the clips cache, while making sure that the clips belonging
        /// to a pinned project are kept
        /// <param name="exclusions">An optional list of clip ids that should not be removed. e.g. the current auditioning porject</param>
        /// <param name="cacheSize">An optional maximum cache size. The cache is cleared only when the numer of clips is higher that this value. Defaults to `DEFAULT_CACHE_SIZE`</param>
        /// </summary>
        public void ClearCacheStorage(string[] exclusions, int cacheSize = DEFAULT_CACHE_SIZE)
        {
            string[] clipIds = Utils.StoredClips();

            if (clipIds.Length <= cacheSize) return;

            string[] clipsToKeep = Projects.Values.SelectMany(p => p.clipIds).ToArray();
            foreach (string clipId in clipIds)
            {
                if (!clipsToKeep.Contains(clipId)
                    && !(LiveProject != null && LiveProject.clips.Select(c => c.clipId).Contains(clipId))
                    && !(exclusions != null && exclusions.Contains(clipId)))
                {
                    Utils.DeleteDirectory(Utils.PathForClip(clipId));
                }
            }
        }

        private void StoreProject(Project project)
        {
            string path = Utils.PathForProject(project.id);
            Utils.CreateFile(path);
            File.WriteAllText(path, JsonUtility.ToJson(project));
        }

        private void LoadProjects()
        {
            string json = PlayerPrefs.GetString(PINNED_PROJECT_KEY, "{}");
            Projects = JsonConvert.DeserializeObject<Dictionary<string, PinnedProject>>(json);
        }

        private void SaveProjects()
        {
            PlayerPrefs.SetString(PINNED_PROJECT_KEY, JsonConvert.SerializeObject(Projects));
        }
    }
}
