// #region Type Definitions
/** ========================================================================
 **                            TYPE DEFINITIONS
 *========================================================================**/
// #endregion
(() => {
    const preferences = new Preferences(null);
    const lib = new PlugIn.Library(new Version('1.0'));
    /**------------------------------------------------------------------------
     **                           MAIN LOGIC
     *------------------------------------------------------------------------**/
    lib.processTasks = async (tasks, promptForProject, promptForFolder) => {
        const syncedPrefs = lib.loadSyncedPrefs();
        // determine default selection - use current or assigned project if applicbale, otherwise use the last selected section
        const currentProject = tasks[0].containingProject;
        const lastSelectedID = syncedPrefs.read('lastSelectedProjectID');
        const lastSelectedSection = (lastSelectedID === null) ? null : Project.byIdentifier(lastSelectedID) || Folder.byIdentifier(lastSelectedID);
        const defaultSelection = currentProject ?
            currentProject
            : (tasks[0].assignedContainer instanceof Project) ?
                tasks[0].assignedContainer
                : lastSelectedSection;
        /*------- Prompt for tag(s) (if enabled and no tags) -------*/
        if (lib.tagPrompt() && tasks.some(task => task.tags.length === 0))
            await lib.promptForTags(tasks);
        /*======= Prompt for folder (if relevant) =======*/
        const folder = (promptForFolder) ? await lib.promptForFolder() : null; // folder: Omni Automation
        /*------- Prompt for section (if enabled) -------*/
        const section = (promptForProject) ? await lib.promptForSection(defaultSelection, folder) : null; // section: Omni Automation
        /*------- Create new project if folder selected -------*/
        if (section instanceof Folder) {
            const location = lib.moveToTopOfFolder() ? section.beginning : section.ending;
            const newProjects = convertTasksToProjects(tasks, location);
            for (const newProject of newProjects)
                newProject.addTag(lib.prefTag('newProjectTag'));
            return;
        }
        /*------- Otherwise, prompt for action group based on project -------*/
        const filter = section || folder;
        const actionGroupForm = await lib.actionGroupForm(filter);
        await actionGroupForm.show('Select Action Group', 'OK');
        const actionGroupSelection = actionGroupForm.values.menuItem;
        const setPosition = actionGroupForm.values.setPosition;
        /*------- Create destination (if needed) and move -------*/
        // position is also set as part of moveTasks function
        switch (actionGroupSelection) {
            case 'New action group':
                await lib.createActionGroupAndMoveTasks(tasks, section);
                break;
            case 'Add to root of project':
                await lib.moveTasks(tasks, section, setPosition);
                break;
            default:
                if (actionGroupSelection.project || actionGroupSelection instanceof Project) {
                    const project = actionGroupSelection instanceof Project ? actionGroupSelection : actionGroupSelection.project;
                    // selected item was a project
                    const secondActionGroupForm = await lib.actionGroupForm(project);
                    await secondActionGroupForm.show('Select Action Group', 'OK');
                    await lib.moveTasks(tasks, secondActionGroupForm.values.menuItem, secondActionGroupForm.values.setPosition);
                }
                else {
                    // selected item was a task
                    await lib.moveTasks(tasks, actionGroupSelection, setPosition);
                }
        }
    };
    lib.promptForSection = async (defaultSelection, folder) => {
        const syncedPrefs = lib.loadSyncedPrefs();
        const sectionForm = lib.sectionForm(defaultSelection, folder);
        await sectionForm.show('Select a project or folder', 'Continue');
        const section = sectionForm.values.menuItem;
        if (section === 'New project') {
            const newProjectForm = lib.newProjectForm();
            await newProjectForm.show('New Project Name', 'Continue');
            const folderForm = lib.getFuzzySearchLib().activeFoldersFuzzySearchForm();
            await folderForm.show('Select a folder', 'Continue');
            const location = lib.moveToTopOfFolder() ? folderForm.values.menuItem.beginning : folderForm.values.menuItem.ending;
            const newProject = new Project(newProjectForm.values.projectName, location);
            newProject.addTag(lib.prefTag('newProjectTag')); // TODO: stop being inherited by task
            return newProject;
        }
        else {
            // save project for next time
            syncedPrefs.write('lastSelectedProjectID', section.id.primaryKey);
            return section;
        }
    };
    lib.promptForTags = async (tasks) => {
        const untagged = tasks.filter(task => task.tags.length === 0);
        let form;
        do {
            // show form
            const tagForm = await lib.tagForm();
            form = await tagForm.show('Select a tag to apply to untagged tasks', 'OK');
            const tag = tagForm.values.menuItem;
            untagged.forEach(task => task.addTag(tag));
        } while (form.values.another);
    };
    lib.createActionGroupAndMoveTasks = async (tasks, location) => {
        // create action group
        const newActionGroupForm = lib.newActionGroupForm();
        await newActionGroupForm.show('Action Group Name', 'Create');
        location = new Task(newActionGroupForm.values.groupName, location);
        location.completedByChildren = newActionGroupForm.values.completeWithLast;
        const tag = await lib.getPrefTag('actionGroupTag');
        if (newActionGroupForm.values.tagNewGroup)
            location.addTag(tag);
        // move task to new action group
        await lib.moveTasks(tasks, location, false);
    };
    lib.moveTasks = async (tasks, location, setPosition) => {
        const loc = setPosition ? await lib.promptForLocation(tasks, location) : location.ending;
        switch (loc) {
            case 'new':
                await lib.createActionGroupAndMoveTasks(tasks, location);
                break;
            case 'appended as note':
                break;
            default:
                // clear any existing tags
                const tag = await lib.getPrefTag('actionGroupTag');
                const inheritTags = lib.inheritTags();
                const hasExistingTags = tasks.map(task => task.tags.length > 0);
                moveTasks(tasks, loc);
                save();
                for (let i = 0; i < tasks.length; i++) {
                    if (!hasExistingTags[i])
                        tasks[i].removeTag(tag);
                    if (!hasExistingTags[i] && !inheritTags)
                        tasks[i].clearTags();
                }
                break;
        }
        // store last moved task as preference
        preferences.write('lastMovedID', tasks[0].id.primaryKey);
    };
    lib.promptForLocation = async (tasks, group) => {
        const form = lib.positionForm(group);
        await form.show('Task Location', 'Move');
        if (form.values.taskLocation === 'new')
            return 'new';
        else if (form.values.taskLocation === 'beginning')
            return group.beginning;
        if (form.values.appendAsNote) {
            for (const task of tasks) {
                form.values.taskLocation.note = form.values.taskLocation.note + '\n- ' + task.name;
                deleteObject(task);
                return 'appended as note';
            }
        }
        return form.values.taskLocation.after;
    };
    // #region Helper Functions
    /**========================================================================
     **                            HELPER FUNCTIONS
     *========================================================================**/
    /*================== Get Other Libraries =================*/
    lib.loadSyncedPrefs = () => {
        const syncedPrefsPlugin = PlugIn.find('com.KaitlinSalzke.SyncedPrefLibrary', null);
        if (syncedPrefsPlugin !== null) {
            const syncedPrefLib = syncedPrefsPlugin.library('syncedPrefLibrary');
            const SyncedPref = new syncedPrefLib.SyncedPref('com.KaitlinSalzke.followUpTask');
            return SyncedPref;
        }
        else {
            const alert = new Alert('Synced Preferences Library Required', 'For the Move To Action Group plug-in to work correctly, the \'Synced Preferences for OmniFocus\' plug-in (https://github.com/ksalzke/synced-preferences-for-omnifocus) is also required and needs to be added to the plug-in folder separately. Either you do not currently have this plugin installed, or it is not installed correctly.');
            alert.show(null);
        }
    };
    lib.getFuzzySearchLib = () => {
        const fuzzySearchPlugIn = PlugIn.find('com.KaitlinSalzke.fuzzySearchLib', null);
        if (!fuzzySearchPlugIn) {
            const alert = new Alert('Fuzzy Search Library Required', 'For the Follow-Up Task plug-in to work correctly, the \'Fuzzy Search\' plug-in (https://github.com/ksalzke/fuzzy-search-library) is also required and needs to be added to the plug-in folder separately. Either you do not currently have this plugin installed, or it is not installed correctly.');
            alert.show(null);
        }
        return fuzzySearchPlugIn.library('fuzzySearchLib');
    };
    /*================== Get Preference Info =================*/
    lib.prefTag = (prefTag) => {
        const preferences = lib.loadSyncedPrefs();
        const tagID = preferences.readString(`${prefTag}ID`);
        if (tagID !== null && Tag.byIdentifier(tagID) !== null)
            return Tag.byIdentifier(tagID);
        return null;
    };
    lib.getPrefTag = async (prefTag) => {
        const tag = lib.prefTag(prefTag);
        if (tag !== null)
            return tag;
        // if not set, show preferences pane and then try again)
        await this.action('preferences').perform();
        return lib.getPrefTag(prefTag);
    };
    lib.autoInclude = () => {
        const preferences = lib.loadSyncedPrefs();
        const setting = preferences.readString('autoInclude');
        // @ts-ignore ignore re 'setting' properties*/
        if (['none', 'top', 'all', 'all tasks'].includes(setting))
            return setting;
        else
            return 'none';
    };
    lib.tagPrompt = () => {
        const preferences = lib.loadSyncedPrefs();
        return preferences.readBoolean('tagPrompt');
    };
    lib.inheritTags = () => {
        const preferences = lib.loadSyncedPrefs();
        if (preferences.read('inheritTags') !== null)
            return preferences.read('inheritTags');
        else
            return true;
    };
    lib.moveToTopOfFolder = () => {
        const preferences = lib.loadSyncedPrefs();
        if (preferences.read('moveToTopOfFolder') !== null)
            return preferences.read('moveToTopOfFolder');
        else
            return false; // TODO: consolidate actions into one 'get preference' action
    };
    /*------------------ Get Forms -----------------*/
    lib.tagForm = () => {
        const fuzzySearchLib = lib.getFuzzySearchLib();
        const form = fuzzySearchLib.activeTagsFuzzySearchForm();
        form.addField(new Form.Field.Checkbox('another', 'Add another?', false), null);
        return form;
    };
    lib.sectionForm = (defaultSelection, folder) => {
        const fuzzySearchLib = lib.getFuzzySearchLib();
        const relevantSections = folder ? folder.flattenedSections : flattenedSections;
        const activeSections = relevantSections.filter(section => [Project.Status.Active, Project.Status.OnHold, Folder.Status.Active].includes(section.status));
        const defaultSelected = activeSections.includes(defaultSelection) ? defaultSelection : null;
        return fuzzySearchLib.searchForm([...activeSections, 'New project'], [...activeSections.map(p => p.name), 'New project'], defaultSelected, null); // TODO: return fuzzy matching for projects and folders
    };
    lib.newProjectForm = () => {
        const newProjectForm = new Form();
        newProjectForm.addField(new Form.Field.String('projectName', 'Project Name', null, null), null);
        return newProjectForm;
    };
    lib.actionGroupForm = async (section) => {
        const fuzzySearchLib = lib.getFuzzySearchLib();
        const groups = await lib.potentialActionGroups(section);
        const additionalOptions = ['Add to root of project', 'New action group'];
        const formOptions = [...groups, ...additionalOptions];
        const formLabels = [...groups.map(fuzzySearchLib.getTaskPath), ...additionalOptions];
        const searchForm = fuzzySearchLib.searchForm(formOptions, formLabels, formOptions[0], null);
        searchForm.addField(new Form.Field.Checkbox('setPosition', 'Set position', false), null);
        return searchForm;
    };
    lib.positionForm = (group) => {
        const form = new Form();
        const remainingChildren = group.children.filter(child => child.taskStatus === Task.Status.Available || child.taskStatus === Task.Status.Blocked);
        form.addField(new Form.Field.Option('taskLocation', 'Insert after', ['beginning', ...remainingChildren, 'new'], ['(beginning)', ...remainingChildren.map(child => child.name), 'New action group'], remainingChildren[remainingChildren.length - 1] || 'beginning', null), null);
        form.addField(new Form.Field.Checkbox('appendAsNote', 'Append to note', false), null);
        form.validate = (form) => {
            if (form.values.appendAsNote && form.values.taskLocation === 'beginning')
                return false; // can't append to non-existant task
            if (form.values.appendAsNote && form.values.taskLocation === 'new')
                return false; // won't be a new action group if task isn't added
            else
                return true;
        };
        return form;
    };
    lib.newActionGroupForm = () => {
        const form = new Form();
        form.addField(new Form.Field.String('groupName', 'Group Name', null, null), null);
        form.addField(new Form.Field.Checkbox('completeWithLast', 'Complete with last action', settings.boolForKey('OFMCompleteWhenLastItemComplete')), null);
        form.addField(new Form.Field.Checkbox('tagNewGroup', 'Apply action group tag', lib.autoInclude() === 'none'), null);
        return form;
    };
    /*------------------ Other Helper Functions -----------------*/
    lib.potentialActionGroups = async (section) => {
        const tag = await lib.getPrefTag('actionGroupTag');
        const allTasks = (section === null) ? flattenedTasks : (section instanceof Project ? section.flattenedTasks : [...section.flattenedProjects].flatMap(proj => [proj, ...proj.flattenedTasks]));
        const allActionGroups = allTasks.filter(task => {
            if (task.project !== null && section instanceof Project)
                return false; // exclude project task if project is used for filtering (leave if folder)
            if (task.tags.includes(tag))
                return true;
            if (lib.autoInclude() === 'all tasks')
                return true;
            if (lib.autoInclude() === 'all' && task.hasChildren)
                return true;
            if (lib.autoInclude() === 'top' && task.hasChildren && task.parent.project !== null)
                return true;
            else
                return false;
        });
        const availableActionGroups = allActionGroups.filter(task => ![Task.Status.Completed, Task.Status.Dropped].includes(task.taskStatus));
        return availableActionGroups;
    };
    lib.goTo = async (task) => {
        if (Device.current.mac)
            await document.newTabOnWindow(document.windows[0]); // new tab - only Mac supported
        URL.fromString('omnifocus:///task/' + task.containingProject.id.primaryKey).open();
        URL.fromString('omnifocus:///task/' + task.id.primaryKey).open();
    };
    lib.promptForFolder = async () => {
        const fuzzySearchLib = lib.getFuzzySearchLib();
        const folderForm = fuzzySearchLib.activeFoldersFuzzySearchForm();
        await folderForm.show('Select a folder', 'Continue');
        return folderForm.values.menuItem;
    };
    // #endregion
    return lib;
})();
