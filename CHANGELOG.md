# 1.4.9

- Improve table formula matching where multiple dice used (e.g. Curse of Strahd random encounter tables).
- Support for Heroes' Feast: Saving the Children's Menu

# 1.4.8

- Support for Adventure Atlas: The Mortuary.
- Support for The Book of Many Things.

# 1.4.7

- Fix for rogue `}}` sometimes appearing after images.
- Support for Planescape.

# 1.4.6

- Lightning Keep support.

# 1.4.5

- Phandelver and Below support.

# 1.4.4

- Support for Baldurs Gate Gazetteer
- Improve donwnloading of high res images in some circumstances where they were previously missed.

# 1.4.3

- Support for Taldorei Reborn.

# 1.4.2

- New book release support.
- Fix MacOS Log file location.

# 1.4.1

- Some adventures (such as LMoP) would import with grids misaligned.

# 1.4.0

* Some adventures could load the wrong adventures data onto the scene! Notably WDH. This was a subtle bug that only appeared due to a particular duplication if the id used to identify the scene as well as scene enhancements added out of order. I don't think it impacted other adventures, but may have done.
* Some general improvements around scenes in Foundry v10, and how data is loaded.
* The next major release of Adventure Muncher is likely to drop support for Foundry v9. I suspect this will be around the time v11 enters a stable release cycle.

# 1.3.5

* Some scenes would not generate notes/pins on them.

# 1.3.4

* KftGV support.

# 1.3.3

* Prisoner 13 support.

# 1.3.2

* ToD support.

# 1.3.1

* Handle notes not linked to Journals.
* Prevent Images in journals opening in a new tab when clicked.

# 1.3.0

* Fix scene generation for some older scenes.
* Bum electron version.

# 1.2.2

* Capture alternative note icons for non-numeric entries.
* Support capturing custom items on scene actors.

# 1.2.1

* SotDQ support (Dragonlance)

# 1.2.0

* Support adventure scene adjustments exported just for v10. Some scene data would not be altered correctly in v10 if the scene data had been exported in v10.

# 1.1.2

* Note pins would be generated for some adventures, in some circumstances, even if you didn't want them to be.
* In some circumstances the hints for what monsters/spells/items that are needed for an adventure were not generated for DDB Importer.

# 1.1.1

* Generation of adventures for v9 would fail to generate content for Journals.

# 1.1.0

* Support for generating adventures without Note Pin pages, in v10 the latest DDB Importer can jump to links within Journal Pages instead.
* Bug in Journal Pin generation which could produce empty pins in some circumstances.

# 1.0.9

* Support to allow all DDB Importer to import all adventure actors into the world, and to link to world actors in journals.

# 1.0.8

* Support Dragons of Stormwreck Isle.

# 1.0.7

* If "Journals and Tables observable by all players?", Journal and Table generation would fail.

# 1.0.6

* Config did not load correctly in compiled version.

# 1.0.5

* Some missing scenes were not included.
* Some tweaks to improve Note changes in recent DDB data updates.
* Fix table parsing in some adventures such as CoS.

# 1.0.3

* If loading a new config file on Windows, could get stuck in a loop as old file would always overwrite new one.

# 1.0.2

* A race condition could leave old scenes, journals etc in the folder resulting in multiple entries, or entries in the root folders during import.

# 1.0.1

* New config would not always load, depending on existing config.

# 1.0.0

Massive rewrite, main features are:
- Performance increased between x6 and x10, depending on the adventure.
- PDF's are now imported as Journal Pages in v10
- To generate a v10 adventure you will now need to regenerate your config file with DDB Importer v3.0.6 or higher.
- Improved linking to SRD elements.
- v10 imports require DDB Importer 3.1.0

# 0.7.4

* Some fixes for adventure munching in v10 around tables and lights.

# 0.7.3

* Support Spelljammer Adventures in Space

# 0.7.2

* Improve logging around note generation failure.
* Mad Mage no longer generated.

# 0.7.1

* Some adventures would choke on table generation.
* Some tables would create an upper range value can be 0, which I no longer supported in v10.

# 0.7.0

* Foundry v10 Adventure Generation mode for new style combined Journals. Pins and Handouts are still generated separately.
* Some improvements to linking in documents.
* Tokens will always be generated for scenes, ddb-importer removes dead tokens from scenes if it can't find links.
* Option to reduce the number of hand outs generated. This is useful in the latest version if DDB Importer to reduce the number of journal entries, as handouts can now be generated for players by hovering over images and read aloud sections. There is a slim chance that some of these handouts have been used for Map Notes/Pins. Images/maps marked as Player versions will always be generated as handouts.
* Option to prevent generation of player map handouts.

# 0.6.12

* Try and improve download failures.

# 0.6.11

* Initial support for Journeys Through the Radiant Citadel

# 0.6.10

* Support for Spell Jammer Academy.
* Support for The Radiant Citadel chapter 1 excerpt.

# 0.6.9

* Some dice roll detection would break some links.

# 0.6.8

* Try and improve corrupted EOF downloads on some systems.

# 0.6.7

* Try and improve hanging or partial downloads on Windows.

# 0.6.6

* Improve support for adventures with missing data.

# 0.6.5

* Support for MotM and MCV1. 

# 0.6.4

* Increase memory ceiling.

# 0.6.3

