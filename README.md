

# About

This is an Omni Automation plug-in for OmniFocus that allows tasks to be more easily moved to within action groups.

_Please note that all scripts on my GitHub account (or shared elsewhere) are works in progress. If you encounter any issues or have any suggestions please let me know--and do please make sure you backup your database before running scripts from the internet!)_

## Known issues 

Refer to ['issues'](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/issues) for known issues and planned changes/enhancements.

# Installation & Set-Up

## Synced Preferences Plug-In

**Important note: for this plug-in bundle to work correctly, my [Synced Preferences for OmniFocus plug-in](https://github.com/ksalzke/synced-preferences-for-omnifocus) is also required and needs to be added to the plug-in folder separately.**

## Installation

1. Download the [latest release](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/releases/latest).
2. Unzip the downloaded file.
3. Move the `.omnifocusjs` file to your OmniFocus plug-in library folder (or open it to install).
4. Configure your preferences using the `Preferences` action.

# Actions

This plug-in contains the following actions:

## Move to Action Group

This action can be run when one or more tasks are selected. The selected tasks must all be either assigned to the same project or not assigned to any project.

The action then completes the following:

1. The user is prompted to select a project. (If 'Prompt for Project' is deselected in the Preferences, this prompt is not shown.)

2. If no tags have been assigned and the user has selected 'Prompt for Tags' in the Preferences, the user is prompted to select a tag, or tags, to be applied to the selected tasks.

3. The user is prompted to select an action group to move the task(s) to, if appropriate action groups (determined by the preferences) exist (either in the selected project, or in the entire database if the 'Prompt for Project' preference is not active). Alternatively, a new action group can be created (with a prompt for the user to enter the name) or the task(s) can be moved to the root of the previously selected project.
Optionally, the user can select the checkbox to select the position of the task(s) in the next step.

4. Based on the previous selection, the user may be prompted to select where in the group the selected task(s) should be moved. By default, tasks are added to the end of the action group. There is also the option to navigate to the task after it is moved. The user may also opt to add the project to the note of the task that's selected, rather than as a subtask. This may be useful in conjunction with my [Note To Subtasks](https://github.com/ksalzke/notes-to-subtasks-omnifocus-plugin) plug-in.

## Go To Last Moved

This action navigates to the last task that was moved by this plug-in.

## Preferences: Move to Action Group

This action allows the user to set the preferences for the plug-in. These sync between devices using the Synced Preferences plug-in linked above.

The following preferences are available:

* **Action Group Tag**. This is a tag that can optionally be used to denote action groups. It can be used to restrict the action groups that show in the options to a predefined subset.
* **Automatically Include Action Groups**. This setting can be set to 'None' (only action group tagged with the Action Group Tag, set above, are included as options), 'Top-Level' (all top-level action groups are included as options), or 'All' (all action groups included).
* **Prompt for Tags**. If this is selected and none of the selected tasks have tags, the user will be prompted to add one or more tags to them prior to selecting an action group to move them to.
* **Prompt for Project**. If this is selected, the user will be prompted for a project prior to the action group prompt. If unselected, all action groups across the database will be shown. Note that _not_ prompting for the project will result in slower performance.


# Functions

## `goTo (task : Task)` (asynchronous)

This asynchronous function navigates to the relevant task. (On macOS, a new window/tab is opened.)

## `loadSyncedPrefs () : SyncedPref`

Returns the [SyncedPref](https://github.com/ksalzke/synced-preferences-for-omnifocus) object for this plug-in.

If the user does not have the plug-in installed correctly, they are alerted.

## `prefTag (prefTag: String) : Tag | null`

Returns the currently-set tag, if set in preferences. If no tag has been set, returns null.

## `getPrefTag (prefTag: string) : Tag` (asynchronous)

Returns the currently-set tag ('itemTag' or 'linkedEventTag'), if set in preferences. If no tag has been set, shows the preferences form.


## `autoInclude () : Boolean`

Returns the current setting for the 'Automatically Include Action Groups' preference.

## `tagPrompt () : Boolean`

Returns the current setting for the 'Prompt For Tags' preference. If no preference is set, returns false.

## `promptForProject () : Boolean`

Returns the current setting for the 'Prompt For Projects' preference. If no preference is set, returns true.

## `searchForm (allItems: Array<T>, itemTitles: Array<String>, firstSelected: T, matchingFunction: function | null) : Form` (asynchronous)

Returns a form that has two fields.

The first field is an empty text box, which the user can type into to search the second field, which is a dropdown menu comprising `allItems` with titles `itemTitles`. The initial selected item will be `firstSelected`.

The `matchingFunction` should be an OmniFocus matching function such as `tagsMatching` or `projectsMatching`. If this parameter is passed, fuzzy search will be used (but note that the corresponding allItems parameter should be `flattenedProjects` or `flattenedTags`, for example; a subset cannot be used).

If the `matchingFunction` is null, the search will be exact.

## `projectPrompt () : Project` (asynchronous)

Shows a prompt for the user to select a project, using the `searchForm`. The last used project is selected by default.

## `tagForm() : Form` (asynchronous)

Returns a form for the user to select a tag, using the `searchForm` and an additional 'Add another?' checkbox.

## `addTags(tasks: Array<Task>)` (asynchronous)

Shows a `tagForm` prompt for the user to add a tag, repeatedly while the 'Add another?' checkbox is selected.

## `potentialActionGroups (proj: Project | null) : Array<Task>` (asynchronous)

Returns an array of action groups within the given project. The action groups that are returned depends on the setting chosen in Preferences. If null is passed as a parameter, all action groups within the database are checked. 

## `actionGroupPrompt (tasks: Array<Task>, proj: Project)` (asynchronous)

Shows a `searchForm` prompt for the user to select one of:
(a) an action group from the given project.
(b) a new action group
(c) the root of the project
Note that the search for this form is exact, and not fuzzy.

It also includes a checkbox that enables the user to set the position of the task within the action group in the next step.

## `locationForm (group: Task) : Form` (asynchronous)

Returns a form that allows the user to select one of the following options:
(a) one of the children of the action group task (or the beginning of the group)
(b) the beginning of the action group
(c) a new action group

It also includes a checkbox to 'Append to note' which will append to the note of the selected task, rather than adding as a subtask.

## `selectLocation (tasks: Array<Task>, group: Task) : Task.ChildInsertionLocation` (asynchronous)

Shows the `locationForm` and returns the resulting location.

If 'Append to note' is selected or the 'New action group' is selected, the necessary processing also occurs.

## `moveToNewActionGroup (tasks: Array<Task>, location: Task.ChildInsertionLocation)` (asynchronous)

Shows a prompt for the user to enter a name for the new group, select whether it is completed with the last action, and whether the 'action group tag' set in preferences should be applied.

The new action group is then created accordingly, and the tasks are moved to that group.

## `moveTasks (tasks: Array<Task>, location: Task.ChildInsertionLocation | Task | Project, setPosition: Boolean)` (asynchronous)

If `setPosition` is true, shows the `selectLocation` prompt for the user to select a task from within `location`, then moves the tasks to that position. If it is false, tasks are moved to the end.