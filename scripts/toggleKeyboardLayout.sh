#!/bin/bash

hyprctl switchxkblayout current next

new_layout=$(hyprctl devices -j | jq -r '
    (.keyboards[] | select(.main == true).active_keymap) //
    (.keyboards[-1].active_keymap)
')

notify-send "Keyboard Layout" "Changed to: $new_layout"

