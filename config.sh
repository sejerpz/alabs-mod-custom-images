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
DOCKER_IMAGE=$PLATFORM-dev-complete:latest
DOCKER_NAME=$PLATFORM-dev-$(uuidgen)
fi
DOCKER_SRC_ROOT=/root/source

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
