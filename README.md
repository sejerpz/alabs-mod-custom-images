# About these MOD Custom Images (Starless)

Starless images are available for the **MOD Dwarf**, the **MOD Duo X** and the **MOD Duo**.

I appreciate the MOD devices for their versatility and endless configurability.  
However, some features are still missing.  

Thanks to MOD Audio, most of the software stack is open source.  
This creates an opportunity to extend the system and address these gaps.  

## Improvements in this image

This custom image introduces the following enhancements:

- **Port grouping** added lv2 port grouping extension to mod-ui host
- **New performance view**  
- **Plugin labeling**  
- **Extended control** over which parameters are included in snapshots  
- **On-device editing** of pedalboard parameters directly from the Dwarf and the Duo X
- **Display widgets**: plugins draw on the display of the Dwarf and the Duo X
- **WiFi access point** with a USB WiFi dongle, on all three devices

  and many other, read the wiki for the complete list

## Documentation

For more details and to know how to use the new the features included read the [wiki](https://github.com/sejerpz/alabs-mod-custom-images/wiki)

# How to Install the Starless image

To test this new image, follow the standard update procedure of your device as described in the official documentation:

🔗 [Official MOD Releases Guide](https://wiki.mod.audio/wiki/Releases)

## Installation Steps

1. Read the **manual update procedure** on the documentation page.  
2. Put your device into **update mode** as described.  
3. Follow the instructions provided in the guide.  
   - **Important:** Instead of downloading a standard image, download the latest **Starless image of your device** (`moddwarf-…`, `modduox-…` or `modduo-…`) from the releases of this git repository [aLabs Releases](https://github.com/sejerpz/alabs-mod-custom-images/releases).

## Reverting to an Official Image

If you decide not to use this firmware image anymore:

1. Repeat the update process.  
2. This time, select and install an **official MOD image** from the official releases.

# Versioning

The images adopt a simple monotone version convention: each release is tagged with a progressive version number.

`v{base mod image version}-stls{version number}`

For example:

`v1.14.0.3370-stls19`

base mod image version: **1.14.0.3370**
stls version: **19**

# Building the image

The image is made by `create-image` from an official MOD image: it builds mod-ui,
mod-host, mod-system-control and the HMI firmware from the submodules, puts them in the system of the
official image together with the aLabs components (diagnostics, WiFi access point)
and packs a new image. On the Duo it also replaces the libcrypto of the image with
the same OpenSSL release built with `-marm`: the one of MOD has its ARM assembly
built as Thumb-2 and computes AES and SHA-256 wrong (WPA2, HTTPS certificates).

Requirements, build environment and usage are described in the
[Build a custom image](https://github.com/sejerpz/alabs-mod-custom-images/wiki/Build-a-custom-image)
page of the wiki.

# Use of AI

Parts of this project, code and documentation, may be written with the help of AI tools,
mainly Claude by Anthropic. Every change is read and reviewed by a human developer before it
is committed, and the maintainer is responsible for it like for any other code. AI tools are
not credited as authors in the commit history.
