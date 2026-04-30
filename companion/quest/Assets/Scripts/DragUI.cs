// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using UnityEngine;

namespace HapticStudio
{
    public class DragUI : MonoBehaviour
    {
        public Transform rightPointer;
        public Transform leftPointer;

        public GameObject panel;
        public GameObject sidePanel;
        public GameObject tweaksPanel;

        private float _sidePanelGap = 0;
        private float _tweaksPanelGap = 0;
        private OVRInput.Hand _activeHand;

        private void Awake()
        {
            // Store the initial gap between panels
            _sidePanelGap = 360 - sidePanel.transform.eulerAngles.y;
            _tweaksPanelGap = 360 - tweaksPanel.transform.eulerAngles.y;
        }

        public void BeginDrag()
        {
            panel.transform.position = new Vector3(panel.transform.position.x, panel.transform.position.y, -0.05f);
            sidePanel.transform.position = new Vector3(sidePanel.transform.position.x, sidePanel.transform.position.y, -0.05f);
            tweaksPanel.transform.position = new Vector3(tweaksPanel.transform.position.x, tweaksPanel.transform.position.y, -0.05f);

            // Check which hand started the drag gesture
            if (OVRInput.GetDown(OVRInput.Button.Three) || OVRInput.Get(OVRInput.RawAxis1D.LIndexTrigger) > 0)
            {
                _activeHand = OVRInput.Hand.HandLeft;
            }
            if (OVRInput.GetDown(OVRInput.Button.One) || OVRInput.Get(OVRInput.RawAxis1D.RIndexTrigger) > 0)
            {
                _activeHand = OVRInput.Hand.HandRight;
            }
        }

        public void Drag()
        {
            // Note: Pointers have a different point of reference, so the angle must be inverted
            var angle = _activeHand == OVRInput.Hand.HandRight ? rightPointer.eulerAngles.y : leftPointer.eulerAngles.y;
            panel.transform.eulerAngles = new Vector3(0, angle - 360, 0);
            sidePanel.transform.eulerAngles = new Vector3(0, angle - 360 - _sidePanelGap, 0);
            tweaksPanel.transform.eulerAngles = new Vector3(0, angle - 360 - _tweaksPanelGap, 0);
        }

        public void EndDrag()
        {
            panel.transform.position = new Vector3(panel.transform.position.x, panel.transform.position.y, 0f);
            sidePanel.transform.position = new Vector3(sidePanel.transform.position.x, sidePanel.transform.position.y, 0f);
            tweaksPanel.transform.position = new Vector3(tweaksPanel.transform.position.x, tweaksPanel.transform.position.y, 0f);
        }
    }
}
