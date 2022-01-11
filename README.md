# About

This is an Omni Automation plug-in for OmniFocus that allows tasks to be more easily moved to within action groups.

_Please note that all scripts on my GitHub account (or shared elsewhere) are works in progress. If you encounter any issues or have any suggestions please let me know--and do please make sure you backup your database before running scripts from the internet!)_

## Known issues 

Refer to ['issues'](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/issues) for known issues and planned changes/enhancements.

# Installation & Set-Up

1. Download the [latest release](https://github.com/ksalzke/move-to-action-group-omnifocus-plugin/releases/latest).
2. Unzip the downloaded file.
3. Move the `.omnifocusjs` file to your OmniFocus plug-in library folder (or open it to install).

A tag named 'Action Group' is required. This should be applied to action groups that you wish to move tasks to using the script.

# Actions

This plug-in contains the following action:

## Move to Action Group

This action can be run when one or more tasks are selcted. The selected tasks must all be either assigned to the same project or not assigned to any project.

The action then completes the following:

1. If no project is assigned, or if the script is invoked on tasks that are already included in a project (i.e. not in the inbox) the user is prompted to select a project.

2. If no tags have been assigned, the user is prompted to select a tag, or tags, to be applied to the selected tasks.

3. The user is prompted to select an action group to move the task(s) to. Optionally, a new action group can be created. There is also the option to navigate to the task after it is moved.

4. If the action group has more than one task, the user is prompted to select where in the group the selected task(s) should be moved. By default, tasks are added to the end of the action group.
