# 0.1.8

* Loads moar ToA scenes (Thanks @michaelko777#7952 !)
* Missing Scene notes for ToA Chapter 5.

# 0.1.7

* WDH Scenes started (Thanks @maadonna#6222 !)
* Some ToA scenes (Thanks @michaelko777#7952 !)
* ToA now parses Locations in Chult map scene.
* BGDiA maps (Thanks @Shyvor#3596 !)
* Improved memory usage for books with a lot of tables like DMG and XGtE.
* If the config value `generateTokens: true` is set the muncher will generate some token stubs in the adventure. These will only work when importing the adventure through version 2.0.7+ of ddb-importer in Foundry 0.8.5+. Currently only LMOP Cragmaw Hideout has any token data set.

# 0.1.6

* PotA Moar maps. (Thanks @Zac !)
* WPM done (Thanks @maadonna !)
* Start of ToA scene fixing (Thanks @michaelko777 !)
* TSC had a missing scene (sorry ygg!)
* In some instances replaced rolls, typically in treasure, broke the text.
* GoS scene added (thanks @CussaMitre !)
* Stairways module support for Scene import.
* Some ToA scenes (THanks @michaelko777 !)
* Add VRGtR.

# 0.1.5

* TSC mapped, walled, pinned (Amazing work by @ygg)
* Fixed Map Pins not having images on adventures generated on Windows.
* PotA Moar maps. (Thanks @Zac !)

# 0.1.4

* Lost Dungeon of Rickness walled! (Thanks @topper !)
* Improved CM maps (Thanks @OniNoKen !)
* THSoT scene tweaks (Thanks @ygg)
* TFoF partial scene support
* TSC partial scenes (Amazing work by @ygg)
* IDRotF Scenes were no longer parsing.

# 0.1.3

* Improved CoS scenes (Thanks @Zac !)
* Walling of some CM maps (Thanks @OniNoKen !)
* Mote PotA Scenes (Thanks Zac! )
* GoS scene added (thanks @CussaMitre !)
* PotA had missing Scene Note detection.

# 0.1.2

* Hunt for the Thessalhydra and Mythic Odysseys of Theros could crash the application.
* Improved roll parsing
* Improved CoS scenes (Thanks @Zac !)
* Start of CM maps (Thanks @OniNoKen !)
* Improved SVG icon generation for Scene Notes - these will now try to generate appropriate numbered/lettered icons for each scene note.
* WDotMM Scene Notes complete

# 0.1.1

* Some Journal content has a CSS class attached to it which rendered content invisible.
* Notes are note sorted alphabetically and numbers are padded with a zero if single digit.
* THSoT scene tweaks (Thanks @ygg)
* BGDiA first scene (Thanks @samm)
* Partial WDotMM Scene Notes (Levels 1-9)

# 0.1.0

* Notes generation for: DC, DoIP, DDvRaM, WA, GoS, HotDQ, IDRotF, LR, LLoK, OotA, RoT, SDW, SKT, SLW, EGtW, TTP, TOH, TSC, THSOT, WPM, DiT, ToA
* Some adjusted scene names were not recognised e.g. GoS
* More OotA scene alignments. (Thanks @Zac!)
* A few PotA scene alignments (Thanks @Zac!) and THSOT (Thanks @ygg)
* DMG parsing ran out of memory on some machines.
* Some books like GGtR had stopped generating handouts.

# 0.0.18

* Some Journal entries were double generated, or parts were generated incorrectly.
* Handout entries in top level documents were no longer generated.
* Notes generation for: PotE, AE, AtG, BGDiA, CM, CoS
* TcoE: Failed to complete parse

# 0.0.17

* LMOP Scene Note generation _actually_ included in build.
* More OotA map tweaks.

# 0.0.16

* App will now generate adventures again.

# 0.0.15

* Major refactor for Scene Journal Note generation. If submitting map enhancements you must now use 0.0.15 of `ddb-adventure-muncher` and v0.6.32 of `ddb-importer`.
* Note: note generation requires hints to be added to an adventure.
* Notes are not currently linked to scenes.
* Scenes now have a journal entry associated with them if a possible match is found.
* LMOP now imports Notes and has them placed on the Scenes.

# 0.0.14

* CoS now has full alignments, walls and lights. (Thanks @Zac!)
* Some OotA Scenes.
* AtG now parses scenes.

# 0.0.13

* More CoS adjustments.
* First pass at automatic roll table parsing.

# 0.0.12

* Improve scene id detection for ease of importing modifications.
* CoS: More scenes.
* Journals will now turn dice expressions into rollable links.
* More DoIP and DC scenes.

# 0.0.11

* CoS - A few map improvements.
* IDRotF - A few maps are now walled and lit.

# 0.0.10

* CoS - a few maps are now walled.
* Scene Folders will now always generate in the correct order (CoS did not).
* HotDQ - scene import failed.

# v0.0.8

* Command line options now available.
