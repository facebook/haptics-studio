// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System.Collections;
using HapticStudio;
using UnityEngine;
using UnityEngine.UI;

public class NuxHandler : MonoBehaviour
{
    [SerializeField] private NetworkHandler _networkHandler;
    [SerializeField] private ProjectsPanelsHandler _projectPanelsHandler;
    [SerializeField] private Connection _connectionHandler;
    [SerializeField] private SamplesProjectHandler sampleProjectHandler;

    [SerializeField] private GameObject[] _instructionPanels;

    [Header("Progress bar")]
    [SerializeField]
    private Sprite _stepDone;

    [SerializeField] private Sprite _stepMissing;
    [SerializeField] private Image[] _steps;

    private int _currentPanelIndex;

    public delegate void NuxCompleted();
    public static event NuxCompleted OnNuxCompleted;

    protected virtual void Awake()
    {
        //Used for various other classes as well, initialized here as this is always enabled at the start of the app
        UnityThread.initUnityThread();
    }

    protected virtual IEnumerator Start()
    {
        if (!PlayerPrefs.HasKey("NUX_DONE") || PlayerPrefs.GetInt("NUX_DONE") == 0)
        {
            yield return null;
        }
        else
        {
            yield return new WaitForEndOfFrame(); //Wait for other classes to subscribe
            CloseNux();
        }
    }

    protected virtual void OnEnable()
    {
        _connectionHandler.OpenedFromNUX = true;
        _networkHandler.OnSocketConnected += NetworkHandlerOnSocketConnected;
        _networkHandler.OnSocketAuthenticationGranted += NetworkHandlerOnSocketAuthenticationGranted;
    }

    protected virtual void OnDisable()
    {
        _connectionHandler.OpenedFromNUX = false;
        _networkHandler.OnSocketConnected -= NetworkHandlerOnSocketConnected;
        _networkHandler.OnSocketAuthenticationGranted -= NetworkHandlerOnSocketAuthenticationGranted;
    }

    private void NetworkHandlerOnSocketConnected(SocketEndpoint endpoint)
    {
        UnityThread.executeInUpdate(() =>
        {
            NextPanel();
        });
    }

    private void NetworkHandlerOnSocketAuthenticationGranted(SocketEndpoint endpoint)
    {
        UnityThread.executeInUpdate(() =>
        {
            GoToPanel(_instructionPanels.Length - 1); //Last panel, connection done.
        });
    }

    private void GoToPanel(int index)
    {
        _instructionPanels[_currentPanelIndex].SetActive(false);
        _currentPanelIndex = index;

        for (int i = 0; i <= _currentPanelIndex; i++)
        {
            _steps[i].sprite = _stepDone;
        }

        for (int i = _currentPanelIndex + 1; i < _steps.Length; i++)
        {
            _steps[i].sprite = _stepMissing;
        }

        _instructionPanels[_currentPanelIndex].SetActive(true);
    }

    /// <summary>
    /// Restarts NUX
    /// </summary>
    public void RestartNux()
    {
        _instructionPanels[_currentPanelIndex].SetActive(false);
        foreach (var step in _steps)
        {
            step.sprite = _stepMissing;
        }

        _steps[0].sprite = _stepDone;
        _currentPanelIndex = 0;
        _instructionPanels[_currentPanelIndex].SetActive(true);
        gameObject.SetActive(true);
    }

    /// <summary>
    /// Closes the NUX
    /// </summary>
    public void CloseNux()
    {
        PlayerPrefs.SetInt("NUX_DONE", 1);
        _projectPanelsHandler.OpenProjectPanel();
        _instructionPanels[_currentPanelIndex].SetActive(false);
        OnNuxCompleted?.Invoke();
        gameObject.SetActive(false);
    }

    /// <summary>
    /// Closes the NUX and loads the sample project
    /// </summary>
    public void LoadSampleProject()
    {
        sampleProjectHandler.gameObject.SetActive(true);
        sampleProjectHandler.ComesFromNUX = true;
        gameObject.SetActive(false);
    }

    /// <summary>
    /// Advance one step in the NUX panel
    /// </summary>
    public void NextPanel()
    {
        _instructionPanels[_currentPanelIndex].SetActive(false);
        _currentPanelIndex++;
        if (_currentPanelIndex < _instructionPanels.Length)
        {
            _steps[_currentPanelIndex].sprite = _stepDone;
            _instructionPanels[_currentPanelIndex].SetActive(true);
        }
    }

    /// <summary>
    /// Go one step back in the NUX panel
    /// </summary>
    public void PreviousPanel()
    {
        if (_currentPanelIndex == 0)
        {
            return;
        }

        _instructionPanels[_currentPanelIndex].SetActive(false);
        _steps[_currentPanelIndex].sprite = _stepMissing;
        _currentPanelIndex--;
        _instructionPanels[_currentPanelIndex].SetActive(true);
    }
}
