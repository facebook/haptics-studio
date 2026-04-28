#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# macOS Icon
for ICON_NAME in "AppIcon.iconset" "AppIcon-mac.iconset"
do
  input_filepath="1024x1024.png"
  mkdir $ICON_NAME

  sips -z 16 16     $input_filepath --out "${ICON_NAME}/icon_16x16.png"
  sips -z 32 32     $input_filepath --out "${ICON_NAME}/icon_16x16@2x.png"
  sips -z 32 32     $input_filepath --out "${ICON_NAME}/icon_32x32.png"
  sips -z 64 64     $input_filepath --out "${ICON_NAME}/icon_32x32@2x.png"
  sips -z 128 128   $input_filepath --out "${ICON_NAME}/icon_128x128.png"
  sips -z 256 256   $input_filepath --out "${ICON_NAME}/icon_128x128@2x.png"
  sips -z 256 256   $input_filepath --out "${ICON_NAME}/icon_256x256.png"
  sips -z 512 512   $input_filepath --out "${ICON_NAME}/icon_256x256@2x.png"
  sips -z 512 512   $input_filepath --out "${ICON_NAME}/icon_512x512.png"

  iconutil -c icns $ICON_NAME

  rm -R $ICON_NAME
done

# .hasp Icon
ICON_NAME="ProjectIcon.iconset"
input_filepath="1024x1024_project.png"
mkdir $ICON_NAME

sips -z 16 16     $input_filepath --out "${ICON_NAME}/icon_16x16.png"
sips -z 32 32     $input_filepath --out "${ICON_NAME}/icon_16x16@2x.png"
sips -z 32 32     $input_filepath --out "${ICON_NAME}/icon_32x32.png"
sips -z 64 64     $input_filepath --out "${ICON_NAME}/icon_32x32@2x.png"
sips -z 128 128   $input_filepath --out "${ICON_NAME}/icon_128x128.png"
sips -z 256 256   $input_filepath --out "${ICON_NAME}/icon_128x128@2x.png"
sips -z 256 256   $input_filepath --out "${ICON_NAME}/icon_256x256.png"
sips -z 512 512   $input_filepath --out "${ICON_NAME}/icon_256x256@2x.png"
sips -z 512 512   $input_filepath --out "${ICON_NAME}/icon_512x512.png"

iconutil -c icns $ICON_NAME

rm -R $ICON_NAME

# .haptic Icon
ICON_NAME="HapticIcon.iconset"
input_filepath="1024x1024_haptic.png"
mkdir $ICON_NAME

sips -z 16 16     $input_filepath --out "${ICON_NAME}/icon_16x16.png"
sips -z 32 32     $input_filepath --out "${ICON_NAME}/icon_16x16@2x.png"
sips -z 32 32     $input_filepath --out "${ICON_NAME}/icon_32x32.png"
sips -z 64 64     $input_filepath --out "${ICON_NAME}/icon_32x32@2x.png"
sips -z 128 128   $input_filepath --out "${ICON_NAME}/icon_128x128.png"
sips -z 256 256   $input_filepath --out "${ICON_NAME}/icon_128x128@2x.png"
sips -z 256 256   $input_filepath --out "${ICON_NAME}/icon_256x256.png"
sips -z 512 512   $input_filepath --out "${ICON_NAME}/icon_256x256@2x.png"
sips -z 512 512   $input_filepath --out "${ICON_NAME}/icon_512x512.png"

iconutil -c icns $ICON_NAME

rm -R $ICON_NAME

# Windows Icon
ICON_NAME="AppIcon-win.iconset"
input_filepath="1024x1024_win.png"
mkdir $ICON_NAME

sips -z 16 16     $input_filepath --out "${ICON_NAME}/icon_16x16.png"
sips -z 32 32     $input_filepath --out "${ICON_NAME}/icon_16x16@2x.png"
sips -z 32 32     $input_filepath --out "${ICON_NAME}/icon_32x32.png"
sips -z 64 64     $input_filepath --out "${ICON_NAME}/icon_32x32@2x.png"
sips -z 128 128   $input_filepath --out "${ICON_NAME}/icon_128x128.png"
sips -z 256 256   $input_filepath --out "${ICON_NAME}/icon_128x128@2x.png"
sips -z 256 256   $input_filepath --out "${ICON_NAME}/icon_256x256.png"
sips -z 512 512   $input_filepath --out "${ICON_NAME}/icon_256x256@2x.png"
sips -z 512 512   $input_filepath --out "${ICON_NAME}/icon_512x512.png"

iconutil -c icns $ICON_NAME

rm -R $ICON_NAME
