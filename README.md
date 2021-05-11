# DDB Adventure Muncher Beta

This is a Beta release for Patreon Supporters. It will be available more widely soon, until then, please don't share this link.

## How?

The adventure muncher checks with DDB to see what adventures you own and presents a list.

When you select an adventure it will download the data and attempt to extract relevant journals, scenes, and tables for foundry.

It bundles these into a zip file for importing.

All the adventure generation and calls to DDB are done locally. A single call to my DDB proxy is made when you run the proxy with your cobalt token to authenticate to DDB and see if you own the content. If it does it provides some enhancement data to improve things like quality of maps. If you wish to disable this call, add the following setting to your `config.json` file: `"disableEnhancedDownloads": true`.

If you wish to disable the damage tagging on rolls set the config value: `"useDamageHints": false`


## How does this work?

* You will need to import monsters, spells, and items using [DDB Importer](https://foundryvtt.com/packages/ddb-importer/) first.
* When you are happy with the data in your compendiums, you can use the Adventure Config Exporter button to download a config mapping. You can find this in the Experimental tab of the muncher screen if your supporter tier can access the alpha and are using v0.6.25+ of DDB Importer. You should be using ddb-importer version 1.0.0+ for the best experience with these generated adventures.
* This file contains a cobalt cookie value and mappings to the imported compendium entries. The adventure muncher will use these to construct links to the right spells/items etc in Journal entries.

## Alpha Download Links

* [Linux AppImage](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.1.3-linux-x86_64.AppImage)
* [Linux RPM](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.1.3-linux-x86_64.rpm)
* [Linux DEB](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.1.3-linux-amd64.deb)
* [Windows Installer](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.1.3-win.exe)
* [Mac](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.1.3-mac.dmg)

## Importing the book

You will need to use [Adventure Importer/Exporter Module](https://foundryvtt.com/packages/adventure-import-export/), however this does not yet contain the changes needed to import journal images (as of version 0.6.0). Please install from [`https://raw.githubusercontent.com/mrprimate/adventure-import-export/ddb-release/module.json`](https://raw.githubusercontent.com/mrprimate/adventure-import-export/ddb-release/module.json).


## Config
### Where is the config and downloaded adventure data stored?

You can use `Help -> Config location` menu item to find your config folder.

Likely paths:

* Linux: `~/.config/ddb-adventure-muncher`
* Mac OS: `~/Library/Application Support/ddb-adventure-muncher`
* Windows: `C:\Users\<user>\AppData\Roaming\ddb-adventure-muncher`

## Reset

If you wish to reset your config use the `File -> Reset config` menu item.

The Adventure Module also generates a database of "lookup ids" for you. This is so that when you reimport an adventure it will overwrite the existing Scenes/Journal entries. It's likely in this early development phase you may need to remove this, use the `File -> Reset generated ids` menu item.

### Delete downloads

If you wish to download the content again, rather than using existing downloaded content, delete the folder called `content` in your config directory, or you can use the `File -> Remove downloaded files`.

## Command Line

If you want to use the app as a command line tool, you can:

```shell
❯ ./ddb-adventure-muncher --help
./ddb-adventure-muncher <command> [options]

Commands:
  ddb-adventure-muncher version   Version information
  ddb-adventure-muncher list      List books
  ddb-adventure-muncher download  Download all the book files you have.
                                  This does not process the book, just downloads
                                  for later use.
  ddb-adventure-muncher generate  Generate content for specified book.
  ddb-adventure-muncher config    Load a config file into the importer.

Options:
  -o, --show-owned-books  Show only owned books, not shared.
      --help              Show help                                    [boolean]
  -v, --version           Show version number                          [boolean]

Examples:
  ddb-adventure-muncher generate lmop  Generate import file for Lost Mines of
                                       Phandelver
```

## Known Issues

* Most of the Handouts are un-named because it's hard to parse names - I'll be collecting naming suggestions at some point.
* There are limited entries for pins on the map right now.
* There are no actors placed on the scene right now.

## Getting Help

* Join us on Discord in the [#adventure-muncher](https://discord.gg/ZZjxEBkqSH) channel.

## Current Scene Support

Books with Aligned, Walled, Lit scenes with Note placed:

* Lost Mines of Phandelver

Books with Aligned, Walled and Lit scenes with Notes not on scenes:

* Curse of Strahd
* The Hidden Shrine of Tamoachan
* Rick and Morty

Books with notes:

* Acquisitions Incorporated
* Princes of the Apocalypse
* Against the Giants
* Baldur's Gate: Descent into Avernus
* Candlekeep Mysteries
* Divine Contention
* Dragon of Icespire Peak
* Frozen Sick
* Ghosts of Saltmarsh
* Hoard of the Dragon Queen
* Icewind Dale Rime of the Frostmaiden
* Out of the Abyss
* Rise of Tiamat
* Sleeping Dragons Wake
* Storm Kings Thuder
* Storm Lord's Wrath
* Explorers Guide to Wildemount
* The Tortle Package
* Tomb of Horrors
* The Sunless Citadel
* White Plume Mountain
* Dead in Thay
* Tomb of Annihilation
* Waterdeep: Dragon Heist
* Waterdeep: Dungeon of the Mad Mage

Books with partial scene adjustments:

* Icewind Dale: Rime of the Frost Maiden
* Dragon of Icespire Peak
* Divine Contention
* Princes of the Apocalypse
* Baldur's Gate: Descent into Avernus
* Candlekeep Mysteries
* The Forge of Fury

If you wish to help improve the scene wall and lighting information, see the below section.

## Contribution

### Walls and Lighting information

* If you wish to add walls/lighting information you can turn on a setting in Foundry to allow you to support data from a supported map. (VTTA or ddb-adventure-muncher).
* You need to be using v1.0.1+ of ddb-importer.
* Open the Chrome Developer Console (F12) and run `game.settings.set("ddb-importer", "allow-scene-download", true)`
* Now when you right click on a scene navigation button you will get the option to download the associated data (DDB Scene Config).
* Upload this to the #scene-adjustments channel on Discord with a description of your changes.

### Missed parsing

If you find a missing scene, or something has not parsed right please let me know on Discord.

There are a number of handouts/images that are numbered Handout 1/2/3/etc.
If you have a good name for one of these handouts please make a note of it.
I will be starting to collect this information in a shared google sheet in the coming weeks.


## Icons

[Icons by "Chanut is Industries"](https://dribbble.com/Chanut-is) and licensed under [CC Attribution 3.0 Unported](https://creativecommons.org/licenses/by/3.0/).

## Fan Content

The scene adjustments and walling data is released as unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.
