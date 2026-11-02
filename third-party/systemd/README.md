# systemd headers

`include/systemd/sd-daemon.h` and `_sd-common.h` from systemd v219, the version of
libsystemd in the MOD images (LGPL-2.1+, see the headers).

The build environment has no libsystemd: mod-system-control is compiled with these
headers and linked against the libsystemd of the base image, which `create-image`
extracts into `deps/`, so it notifies systemd like the official build does.
