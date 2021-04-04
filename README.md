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

* [Linux](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.0.1.AppImage)
* [Windows](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.0.1.exe)
* [Mac](https://artifacts.ddb.mrprimate.co.uk/adventure/djriws2/alpha/ddb-adventure-muncher-0.0.1-mac.zip)

## Importing the book

You will need to use [Adventure Importer/Exporter Module](https://foundryvtt.com/packages/adventure-import-export/), however this does not yet contain the changes needed to import journal images (as of version 0.6.0). Please install from [`https://raw.githubusercontent.com/mrprimate/adventure-import-export/ddb-release/module.json`](https://raw.githubusercontent.com/mrprimate/adventure-import-export/ddb-release/module.json).

## Where is the config and downloaded adventure data stored?

You can use `Help -> Config location` to find your config folder. If you wish to download the content again, rather than using existing downloaded content, delete the folder called `content` here.

Likely paths:

* Linux: `~/.config/ddb-adventure-importer`
* Mac OS: `~/Library/Application Support/ddb-adventure-importer`
* Windows: `C:\Users\<user>\AppData\Roaming\ddb-adventure-importer`

## Contribution

* If you wish to add walls/lighting information you can turn on a setting in Foundry to allow you to support data from a supported map. (VTTA or ddb-adventure-muncher).
* Open the Chrome Developer Console (F12) and run `game.settings.get("ddb-importer", "allow-scene-download")`
* Now when you right click on a scene navigation button you will get the option to download the associated data.


## Icons

[Icons by "Chanut is Industries"](https://dribbble.com/Chanut-is) and licensed under [CC Attribution 3.0 Unported](https://creativecommons.org/licenses/by/3.0/).

