// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

using UnityEngine;

public class Spinner : MonoBehaviour
{
    private RectTransform rectComponent;
    private const float Speed = -300f;

    private void Start()
    {
        rectComponent = GetComponent<RectTransform>();
    }

    private void Update()
    {
        rectComponent.Rotate(0f, 0f, Speed * Time.deltaTime);
    }
}
