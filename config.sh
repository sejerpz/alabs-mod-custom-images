# configuration script

# custom MOD PLUGIN BUILDER workdir inside docker build environment
# usually leave not set
# WORKDIR=/home/andrea/Alab/Devel/mod/

# platform to build eg moddwarf-new
PLATFORM=$1

# where the alabs scripts are located
ALABS_ROOT=$(pwd)
ALABS_DIR=$(basename $ALABS_ROOT)

# where the sources are mapped inside docker build environment
if [ -f /.dockerenv ]; then
DOCKER_IMAGE='(inside docker container)'
DOCKER_NAME='-'
else
# ALABS_DOCKER_IMAGE: another build image for a single build (e.g. one with more libraries)
DOCKER_IMAGE=${ALABS_DOCKER_IMAGE:-$PLATFORM:latest}
DOCKER_NAME=$PLATFORM-$(uuidgen)
fi
DOCKER_SRC_ROOT=/root/source

# alabs-mod-wifi binary release (driver, firmware, wifi-ap): the image gets the
# archive alabs-mod-wifi-<version>-<platform>.tar.gz of the GitHub release
# v<version>, and only if it has the sha256 below (see "Binary release" in the
# alabs-mod-wifi README). Empty sha256: no release for that platform, the image
# is built without WiFi access point.
ALABS_MOD_WIFI_VERSION=0.2.0
declare -A ALABS_MOD_WIFI_SHA256=(
	[moddwarf]=399c1a113fd83f17840e2c71515a8bd78d0e4e4fc4b38ea57f491659fdd2f386
	[modduox]=931ad0c8a62b49b9789ba2ee10d97099e4b5c55ef67a7f5b28f1265bec93569c
	[modduo]=ddf79cf22ccf4d3d61471f4921003d4953f5ed8ec19d09afc175c6f1e4f099d5
)

# OpenSSL of the Duo image: its libcrypto has the ARM assembly built as Thumb-2,
# and AES and SHA-256 come out wrong (WPA2 handshake, HTTPS certificates).
# build-mod-binaries builds the same release with -marm and the image gets its
# libcrypto. Empty sha256: the image keeps the libcrypto of MOD.
ALABS_OPENSSL_VERSION=1.0.2g
ALABS_OPENSSL_SHA256=b784b1b3907ce39abf4098702dade6365522a253ad1552e267a9a0e89594aa33

# "Report a problem" of the web interface: the forum topic its link opens.
# Written in the image as MOD_FEEDBACK_URL of mod-ui (a systemd drop-in); empty:
# mod-ui keeps its default, the Beta Testing category of the MOD forum
ALABS_FEEDBACK_URL=https://forum.mod.audio/t/starless-by-alabs-development/12853

echo 'Configuration:'
# tag is a special command
if [ "$PLATFORM" != "tag" ]; then
echo '   PLATFORM.........: ' $PLATFORM
fi
echo '   ALABS_ROOT.......: ' $ALABS_ROOT
echo '   ALABS_DIR........: ' $ALABS_DIR
echo '   DOCKER_IMAGE.....: ' $DOCKER_IMAGE
echo '   DOCKER_NAME......: ' $DOCKER_NAME
echo '   DOCKER_SRC_ROOT..: ' $DOCKER_SRC_ROOT
echo '-----------------------------------------------------------------------------'
echo ' '
