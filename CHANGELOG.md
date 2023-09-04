# [4.1.0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v4.0.0...v4.1.0) (2023-09-04)


### Bug Fixes

* :bug: fix behaviour for project-specific options ([ea82a08](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/ea82a08b65bdcc0a5eb3b28f594ca6b015c27268))
* :bug: fix label for 'defer date' form ([80fafe6](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/80fafe65340e18a1d5e0b5c016cfb8ecc5f31e42))
* :bug: only show 'add to root of project' when a project is selected ([0a1e186](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/0a1e1860f0dc7ab942874968d170d7608798e7a9))


### Features

* :sparkles: add 'append to note' action ([faebc24](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/faebc24d95c48a6487faba85e9da4a4a68382c00))
* :sparkles: change action group tags to multi-select (0+) ([52bf760](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/52bf76041f71bfbe87e674e067ece4b75e8311ce)), closes [#21](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/issues/21)



# [4.0.0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v3.7.1...v4.0.0) (2023-09-03)


### Bug Fixes

* :bug: allow for selection of project when skipping project dialogues ([bf296c5](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/bf296c57a39cd1516f6f72502da29e863f50c987))
* :bug: fix bug in potentialActionGroups for projects ([44c53f2](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/44c53f2fda3b382a88545e900b145ab5cd7382f8))
* :bug: fix bug where note was appended to wrong task ([d7e3b63](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/d7e3b63d84e48ffb0a69af8a42bd43c1cbe21058))
* :bug: fix bug where task was added inside selected task when setting position (instead of after) and add '(ending)' marker ([a0b3d9c](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/a0b3d9ccafcaa22402b069c1eaba3478ad451634))
* :bug: show project dialogue after folder dialogue is shown ([4e776fc](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/4e776fc7a92ae8ba3f045b316384abc2f3196da7))


### Features

* :lipstick: make 'add to root of project' default selection ([827c9b0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/827c9b0e9dbbf1b18259278dfa9c95f03e1c8480))
* :lipstick: modify dialogue order so tags come first ([763bd51](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/763bd51bc695ca7942da75b695d05ac8a598d53c))
* :lipstick: move 'special' options to top of dialogues ([5c58b1b](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/5c58b1b1e2b646cae3e1df689a10d1be9d09941f))
* :sparkles: add 'Move To Action Group In Folder (Skip Project Selection)' ([c436b17](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/c436b176055c9f9c8df88ddccdb5c7ede17424da))
* :sparkles: add 'Move To Action Group In Folder' action (limits action groups by selected folder) ([7e108a6](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/7e108a69e4c2a44cbede75214256380385be6af4))
* :sparkles: add 'set defer date' and 'set due date' options ([7539e06](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/7539e06c5dec594f29bdad01d68844299a927a4a))
* :sparkles: add ability to 'add project' to move to ([0e0c7b9](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/0e0c7b99735d1cff54d88132e78dbf1564c41459))
* :sparkles: Add action to move directly to action group, without project prompt ([1b258b0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/1b258b00b1c9f4df0f6d64b657edfd21985c7675))
* :sparkles: add folders to 'project' dialogue (task is added to selected folder) ([616a1bd](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/616a1bd25a7ab4191b389fb72ba87aec3e0e8967))
* :sparkles: add preference for new project tag to be applied automatically ([d7cfbb0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/d7cfbb0728bf18b34e388d36151522e141ad683c))
* :sparkles: add preference to move to top (rather than end) of folder when creating project ([a214346](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/a214346df424108a6cd48a6754ddf1a1572b1274))
* :sparkles: change default selection: use current or assigned project if applicable, otherwise last used ([4a8090c](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/4a8090c9acf2bb56a702da4903b20e11b1bda469))
* :sparkles: don't show folder selection when creating new project if already filtered by folder ([0253b5d](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/0253b5d037b6478b828d879c72a54754485552f2))


### BREAKING CHANGES

* projectPrompt preference has been removed and various changes made to all functions in library (across various recent commits)



## [3.7.1](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v3.7.0...v3.7.1) (2023-06-17)


### Bug Fixes

* :bug: fix bug where not all action groups are shown when 'all' is selected ([7082a6d](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/7082a6d2510ba3099af695ac1ef734eff61b5e75))



# [3.7.0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v3.6.0...v3.7.0) (2023-06-17)


### Bug Fixes

* :bug: fix bug where action group tag not being removed ([db88e7a](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/db88e7a813d525a8ab417670b8d56d47f9368a21))


### Features

* :sparkles: add preference to not inherit tags when moved ([f377ece](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/f377eceba236e0373e05eb24470ac5f3d489e611))



# [3.6.0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v3.5.0...v3.6.0) (2023-06-04)


### Features

* :sparkles: Add option for all tasks to be included as potential action groups (whether or not they already have subtasks) ([af656fd](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/af656fdc57d7408f9a48257787b84af63b5a7646))



# [3.5.0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v3.4.0...v3.5.0) (2022-06-24)


### Bug Fixes

* :bug: re-introduce fuzzy matching for projects and tags ([eb7dbab](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/eb7dbab02386d83c0fdfc53a2a0caeeab873040c))


### Features

* :sparkles: add 'complete with last action' checkbox when creating new group ([e9f271d](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/e9f271debf124400cffac128ebc1e956ff2e7df8))
* :sparkles: add 'Prompt for Project' preference ([0578308](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/05783083da4eac6dd7ae9d5111e41c4f3fd2a637))



# [3.4.0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v3.3.0...v3.4.0) (2022-06-10)


### Features

* :lipstick: incorporate 'add another' into tag form (+ some refactoring) ([a413b16](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/a413b16ccd498ea6efe594ad8a1aaecf021ccca6))
* :sparkles: add ability to move projects, not just tasks ([32e428b](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/32e428b9b51acd2f4edd7159691b48aea194942f))
* :sparkles: add filter option to the action group form ([5387406](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/538740651d4b696eff3b1307f029585d8f286b51))
* :sparkles: preselect most recently used project in search form ([f12ccf5](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/f12ccf5d6254525d5423f76823f8e59be6b76467))



# [3.3.0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v3.2.1...v3.3.0) (2022-06-06)


### Features

* :sparkles: add preference: prompt for tags if no tags assigned? ([87705ce](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/87705ce22292a87af104b3ad8c41a67ebbe42719))



## [3.2.1](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v3.2.0...v3.2.1) (2022-06-05)


### Bug Fixes

* :lipstick: Fix label for 'no action group' dialogue - 'set position' checkbox was incorrectly labelled 'show in project' ([43a4af7](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/43a4af7907c3b1ac846ebe1c7b7b08bc27b53cad))



# [3.2.0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v3.1.1...v3.2.0) (2022-06-05)


### Features

* :sparkles: add 'add new action group' choice to position dialogue ([c9eb03f](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/c9eb03f7318303313dcca973586e9ab101817c97))
* :sparkles: add preference for designating the tag for action groups ([b66da11](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/b66da11528b9d8bb6785037c07c1b2d22a2fe7b0))
* :sparkles: Add preference to auto-include top-level or all action groups ([bfedb0f](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/bfedb0fde55a84fd6ac1d3b04e633099e29d25e7))
* :sparkles: change checkboxes: now 'set position' and 'append as note' ([7a93705](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/7a93705de761023fe210c86028c9efe589744af0))
* :sparkles: optionally don't apply action group tag ([15618c3](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/15618c37b62bbae503027fd8c3988636068d73cf))
* :sparkles: select "beginning" by default if there are no tasks within action group ([4b7aa1e](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/4b7aa1e6dd7fefe8effb14449d02ff8a265999cf))



## [3.1.1](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v3.1.0...v3.1.1) (2022-02-22)


### Bug Fixes

* :bug: convert Alert to Form re 'no action group' ([59cf6eb](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/59cf6ebe998229914885b872af32620c4477b82c))
* :bug: fix go-to logic in 'no action group' case ([e53b573](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/e53b57376126ec102567e21c9ca069c483e1754c))



# [3.1.0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v2.4.1...v3.1.0) (2022-01-23)


### Bug Fixes

* :bug: only show remaining tasks in 'task location' prompt ([3bb5bc7](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/3bb5bc743fcbb1742928201a030ba9730a52be78))


### Features

* :sparkles: add 'go to last moved' action that navigates to the last task that was moved ([d7dd714](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/d7dd714cacc6c88ac7f18ee012127466bd10769a))
* :sparkles: add 'show task in project after moving' checkbox to location dialogue ([f76839e](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/f76839e96cb02e56f436ea0e8ed3346efbac3c8b))



## [2.4.1](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v2.0.0...v2.4.1) (2022-01-12)


### Bug Fixes

* :bug: only return active or blocked action groups ([06c455b](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/06c455bf435d86f7bffc24ffb2ba0b0f5f2103b7))


### Features

* :sparkles: add option to go to project after moving ([1f31127](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/1f31127be6c2826b0700d700732021ca757a7ff2))
* :sparkles: add prompt for project and tag if none assigned ([#12](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/issues/12)) ([cff8502](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/cff850207f5203a10fdde363e3ef5c384b5d9d98))
* :sparkles: prompt for additional tags ([c8fbf10](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/c8fbf1073d07d56a17ddacca7fbfd4a6f067380d))
* :sparkles: show project form for tasks that are part of a project ([98dee28](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/98dee28934becd5f511f4f6f8949ccb95a714ce5))



# [2.0.0](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/compare/v1.0.0...v2.0.0) (2022-01-07)


### Features

* :sparkles: show action group hierarchy in form ([31b20e1](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/31b20e175de7f05604e26da2cdc37156e530aff1))
* ✨ add 'add group' button to 'no action groups' alert & drop down ([b470e45](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/b470e45550e46c7956572418e816f60f5199427b))
* ✨ allow multiple tasks to be selected ([ca15236](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/ca152367af947372f8cfd4794e0df0cdbb2b7181))
* ✨ allow user to select location within action group ([2617cd6](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/commit/2617cd6a98d4903a3152c85c226e6c18ed5f168e))



# 1.0.0 (2022-01-01)



