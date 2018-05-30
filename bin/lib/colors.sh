#!/usr/bin/env bash

red=$(tput setaf 1)
green=$(tput setaf 2)
yellow=$(tput setaf 3)
lila=$(tput setaf 4)
pink=$(tput setaf 5)
blue=$(tput setaf 6)
white=$(tput setaf 7)
black=$(tput setaf 8)

bg_red=$(tput setab 1)
bg_green=$(tput setab 2)
bg_yellow=$(tput setab 3)
bg_lila=$(tput setab 4)
bg_pink=$(tput setab 5)
bg_blue=$(tput setab 6)
bg_white=$(tput setab 7)
bg_black=$(tput setab 8)

bold=$(tput bold)
reset=$(tput sgr0)

# Indicators
heading()
{
    echo "${lila}⠳${reset}${bold} $1${reset}"
}

success()
{
    echo "${green}⠳${reset}${bold} $1${reset}"
}

info()
{
    echo "${blue}⠳${reset}${bold} $1${reset}"
}

warning()
{
    echo "${yellow}⠳${reset}${bold} $1${reset}"
}

error()
{
    echo "${red}⠳${reset}${bold} $1${reset}"
}

# Solid Headings
heading_solid()
{
    echo "${bg_black}${lila}==>${reset}${bg_black}${bold} $1${reset}"
}

success_solid()
{
    echo "${bg_black}${green}==>${bold} $1${reset}"
}

info_solid()
{
    echo "${bg_black}${blue}==>${bold} $1${reset}"
}

warning_solid()
{
    echo "${bg_black}${yellow}==>${bold} $1${reset}"
}

error_solid()
{
    echo "${bg_black}${red}==>${bold} $1${reset}"
}

# Transparent Headings
heading_transparent()
{
    echo "${lila}==>${reset}${bold} $1${reset}"
}

success_transparent()
{
    echo "${green}==>${reset}${bold} $1${reset}"
}

info_transparent()
{
    echo "${blue}==>${reset}${bold} $1${reset}"
}

warning_transparent()
{
    echo "${yellow}==>${reset}${bold} $1${reset}"
}

error_transparent()
{
    echo "${red}==>${reset}${bold} $1${reset}"
}

# Colored Text
text_red()
{
    echo "${red}$1${reset}"
}

text_green()
{
    echo "${green}$1${reset}"
}

text_yellow()
{
    echo "${yellow}$1${reset}"
}

text_lila()
{
    echo "${lila}$1${reset}"
}

text_pink()
{
    echo "${pink}$1${reset}"
}

text_blue()
{
    echo "${blue}$1${reset}"
}

text_white()
{
    echo "${white}$1${reset}"
}

text_black()
{
    echo "${black}$1${reset}"
}

# Styles
text_bold()
{
    echo "${bold}"
}

text_reset()
{
    echo "${reset}"
}

# Helpers
divider()
{
    echo
    text_red "    ==============================================================="
    echo
}