* A rare loop bug could cause, in some very rare cases, images to be replaced by unexpected images. e.g. DC:  Ebondeath's Mausoleum would be replaced with the cover image.

# 0.6.2

* Remove ":" from pin names.

# 0.6.1

* Windows did not generate scene data enhancements

# 0.6.0

* Moved to new SQLite module to resolve some issues on newer linux versions, and to enable moving to a newer electron version.
* New version of Electron.

# 0.5.5

* Captcha change at DDB caused loading issues.

# 0.5.4

* Improve parsing for notes in Call of the Netherdeep.

# 0.5.3

* Support for Call of the Netherdeep

# 0.5.2

* Try and improve meta data download failures.

# 0.5.1

* Fixes for new parsing format, notably in LMoP and SKT.

# 0.5.0

* Support for new DDB Download format (mandatory update).

# 0.4.7

* Theros parsing tweaks.

# 0.4.6

* Change Scene Status Page.

# 0.4.5

* Able to distribute custom tiles

# 0.4.4

* Support for FToD

# 0.4.3

* New config files did not load over existing config files.

# 0.4.2

* Support for TWBtW.
* A log file is now generated during every run to ease debugging problems. Access it through the Help menu.

# 0.4.1

* Attempt to replace links to other modules, e.g. basic rules, with correct DDB links if no compendium lookup found.

# 0.4.0

* Adventure Muncher will no longer prevent munching if monsters are not in your compendium, and if using a DDB Importer version 2.4.0 or greater will automatically download and add missing monsters, items and spells into your DDB Importer compendiums.

# 0.3.13

* Improved note detection for scenes that change DDB format.

# 0.3.12

* The muncher will now display a warning if it does not know if the version of the data supplied by DDB was known to parse.

# 0.3.11

* Allow for scenes changing ids across releases from DDB. Some map pins from CoS may not currently be imported, these will be fixed in the next update.

# 0.3.10

* New formatting in CoS caused breakage and odd headers in journals.

# 0.3.9

* Improve some table generation in DMG tables. Some tables will still parse poorly, e.g. "Villan's Methods".

# 0.3.8

* Improved folder name generation for some tables, notably DMG.

# 0.3.7

* Some table headers broken in journals where roll link were created.
* Add ability to start loading hints for table names.

# 0.3.6

* Improved table name generation for some adventures, notably GoS
* Sometimes dice rolls in journals would concat words together.

# 0.3.5

* Improvements to link generation.
* Actors folder is now alphabetical sorted.

# 0.3.4

* Roll tables with dice expressions will now use the [[1d6]] style expression to roll the dice for you as part of drawing that result. The dice expression will also remain for manual rolls.

# 0.3.3

* If your config file is missing actor info for scenes a helpful error message will now be displayed.

# 0.3.2

* Better parsing if Handout Notes are on a scene.

# 0.3.0

* Meta Data (e.g. Scene mappings etc) is now checked and downloaded when you start the app, rather than contained in a release.

Maps included in latest meta data release as of release:
* LMoP Ruins of Thundertree update (Thanks @Zac !)
* AtG additions (Thanks @Pariah Zero !)
* ToA Updates (Thanks @michaelko777#7952 !)
* IDRotF Updates (Thanks @michaelko777#7952 !)
* CM Updates ( Thanks @Triasmus#0942 !)
* DoIP Updates (Thanks @Bizardanis#3454 !)

# 0.2.4

* BGDiA corrections (Thanks @michaelko777#7952 !)
* IDRotF changes (Thanks @michaelko777#7952 !)
* HotDQ additions (Thanks @m42e#6427 !)

# 0.2.2/3

* Some missing STK scenes now parse.
* SKT additions (Thanks Zac !)
* Option to generate tables and journals as observable by all.
* Extra deb info for enhanced data fetch.

# 0.2.1

* ToA scene improvements (Thanks @michaelko777#7952 !)
* LMOP map improvements (Thanks @Riddim !)
* Tortle Package scenes (Thanks @michaelko777#7952 !)
* GoS scene additions (Thanks @michaelko777#7952 !)
* SKT additions (Thanks Zac !)

# 0.2.0

* Adventure Muncher is now a public release.
* LMOP map improvements (Thanks @AceKokuren !)
* Lots of adjusted AI Scenes (Thanks @Pariah Zero !)
* CM tweaks (Thanks @Triasmus !)
* ToA scene improvements (Thanks @michaelko777#7952 !)
* GoS scene additions (Thanks @michaelko777#7952 and @ThunderSoap !)
* Token generation option added to GUI.
* CM generated double notes in some cases.

# 0.1.9

* VRGtR - Scene aligned and walled (Thanks @Zac !)
* IDRotFM scene improvements and new additions (Thanks @michaelko777#7952 !)
* Many adventures no longer loaded scenes walls, and config etc :(


# 0.1.8

* Loads moar ToA scenes (Thanks @michaelko777#7952 !)
* Missing Scene notes for ToA Chapter 5.
* WPM config (Thanks @maadonna#6222 !)
* WDH Scenes (Thanks @maadonna#6222 !)
* ToH (Thanks @DreadPirateRobbo )
* IDRotFM scene improvements and new additions (Thanks @michaelko777#7952 !)
* BIG BUG: WDH didn't load all scenes. This might have effected other adventures.
* WDH had missing PINS.
* AI Scenes (Thanks @Pariah Zero !)

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
* Some ToA scenes (Thanks @michaelko777 !)
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
