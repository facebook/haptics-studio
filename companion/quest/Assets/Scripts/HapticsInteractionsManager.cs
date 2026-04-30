// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using System.Collections.Generic;
using Oculus.Haptics;
using Oculus.Interaction;
using Oculus.Interaction.Feedback;
using Oculus.Interaction.Input;
using UnityEngine;
using Controller = Oculus.Haptics.Controller;

public class HapticsInteractionsManager : MonoBehaviour
{
    [SerializeField] private HapticClip hoverClip, pressClip;

    private HapticClipPlayer _hoverHapticPlayer;
    private HapticClipPlayer _pressHapticPlayer;

    private readonly List<string> _ignoredGameObjects = new() { "Clip", "ISDK" };

    private void Awake()
    {
        Initialize();
    }

    private void Initialize()
    {
        _hoverHapticPlayer = new HapticClipPlayer(hoverClip);
        _hoverHapticPlayer.priority = 250;
        _pressHapticPlayer = new HapticClipPlayer(pressClip);
        _pressHapticPlayer.priority = 240;
    }

    private void OnEnable()
    {
        InteractionBroadcaster.OnEventRaised += HandleInteractionEvent;
    }

    private void OnDisable()
    {
        InteractionBroadcaster.OnEventRaised -= HandleInteractionEvent;
    }

    private void HandleInteractionEvent(InteractionEvent interactionEvent)
    {
        string gameObjectName = interactionEvent._source.name;
        foreach (string value in _ignoredGameObjects)
        {
            if (gameObjectName.Contains(value))
            {
                return;
            }
        }

        int interactorId = interactionEvent.InteractorView?.Identifier ?? interactionEvent._pointerId;
        switch (interactionEvent._type)
        {
            case InteractionType.UIHoverStart:
            case InteractionType.HoverStart:
                PlayHaptic(interactorId, _hoverHapticPlayer);
                break;
            case InteractionType.UISelectStart:
            case InteractionType.SelectStart:
                PlayHaptic(interactorId, _pressHapticPlayer);
                break;
        }
    }

    private void PlayHaptic(int interactorId, HapticClipPlayer hapticClipPlayer)
    {
        Controller hapticsController = Controller.Both;

        if (InteractorControllerDecorator.TryGetControllerForInteractorId(interactorId, out var controller))
        {
            hapticsController = controller.Handedness == Handedness.Left ? Controller.Left : Controller.Right;
        }

        hapticClipPlayer.Play(hapticsController);
    }
}
