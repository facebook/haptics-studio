// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System.IO;
using UnityEditor;

public class BuildFlavors
{
    private const string ApkAppName = "HapticsStudio";
    private const string SceneRoot = "Assets/Scenes/";
    private const string buildFolderName = "build";
    private static readonly string[] projectScenes = {
        SceneRoot + "MainScene.unity"
    };

    [MenuItem("CI/Build Android64", priority = 100)]
    static void MenuBuildAndroid64()
    {
        BuildAndroid64();
    }

    public static void BuildWindows()
    {
        var buildPath = Path.Combine(Path.GetFullPath("."), buildFolderName);
        BuildGeneric("Scenes.exe",
          projectScenes,
          BuildOptions.ShowBuiltPlayer,
          buildPath,
          BuildTarget.Android);
    }

    public static void BuildAndroid64()
    {
        Android(AndroidArchitecture.ARM64);
    }

    public static void Android(AndroidArchitecture architecture)
    {
        string previousAppIdentifier = PlayerSettings.GetApplicationIdentifier(BuildTargetGroup.Android);
        PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, "com.oculus." + ApkAppName);
        PlayerSettings.Android.targetArchitectures = architecture;
        var implementation = ScriptingImplementation.IL2CPP;
        PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, implementation);
        // NOTE: The SocketIO library does not currently support UnityEditor.Build.Il2CppCodeGeneration.OptimizeSpeed
        PlayerSettings.SetIl2CppCodeGeneration(UnityEditor.Build.NamedBuildTarget.Android, UnityEditor.Build.Il2CppCodeGeneration.OptimizeSize);
        BuildPlayerOptions buildOptions = new BuildPlayerOptions()
        {
            locationPathName = string.Format("builds/{0}.apk", ApkAppName),
            scenes = projectScenes,
            target = BuildTarget.Android,
            targetGroup = BuildTargetGroup.Android,
        };
        buildOptions.options = new BuildOptions();
        try
        {
            var error = BuildPipeline.BuildPlayer(buildOptions);
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, previousAppIdentifier);
            HandleBuildError.Check(error);
        }
        catch
        {
            UnityEngine.Debug.Log("Exception while building: exiting with exit code 2");
            EditorApplication.Exit(2);
        }
    }

    private static void BuildGeneric(string buildName,
      string[] scenes,
      BuildOptions buildOptions,
      string path,
      BuildTarget target)
    {

        if (!string.IsNullOrEmpty(buildName) && null != scenes && scenes.Length > 0)
        {
            var fullPath = Path.Combine(path, buildName);
            if (!string.IsNullOrEmpty(path))
            {
                BuildPipeline.BuildPlayer(scenes, fullPath, target, buildOptions);
            }
            else
            {
                UnityEngine.Debug.Log("Invalid build path!");
            }
        }
        else
        {
            UnityEngine.Debug.Log("Invalid build configuration!");
        }
    }
}

public class HandleBuildError
{
    public static void Check(UnityEditor.Build.Reporting.BuildReport buildReport)
    {
        bool buildSucceeded =
            buildReport.summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded;
        if (buildReport.summary.platform == BuildTarget.Android)
        {
            // Android can fail to produce the output even if the build is marked as succeeded in some rare
            // scenarios, notably if the Unity directory is read-only... Annoying, but needs to be handled!
            buildSucceeded = buildSucceeded && File.Exists(buildReport.summary.outputPath);
        }
        if (buildSucceeded)
        {
            UnityEngine.Debug.Log("Exiting with exit code 0");
            EditorApplication.Exit(0);
        }
        else
        {
            UnityEngine.Debug.Log("Exiting with exit code 1");
            EditorApplication.Exit(1);
        }
    }
}
