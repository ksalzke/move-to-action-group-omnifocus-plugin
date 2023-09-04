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
        /*------- Create new project if folder selected (and move and stop) -------*/
        if (section instanceof Folder) {
            const location = lib.moveToTopOfFolder() ? section.beginning : section.ending;
            const newProjects = convertTasksToProjects(tasks, location);
            for (const newProject of newProjects)
                newProject.addTag(lib.prefTag('newProjectTag'));
            return;
        }
        /*------- Otherwise, prompt for action group based on project/folder -------*/
        const actionGroupResult = await lib.promptForActionGroup(section, { setPosition: false, setDeferDate: false, setDueDate: false });
        const actionGroup = actionGroupResult.actionGroup;
        let moveDetails = actionGroupResult.moveDetails;
        /*------- If selected, show the 'set position' dialogue -------*/
        let location = actionGroup.ending;
        if (moveDetails.setPosition) {
            const locationResult = await lib.promptForLocation(actionGroup, moveDetails);
            location = locationResult.location;
            moveDetails = locationResult.moveDetails;
        }
        /*------- Move to destination (append to note if required) -------*/
        if (location instanceof Task) {
            // this means that 'append as note' has been selected
            for (const task of tasks) {
                location.note = location.note + '\n- ' + task.name;
                deleteObject(task);
            }
            // store last moved task as preference
            preferences.write('lastMovedID', location.id.primaryKey);
        }
        else {
            await lib.moveTasks(tasks, location);
        }
        /*------- Set dates if required -------*/
        if (moveDetails.setDeferDate) {
            const deferDateForm = lib.dateForm();
            await deferDateForm.show('Defer Date', 'Set');
            for (const task of tasks)
                task.deferDate = deferDateForm.values.date;
        }
        if (moveDetails.setDueDate) {
            const dueDateForm = lib.dateForm();
            await dueDateForm.show('Due Date', 'Set');
            for (const task of tasks)
                task.dueDate = dueDateForm.values.date;
        }
    };
    lib.promptForSection = async (defaultSelection, folderFilter) => {
        const syncedPrefs = lib.loadSyncedPrefs();
        const sectionForm = lib.sectionForm(defaultSelection, folderFilter);
        await sectionForm.show('Select a project or folder', 'Continue');
        const section = sectionForm.values.menuItem;
        if (section === 'New project') {
            const newProjectForm = lib.newProjectForm();
            await newProjectForm.show('New Project Name', 'Continue');
            const folderForm = lib.getFuzzySearchLib().activeFoldersFuzzySearchForm();
            let folder;
            if (folderFilter)
                folder = folderFilter;
            else {
                await folderForm.show('Select a folder', 'Continue');
                folder = folderForm.values.menuItem;
            }
            const location = lib.moveToTopOfFolder() ? folder.beginning : folder.ending;
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
    lib.promptForActionGroup = async (filter) => {
        const actionGroupForm = await lib.actionGroupForm(filter, { setPosition: false, setDeferDate: false, setDueDate: false });
        await actionGroupForm.show('Select Action Group', 'OK');
        let actionGroupSelection = actionGroupForm.values.menuItem;
        let newActionGroup;
        const moveDetails = {
            setPosition: actionGroupForm.values.setPosition,
            setDeferDate: actionGroupForm.values.promptForDeferDate,
            setDueDate: actionGroupForm.values.promptForDueDate
        };
        if (actionGroupSelection === 'New action group' && filter instanceof Project) {
            newActionGroup = await lib.createActionGroup(filter, moveDetails);
        }
        // repeat if selection is a project
        else if (actionGroupSelection instanceof Task && actionGroupSelection.project || actionGroupSelection instanceof Project) {
            const project = actionGroupSelection instanceof Project ? actionGroupSelection : actionGroupSelection.project;
            return await lib.promptForActionGroup(project, moveDetails);
        }
        // if selection is 'Add to root of project', return project
        else if (actionGroupSelection === 'Add to root of project' && filter instanceof Project) {
            newActionGroup = filter.task;
        }
        else if (actionGroupSelection instanceof Task)
            newActionGroup = actionGroupSelection;
        return {
            actionGroup: newActionGroup,
            moveDetails: {
                setPosition: actionGroupForm.values.setPosition,
                setDeferDate: actionGroupForm.values.promptForDeferDate,
                setDueDate: actionGroupForm.values.promptForDueDate
            }
        };
    };
    lib.createActionGroup = async (newActionGroup, moveDetails) => {
        // create action group
        const newActionGroupForm = lib.newActionGroupForm(moveDetails);
        await newActionGroupForm.show('Action Group Name', 'Create');
        newActionGroup = new Task(newActionGroupForm.values.groupName, newActionGroup);
        newActionGroup.completedByChildren = newActionGroupForm.values.completeWithLast;
        const tag = await lib.getPrefTag('actionGroupTag');
        if (newActionGroupForm.values.tagNewGroup)
            newActionGroup.addTag(tag);
        return newActionGroup;
    };
    lib.moveTasks = async (tasks, location) => {
        // clear any existing tags
        const tag = await lib.getPrefTag('actionGroupTag');
        const inheritTags = lib.inheritTags();
        const hasExistingTags = tasks.map(task => task.tags.length > 0);
        moveTasks(tasks, location);
        save();
        for (let i = 0; i < tasks.length; i++) {
            if (!hasExistingTags[i])
                tasks[i].removeTag(tag);
            if (!hasExistingTags[i] && !inheritTags)
                tasks[i].clearTags();
        }
        // store last moved task as preference
        preferences.write('lastMovedID', tasks[0].id.primaryKey);
    };
    lib.promptForLocation = async (actionGroup, moveDetails) => {
        const form = lib.positionForm(actionGroup, moveDetails);
        await form.show('Task Location', 'Move');
        let updatedMoveDetails = {
            setPosition: false,
            setDeferDate: form.values.setDeferDate,
            setDueDate: form.values.setDueDate
        };
        if (form.values.taskLocation === 'beginning')
            return { location: actionGroup.beginning, moveDetails: updatedMoveDetails };
        else if (form.values.taskLocation === 'new') {
            const newActionGroup = await lib.createActionGroup(actionGroup, updatedMoveDetails);
            return await lib.promptForLocation(newActionGroup, updatedMoveDetails);
        }
        else if (form.values.appendAsNote)
            return { location: form.values.taskLocation, moveDetails: updatedMoveDetails }; // processed in main function
        else
            return { location: form.values.taskLocation.after, moveDetails: updatedMoveDetails };
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
    lib.actionGroupTags = () => {
        const syncedPrefs = lib.loadSyncedPrefs();
        const currentSetting = syncedPrefs.read('actionGroupTags');
        if (currentSetting)
            return currentSetting.map((id) => Tag.byIdentifier(id)).filter((tag) => tag !== null);
        else
            return [];
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
        return fuzzySearchLib.searchForm(['New project', ...activeSections], ['New project', ...activeSections.map(p => p.name)], defaultSelected, null); // TODO: return fuzzy matching for projects and folders
    };
    lib.newProjectForm = () => {
        const newProjectForm = new Form();
        newProjectForm.addField(new Form.Field.String('projectName', 'Project Name', null, null), null);
        return newProjectForm;
    };
    lib.actionGroupForm = async (section, moveDetails) => {
        const fuzzySearchLib = lib.getFuzzySearchLib();
        const groups = await lib.potentialActionGroups(section);
        const additionalOptions = ['New action group'];
        if (section instanceof Project)
            additionalOptions.unshift('Add to root of project');
        const defaultSelected = (section instanceof Project) ? 'Add to root of project' : groups[0];
        const formOptions = [...additionalOptions, ...groups];
        const formLabels = [...additionalOptions, ...groups.map(fuzzySearchLib.getTaskPath)];
        const searchForm = fuzzySearchLib.searchForm(formOptions, formLabels, defaultSelected, null);
        searchForm.addField(new Form.Field.Checkbox('setPosition', 'Set position', false), null);
        searchForm.addField(new Form.Field.Checkbox('promptForDeferDate', 'Set Defer Date', moveDetails.setDeferDate), null);
        searchForm.addField(new Form.Field.Checkbox('promptForDueDate', 'Set Due Date', moveDetails.setDueDate), null);
        return searchForm;
    };
    lib.positionForm = (group, moveDetails) => {
        const form = new Form();
        const remainingChildren = group.children.filter(child => child.taskStatus === Task.Status.Available || child.taskStatus === Task.Status.Blocked);
        form.addField(new Form.Field.Option('taskLocation', 'Insert after', ['beginning', 'new', ...remainingChildren], ['(beginning)', 'New action group', ...remainingChildren.slice(0, -1).map(child => child.name), remainingChildren[remainingChildren.length - 1].name + ' (ending)'], remainingChildren[remainingChildren.length - 1] || 'beginning', null), null);
        form.addField(new Form.Field.Checkbox('appendAsNote', 'Append to note', false), null);
        form.addField(new Form.Field.Checkbox('promptForDeferDate', 'Set Defer Date', moveDetails.setDeferDate), null);
        form.addField(new Form.Field.Checkbox('promptForDueDate', 'Set Due Date', moveDetails.setDueDate), null);
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
    lib.newActionGroupForm = (moveDetails) => {
        const form = new Form();
        form.addField(new Form.Field.String('groupName', 'Group Name', null, null), null);
        form.addField(new Form.Field.Checkbox('completeWithLast', 'Complete with last action', settings.boolForKey('OFMCompleteWhenLastItemComplete')), null);
        form.addField(new Form.Field.Checkbox('tagNewGroup', 'Apply action group tag', lib.autoInclude() === 'none'), null);
        form.addField(new Form.Field.Checkbox('promptForDeferDate', 'Set Defer Date', moveDetails.setDeferDate), null);
        form.addField(new Form.Field.Checkbox('promptForDueDate', 'Set Due Date', moveDetails.setDueDate), null);
        return form;
    };
    lib.dateForm = () => {
        const form = new Form();
        form.addField(new Form.Field.Date('date', 'Date', null, null), null);
        return form;
    };
    /*------------------ Other Helper Functions -----------------*/
    lib.potentialActionGroups = async (section) => {
        const tags = lib.actionGroupTags();
        const allTasks = (section === null) ? flattenedTasks : (section instanceof Project ? section.flattenedTasks : [...section.flattenedProjects].flatMap(proj => [proj, ...proj.flattenedTasks]));
        const allActionGroups = allTasks.filter(task => {
            if (task.project !== null && section instanceof Project)
                return false; // exclude project task if project is used for filtering (leave if folder)
            if (task.tags.some(tag => tags.includes(tag)))
                return true;
            if (lib.autoInclude() === 'all tasks')
                return true;
            if (lib.autoInclude() === 'all' && task.hasChildren)
                return true;
            if (lib.autoInclude() === 'top' && task.hasChildren && task.parent?.project !== null)
                return true;
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
