# Introduction
Codbot is a bot which works similar to [BigBrotherBot](https://github.com/BigBrotherBot/big-brother-bot/), written in JavaScript, in hopes of a performance boost along with a bit more ease in plugin development.

# Limitations (at the moment)
- Since some features of [Node FS](https://nodejs.org/dist/latest-v14.x/docs/api/fs.html#fs_caveats) aren't supported, bot isn't expected to work on Windows as intended.
- HTTP/FTP reading of log isn't supported. Logfile has to be locally available.

# Requirements
- Latest [NodeJS](https://nodejs.org/en/)(v16.4.2 atm)
- Linux/MAC OS
- Permission to read logfile locally available

# How to Install (Linux)
- Install Git and Latest NodeJS:
    ```
    sudo apt update

    sudo apt-get -y install git curl dirmngr apt-transport-https lsb-release ca-certificates

    curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -

    sudo apt-get -y install nodejs

    sudo apt-get update
    ```
- Clone Repository and Navigate to it:
    ```
    git clone "https://github.com/Zoro-6191/codbot"

    cd codbot
    ```
- Install and Update all Dependancies:
    ```
    npm install
    npm update
    ```

# Configure
- Navigate to _conf_ folder. Every file with extension `.ini` is configurable, and is pretty explainatory.

# Run
- Navigate to repository path, and type this in console:
    ```
    node run.js
    ```