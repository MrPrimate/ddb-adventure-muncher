# DDB Adventure Muncher

This is considered Beta software. It does not yet have the polish, documentation or support of a fully released product, and you may encounter bugs/just not work for you.

## How?

The adventure muncher checks with DDB to see what adventures you own and presents a list.

When you select an adventure it will download the data and attempt to extract relevant journals, scenes, and tables for foundry.

It bundles these into a zip file for importing.

All the adventure generation and calls to DDB are done locally. A single call to my DDB proxy is made when you run the proxy with your cobalt token to authenticate to DDB and see if you own the content. If it does it provides some enhancement data to improve things like quality of maps. If you wish to disable this call, add the following setting to your `config.json` file: `"disableEnhancedDownloads": true`.

If you wish to disable the damage tagging on rolls set the config value: `"useDamageHints": false`


## Detailed Guides by Shyvor

* [Foundry 0.7.9](https://cdn.discordapp.com/attachments/830165161104506931/851174356814004284/Adventure_Muncher_Guide_0.7.x.pdf)
* [Foundry 0.8.*](https://cdn.discordapp.com/attachments/830165161104506931/851174358235086878/Adventure_Muncher_Guide_0.8.x.pdf)

## How does this work?

* You will need to import monsters, spells, and items using [DDB Importer](https://foundryvtt.com/packages/ddb-importer/) first.
* When you are happy with the data in your compendiums, you can use the Adventure Config Exporter button to download a config mapping. You can find this in the Experimental tab of the muncher screen if yourrunning Foundry 0.7.9. If you are running 0.8.6 use the Adventure tab.
* This file contains a cobalt cookie value and mappings to the imported compendium entries. The adventure muncher will use these to construct links to the right spells/items etc in Journal entries.

## Download Links

You can download versions for [Mac, PC, and Linux](https://github.com/MrPrimate/ddb-adventure-muncher/releases/latest).
## Importing the book

If using Foundry 0.7.9 you will need to use [Adventure Importer/Exporter Module](https://foundryvtt.com/packages/adventure-import-export/), however this does not yet contain the changes needed to import journal images (as of version 0.6.0). Please install from [`https://raw.githubusercontent.com/mrprimate/adventure-import-export/ddb-release/module.json`](https://raw.githubusercontent.com/mrprimate/adventure-import-export/ddb-release/module.json).

If using Foundry 0.8.6 you can use the DDB Importer Adventure Import option.


## Reset

If you wish to reset your config use the `File -> Reset config` menu item.

The Adventure Module also generates a database of "lookup ids" for you. This is so that when you reimport an adventure it will overwrite the existing Scenes/Journal entries. It's likely in this early development phase you may need to remove this, use the `File -> Reset generated ids` menu item.

### Delete downloads

If you wish to download the content again, rather than using existing downloaded content, delete the folder called `content` in your config directory, or you can use the `File -> Remove downloaded files`.


## Known Issues


### Handouts are not named

Most of the Handouts are un-named because it's hard to parse names - I'll be collecting naming suggestions at some point.


### The muncher hangs when importing.


If the muncher hangs run it in the command line mode:

* Windows users: right click on the application icon on the desktop
* There should be a field called "Target" copy all of the text in there. in mine it's `C:\Users\jack\AppData\Local\Programs\ddb-adventure-muncher\ddb-adventure-muncher.exe`
* If you're using a Mac or Linux you can figure the above out yourself
* In the start menu type "command prompt" and open the command prompt
* Wnter the above command that was copied
* When you click on buttons it should output information to the terminal window. Look for the error.

If you get something like:

```
Please regenerate your config file, unable to find the Monster for Token Homunculus
FATAL ERROR: Error::Error napi_create_reference
```

The monsters you have generated don't have the right information in them for the muncher to link.

You need to have monsters munched in your DDB Importer linked compendiums when you generate the config file.

Fix:

1) Untick generate actors/tokens and live without them on the map.
2) Reimport your monsters using the latest DDB Importer with "Update Existing" checked, then generate a new adventure muncher config file and load.
3) If this still does not work, update monsters with "Use SRD compendium for things" although in the latest version this should not impact things.

### Things don't seem to generate right

* Try clearing your downloaded files: Files -> Remove downloaded files
* Try resetting your Ids: Files -> Reset generated Ids

## FAQ
### Where is the config and downloaded adventure data stored?

You can use `Help -> Config location` menu item to find your config folder.

Likely paths:

* Linux: `~/.config/ddb-adventure-muncher`
* Mac OS: `~/Library/Application Support/ddb-adventure-muncher`
* Windows: `C:\Users\<user>\AppData\Roaming\ddb-adventure-muncher`


### How do I update an existing adventure?

You need to delete (make a backup first) any material you wish to update.
Adventure muncher does not update/replace any existing content in your world.

If you wish to import new scenes alongside existing ones you can use `File -> Reset generated ids` and it will import new scenes, actors, journals etc alongside existing ones.


## Getting Help

* Join us on Discord in the [#adventure-muncher](https://discord.gg/ZZjxEBkqSH) channel.

## Current Scene Support

All books with Scenes should now have notes generated. Please highlight if you find missing Notes/Pins.

You can se the state of scene support at [this spreadsheet](https://docs.google.com/spreadsheets/d/17b4jG2W521N_nFkE1jr2UGEjixHGjHGnEO9eSKhFmwo/edit?usp=sharing).

If you wish to help improve the scene wall and lighting information, see the below section.

## Contribution

### Scene adjustments

* Scenes will export:
  * Links to places notes/pins
  * Information about tokens placed from the DDB Monster Compendium
  * Lights
  * Global illumination
  * Alignment and scaling
  * Walling and doors
  * Drawings

### How?
* You need to be using v1.0.9+ of ddb-importer.
* Open the Chrome Developer Console (F12) and run `game.settings.set("ddb-importer", "allow-scene-download", true)`
* Now when you right click on a scene navigation button you will get the option to download the associated data (DDB Scene Config).
* Fill out the form and upload the json file [here](https://forms.gle/NvyRWdUxi9Dho4As9)

### Stairways module

If you export scenes with stairways data included, that will be added in to the generated scenes.

### Missed parsing

If you find a missing scene, or something has not parsed right please let me know on Discord.

There are a number of handouts/images that are numbered Handout 1/2/3/etc.
If you have a good name for one of these handouts please make a note of it.
I will be starting to collect this information in a shared google sheet in the coming weeks.

## Config


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

## Icons

[Icons by "Chanut is Industries"](https://dribbble.com/Chanut-is) and licensed under [CC Attribution 3.0 Unported](https://creativecommons.org/licenses/by/3.0/).

## Fan Content

The scene adjustments and walling data is released as unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.
