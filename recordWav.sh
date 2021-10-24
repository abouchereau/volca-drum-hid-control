#!/bin/bash

now=$(date +"%Y%m%d_%H%M%S")
gnome-terminal --geometry=32x4+50+10 -- bash -c "arecord -f cd ~/Musique/in_$now.wav"