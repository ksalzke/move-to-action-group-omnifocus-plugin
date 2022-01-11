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

![Project selection](https://user-images.githubusercontent.com/16893787/148858483-845c0535-d34f-4d0b-8f0f-f15307acbd7b.png)

2. If no tags have been assigned, the user is prompted to select a tag, or tags, to be applied to the selected tasks.

![Tag selection](https://user-images.githubusercontent.com/16893787/148858501-e8d2d27a-96e2-42eb-9e69-a46d2028e7b3.png)

![Add another tag prompt](https://user-images.githubusercontent.com/16893787/148858568-07ef4f0e-1a2f-4e78-b5c1-41ee702ad9f4.png)

3. If action groups exist within that project, the user is prompted to select an action group to move the task(s) to. Optionally, a new action group can be created. There is also the option to navigate to the task after it is moved.

![Action group selection](https://user-images.githubusercontent.com/16893787/148858703-bb568d30-e055-42f5-828d-ed2ea29d7065.png)

4. If no action groups exist within that project, the user is prompted to create an action group and, optionally, navigate to the task after it is moved.

![No action groups prompt](https://user-images.githubusercontent.com/16893787/148858669-0eddf78e-31e5-4aae-9eff-30ef58ff12d7.png)

![Action group name prompt](https://user-images.githubusercontent.com/16893787/148858694-0d5715ac-71bd-4c5f-b5f8-05b0b1080fd5.png)

5. If the action group has more than one task, the user is prompted to select where in the group the selected task(s) should be moved. By default, tasks are added to the end of the action group.

![Location prompt](https://user-images.githubusercontent.com/16893787/148858547-7291b2bf-6dfb-43bb-af93-6f4b401fa22c.png)

The screenshot below shows the created hierarchy:

![Resulting hierarchy](https://user-images.githubusercontent.com/16893787/148858753-44977df5-eca5-4859-a525-c6424a2e352b.png)

