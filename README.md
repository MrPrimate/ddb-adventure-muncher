# DDB Adventure Importer Alpha

Please do not share this link with other people.

## How does this work?

* You will need to import monsters, spells, and items using DDB Importer first.
* When you are happy with the data in your compendiums, you can use the ~~Adventure Config Exporter button~~ _not available in alpha_ to download a config mapping. In alpha you can open the Chrome Developer Console (F12) and run the following instead:
```shell
generateAdventureConfig()
```
* This file contains a cobalt cookie value and mappings to the imported compendium entries. The adventure muncher will use these to construct links to the right spells/items etc in Journal entries.

## Alpha Download Links

* [Linux AppImage](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.0.3-linux-x86_64.AppImage)
* [Linux RPM](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.0.3-linux-x86_64.rpm)
* [Linux DEB](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.0.3-linux-amd64.deb)
* [Windows Installer](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.0.3-win.exe)
* [Mac](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.0.3-mac.zip)

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

## Current Scene Support

Books with Aligned, Walled, and Lit scenes:

* Lost Mines of Phandelver.

If you wish to help improve the scene wall and lighting information, see the below section.

## Contribution

### Walls and Lighting information

* If you wish to add walls/lighting information you can turn on a setting in Foundry to allow you to support data from a supported map. (VTTA or ddb-adventure-muncher).
* Open the Chrome Developer Console (F12) and run `game.settings.get("ddb-importer", "allow-scene-download")`
* Now when you right click on a scene navigation button you will get the option to download the associated data.
* Upload this to the #scene-adjustments channel on Discord with a description of your changes.

### Missed parsing

If you find a missing scene, or something has just not parsed right please let me know on Discord.

There are a number of handouts/images that are just numbered Handout 1/2/3/etc.
If you have a good name for one of these handouts please make a note of it.
I will be starting to collect this information in a shared google sheet in the coming weeks.


## Icons

[Icons by "Chanut is Industries"](https://dribbble.com/Chanut-is) and licensed under [CC Attribution 3.0 Unported](https://creativecommons.org/licenses/by/3.0/).

