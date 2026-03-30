#!/bin/bash
# Create simple colored square icons for PWA
convert -size 192x192 xc:#3b82f6 -gravity center -pointsize 72 -fill white -annotate +0+0 "RV2" icon-192.png 2>/dev/null || echo "ImageMagick not installed, creating placeholder"
convert -size 512x512 xc:#3b82f6 -gravity center -pointsize 200 -fill white -annotate +0+0 "RV2" icon-512.png 2>/dev/null || echo "Creating simple placeholder"
