FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    genisoimage \
    syslinux-utils \
    xorriso \
    isolinux \
    nodejs \
    npm \
    git

# Set working directory
WORKDIR /build

# Copy SecureWipe source
COPY . /build/securewipe/

# Download Ubuntu ISO
RUN wget -O ubuntu-22.04.5-desktop-amd64.iso \
    https://releases.ubuntu.com/22.04/ubuntu-22.04.5-desktop-amd64.iso

# Create build script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Extract Ubuntu ISO\n\
mkdir -p /tmp/iso-mount /tmp/iso-extract\n\
mount -o loop ubuntu-22.04.5-desktop-amd64.iso /tmp/iso-mount\n\
cp -rT /tmp/iso-mount /tmp/iso-extract\n\
umount /tmp/iso-mount\n\
chmod -R +w /tmp/iso-extract\n\
\n\
# Install SecureWipe\n\
mkdir -p /tmp/iso-extract/home/securewipe\n\
cp -r /build/securewipe/* /tmp/iso-extract/home/securewipe/\n\
\n\
# Create autostart\n\
mkdir -p /tmp/iso-extract/etc/skel/.config/autostart\n\
cp /build/securewipe/autostart.desktop /tmp/iso-extract/etc/skel/.config/autostart/\n\
\n\
# Create new ISO\n\
cd /tmp/iso-extract\n\
mkisofs -D -r -V "SecureWipe Live" -cache-inodes -J -l \\\n\
    -b isolinux/isolinux.bin -c isolinux/boot.cat \\\n\
    -no-emul-boot -boot-load-size 4 -boot-info-table \\\n\
    -o /output/securewipe-live.iso .\n\
\n\
echo "SecureWipe ISO created: /output/securewipe-live.iso"\n\
' > /build/create-iso.sh && chmod +x /build/create-iso.sh

# Create output directory
RUN mkdir -p /output

CMD ["/build/create-iso.sh"]