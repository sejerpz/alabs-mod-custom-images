# About this MOD Dwarf Custom Image

I appreciate the MOD Dwarf for its versatility and endless configurability.  
However, some features are still missing.  

Thanks to MOD Audio, most of the software stack is open source.  
This creates an opportunity to extend the system and address these gaps.  

## Improvements in this image

This custom image introduces the following enhancements:

- **Port grouping** added lv2 port grouping extension to mod-ui host
- **New performance view**  
- **Plugin labeling**  
- **Extended control** over which parameters are included in snapshots  
- **On-device editing** of pedalboard parameters directly from the Dwarf

  and many other, read the wiki for the complete list

## Documentation

For more details and to know how to use the new the features included read the [wiki](https://github.com/sejerpz/alabs-mod-custom-images/wiki)

# How to Install the MOD Dwarf aLabs image

To test this new image, follow the standard update procedure for the MOD Dwarf as described in the official documentation:

🔗 [Official MOD Dwarf Releases Guide](https://wiki.mod.audio/wiki/Releases)

## Installation Steps

1. Read the **manual update procedure** on the documentation page.  
2. Put your Dwarf into **update mode** as described.  
3. Follow the instructions provided in the guide.  
   - **Important:** Instead of downloading a standard image, download the latest **MOD Dwarf aLabs image** from the releases of this git repository [aLabs Releases](https://github.com/sejerpz/alabs-mod-custom-images/releases).

## Reverting to an Official Image

If you decide not to use this firmware image anymore:

1. Repeat the update process.  
2. This time, select and install an **official MOD image** from the official releases.

# Versioning

The images adopt a simple monotone version convention: each release is tagged with a progressive version number.

`v{base mod image version}-stls{version number}`

For example:

`v1.13.5.3315-stls17`

base mod image version: **1.13.5.3315**
stls version: **17**

# Building the image

The image is made by `create-image` from an official MOD image: it builds mod-ui,
mod-host and the HMI firmware from the submodules, puts them in the system of the
official image together with the aLabs components (diagnostics, WiFi access point)
and packs a new image.

Requirements, build environment and usage are described in the
[Build a custom image](https://github.com/sejerpz/alabs-mod-custom-images/wiki/Build-a-custom-image)
page of the wiki.
