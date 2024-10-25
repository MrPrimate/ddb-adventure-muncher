![Downloads of latest release](https://img.shields.io/github/downloads/MrPrimate/ddb-adventure-muncher/latest/total?label=Downloads%20of%20latest%20release&style=for-the-badge)

# DDB Adventure Muncher

Run your D&D Beyond Adventures in Foundry VTT!

## Getting Started

Please read the [Documentation](https://docs.ddb.mrprimate.co.uk/docs/adventure-muncher/overview).

## Download Links

You can download versions for [Mac, PC, and Linux](https://github.com/MrPrimate/ddb-adventure-muncher/releases/latest).

## Getting Help

* Join us on Discord in the [#adventure-muncher](https://discord.gg/ZZjxEBkqSH) channel.

## Current Scene Support

All books with Scenes should now have notes generated. Please highlight if you find missing Notes/Pins.

You can see the state of scene support at [this page](https://docs.ddb.mrprimate.co.uk/status.html).

If you wish to help improve the scene wall and lighting information, see the [contributing page](https://docs.ddb.mrprimate.co.uk/docs/adventure-muncher/contributing).

## Contribution

See [contributing page](https://docs.ddb.mrprimate.co.uk/docs/adventure-muncher/contributing).

## How?

The adventure muncher checks with DDB to see what adventures you own and presents a list.

When you select an adventure it will download the data and attempt to extract relevant journals, scenes, and tables for foundry.

It bundles these into a zip file for importing.

All the adventure generation and calls to DDB are done locally. A single call to my DDB proxy is made when you run the proxy with your cobalt token to authenticate to DDB and see if you own the content. If it does it provides some enhancement data to improve things like quality of maps. If you wish to disable this call, add the following setting to your `config.json` file: `"disableEnhancedDownloads": true`.

If you wish to disable the damage tagging on rolls set the config value: `"useDamageHints": false`

## How does this work?

* You will need to import monsters, spells, and items using [DDB Importer](https://foundryvtt.com/packages/ddb-importer/) first.
* When you are happy with the data in your compendiums, you can use the Adventure Config Exporter button to download a config mapping.
You can find this in the Adventure tab.
* This file contains a cobalt cookie value and mappings to the imported compendium entries.
The adventure muncher will use these to construct links to the right spells/items etc in Journal entries.

## Known Issues

See the [FAQ section](https://docs.ddb.mrprimate.co.uk/docs/faqs/adventure-muncher).

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

The scene adjustments and walling data is released as unofficial Fan Content permitted under the Fan Content Policy.
Not approved/endorsed by Wizards.
Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.
