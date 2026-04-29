// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System.Collections;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace HapticStudio
{
    public class Connection : MonoBehaviour
    {
        public NetworkHandler networkHandler;
        public GameObject connectionItemPrefab;
        public GameObject connectionContainer;
        public Sprite usbConnectionSprite;
        public ToggleGroup hostsToggleGroup;

        [SerializeField] private ProjectsPanelsHandler _projectPanelsHandler;
        [SerializeField] private NuxHandler _nuxHandler;

        [SerializeField] private GameObject _manualIPPanel;
        [SerializeField] private GameObject _connectPanel;
        [SerializeField] private GameObject _codePanel;
        [SerializeField] private Toggle connectButton;
        [SerializeField] private GameObject connectSpinner;

        public TMP_InputField[] ipAddrFields;
        public TMP_InputField codeField;
        public TMP_Text codeHeaderLabel;

        public Toggle manualConnectionButton;
        public Toggle codeConfirmationButton;

        [HideInInspector] public bool OpenedFromNUX;

        [Header("Progress bar")]
        [SerializeField]
        private GameObject _progressBar;

        [SerializeField] private Sprite _stepDone;
        [SerializeField] private Sprite _stepMissing;
        [SerializeField] private Image[] _steps;

        private SocketEndpoint _selectedEndpoint = null;

        private bool _connectAuto = true;
        private bool _authenticated;
        private bool _showManualControls;

        public ConnectionState CurrentConnectionState { get; private set; }

        /// <summary>
        /// Maps the possible states of the connection panel
        /// </summary>
        public enum ConnectionState
        {
            Disconnected, Manual, Authenticating, Connected
        }

        protected virtual IEnumerator Start()
        {
            // Wait for the events to be subscribed
            yield return new WaitForEndOfFrame();

            networkHandler.Listen();

            // Register the listeners to automate the focus change in the IP address and Code fields
            for (var i = 0; i < 4; i += 1)
            {
                // The focus jump is disabled for now
                // ipAddrFields[i].onValueChanged.AddListener((value) => MoveToNextField(ipAddrFields[i], i < 3 ? ipAddrFields[i + 1] : null, 3, value));
                ipAddrFields[i].onFocusSelectAll = true;
                ipAddrFields[i].onValueChanged.AddListener((value) => ValidateIPAndPort());
            }

            if (PlayerPrefs.HasKey("IP_ADDR"))
            {
                var tokens = PlayerPrefs.GetString("IP_ADDR").Split('.');
                if (tokens.Length == 4)
                {
                    for (var i = 0; i < 4; i += 1)
                    {
                        ipAddrFields[i].text = tokens[i];
                    }
                }
            }
        }

        protected virtual void OnEnable()
        {
            // Listen for the discovery messages
            networkHandler.OnNewHost += NewHost;
            networkHandler.OnSocketConnected += SocketConnected;
            networkHandler.OnSocketError += SocketError;
            networkHandler.OnSocketDisconnected += SocketDisconnected;
            networkHandler.OnSocketAuthenticationRequest += SocketAuthenticationRequest;
            networkHandler.OnSocketAuthenticationError += SocketAuthenticationError;
            networkHandler.OnSocketAuthenticationGranted += SocketAuthenticationGranted;
            UpdateHostList();

            StartCoroutine(MonitorUSB());
        }

        protected virtual void OnDisable()
        {
            networkHandler.OnNewHost -= NewHost;
            networkHandler.OnSocketConnected -= SocketConnected;
            networkHandler.OnSocketError -= SocketError;
            networkHandler.OnSocketDisconnected -= SocketDisconnected;
            networkHandler.OnSocketAuthenticationRequest -= SocketAuthenticationRequest;
            networkHandler.OnSocketAuthenticationError -= SocketAuthenticationError;
            networkHandler.OnSocketAuthenticationGranted -= SocketAuthenticationGranted;

            StopAllCoroutines();
        }

        private void NewHost()
        {
            Debug.Log("socket.OnNewHost");
            UpdateHostList();
        }

        private void SocketConnected(SocketEndpoint endpoint)
        {
            Debug.Log("socket.OnConnected");
            UnityThread.executeInUpdate(() =>
            {
                ToggleManualIPPanel(false);
                connectButton.interactable = true;
                connectSpinner.SetActive(false);
                UpdateConnectionState();
            });
        }

        private void SocketError()
        {
            Debug.Log("socket.OnError");
            UnityThread.executeInUpdate(() =>
            {
                connectButton.interactable = true;
                connectSpinner.SetActive(false);
                UpdateConnectionState();
            });
        }

        private void SocketDisconnected()
        {
            UnityThread.executeInUpdate(UpdateConnectionState);
        }

        private void SocketAuthenticationRequest()
        {
            Debug.Log("socket.OnSocketAuthenticationRequest");
            UnityThread.executeInUpdate(() =>
            {
                _authenticated = false;
                OpenCodePanel();
                UpdateConnectionState();
            });
        }

        private void SocketAuthenticationError()
        {
            Debug.Log("socket.OnSocketAuthenticationError");
            UnityThread.executeInUpdate(() =>
            {
                _authenticated = false;
                UpdateConnectionState();
                codeHeaderLabel.text = "Wrong Security Code Entered";
                ResetCode();
            });
        }

        private void SocketAuthenticationGranted(SocketEndpoint endpoint)
        {
            Debug.Log("socket.OnSocketAuthenticationGranted");

            // Save the endpoint if Automatically Connect is checked
            if (_connectAuto)
            {
                _selectedEndpoint?.StoreInPrefs();
            }
            else
            {
                SocketEndpoint.ClearPrefs();
            }

            // Request the current project state
            networkHandler.SendProjectRequest();

            UnityThread.executeInUpdate(() =>
            {
                ResetCode();
                _authenticated = true;
                UpdateConnectionState();
                codeHeaderLabel.text = "Enter Security Code";
                CloseConnectionPanel();
            });
        }

        private IEnumerator MonitorUSB()
        {
            while (true)
            {
                yield return new WaitForSeconds(1);

                networkHandler.PingUSBMonitor();
            }
        }

        private void ValidateIPAndPort()
        {
            var ip = string.Join('.', ipAddrFields.Select((f) => f.text));
            manualConnectionButton.interactable = (Utils.IsIPAddressValid(ip));
        }

        private void ValidateCode()
        {
            codeConfirmationButton.interactable = (
                codeField.text.Length == 4
            );
        }

        /// <summary>
        /// Resets the fields of the code input
        /// </summary>
        private void ResetCode()
        {
            UnityThread.executeInUpdate(() =>
            {
                codeField.text = "";
            });
        }

        /// <summary>
        /// Refresh the list of discovered hosts
        /// </summary>
        private void UpdateHostList()
        {
            Debug.Log("Updating host list");
            UnityThread.executeInUpdate(() =>
            {
                foreach (Transform child in connectionContainer.transform)
                {
                    Destroy(child.gameObject);
                }

                foreach (SocketEndpoint endpoint in networkHandler.Endpoints.Values)
                {
                    Debug.Log($"UI Adding host: {endpoint.hostname}");
                    GameObject item = Instantiate(connectionItemPrefab);
                    Toggle toggle = item.GetComponent<Toggle>();
                    toggle.group = hostsToggleGroup;
                    toggle.onValueChanged.AddListener(delegate
                    {
                        _selectedEndpoint = networkHandler.Endpoints[endpoint.hostname];
                    });
                    item.GetComponentInChildren<TMP_Text>().text = endpoint.hostname;
                    if (endpoint.hostname == "USB Connection")
                    {
                        foreach (var image in item.GetComponentsInChildren<Image>())
                        {
                            if (image.CompareTag("QDSUIIcon"))
                            {
                                image.sprite = usbConnectionSprite;
                            }
                        }
                    }

                    item.transform.SetParent(connectionContainer.transform, false);
                    item.transform.localScale = Vector3.one;
                    if (networkHandler.Endpoints.Keys.ElementAt(0) == endpoint.hostname)
                    {
                        toggle.isOn = true;
                        _selectedEndpoint = endpoint;
                    }
                }
            });
        }

        private void UpdateConnectionState()
        {
            if (networkHandler.IsConnected())
            {
                CurrentConnectionState = _authenticated ? ConnectionState.Connected : ConnectionState.Authenticating;
            }
            else
            {
                CurrentConnectionState = _showManualControls ? ConnectionState.Manual : ConnectionState.Disconnected;
            }
        }

        private void ToggleManualIPPanel(bool shouldOpen)
        {
            _showManualControls = shouldOpen;
            _manualIPPanel.SetActive(shouldOpen);
        }

        private void OpenCodePanel()
        {
            if (!OpenedFromNUX)
            {
                _steps[1].sprite = _stepDone;
            }

            connectButton.interactable = true;
            connectSpinner.SetActive(false);
            _connectPanel.SetActive(false);
            _codePanel.SetActive(true);
        }

        private void CloseConnectionPanel()
        {
            if (!OpenedFromNUX)
            {
                _projectPanelsHandler.OpenProjectPanel();
            }

            gameObject.SetActive(false);
        }

        public void OpenConnectPanel()
        {
            gameObject.SetActive(true);
            // _progressBar.SetActive(!OpenedFromNUX);
            networkHandler.Disconnect();
            if (!OpenedFromNUX)
            {
                _steps[1].sprite = _stepMissing;
            }

            connectButton.interactable = true;
            connectSpinner.SetActive(false);
            _codePanel.SetActive(false);
            _connectPanel.SetActive(true);
        }

        public void GoBackToConnectPanel()
        {
            if (OpenedFromNUX)
            {
                _nuxHandler.PreviousPanel();
            }

            OpenConnectPanel();
        }

        public void GoBackFromConnectionPanel()
        {
            if (OpenedFromNUX)
            {
                _nuxHandler.PreviousPanel();
            }
            else
            {
                CloseConnectionPanel();
            }
        }

        public void OnConnectClick()
        {
            if (_selectedEndpoint == null)
            {
                return;
            }

            Debug.Log("OnConnectClick");
            connectButton.interactable = false;
            connectSpinner.SetActive(true);
            networkHandler.ConnectToSocket(new SocketClient(_selectedEndpoint));
        }

        public void OnCodeNumberClick(int value)
        {
            if (codeField.text.Length == 4)
            {
                return;
            }

            codeField.text += value.ToString();
            ValidateCode();
        }

        public void OnCodeNumberReturn()
        {
            codeField.text = codeField.text.Substring(0, codeField.text.Length - 1);
            ValidateCode();
        }

        public void OnManualHostClick()
        {
            ToggleManualIPPanel(true);
            UpdateConnectionState();
        }

        public void OnManualCancelClick()
        {
            ToggleManualIPPanel(false);
            UpdateConnectionState();
        }

        public void OnManualConnectClick()
        {
            var ip = string.Join('.', ipAddrFields.Select((f) => f.text));
            if (Utils.IsIPAddressValid(ip))
            {
                PlayerPrefs.SetString("IP_ADDR", ip);
                SocketEndpoint manual = new();
                manual.hostname = ip;
                manual.ip = ip;
                networkHandler.ConnectToSocket(new SocketClient(manual));
            }
        }

        public void OnAuthenticationClick()
        {
            var code = codeField.text;
            if (code.Length == 4)
            {
                networkHandler.SendAuthenticationRequest(code);
            }
        }
    }
}
