(() => {
    const action = new PlugIn.Action(async function (_selection, _sender) {
        const lib = PlugIn.find('com.KaitlinSalzke.MoveToActionGroup', null).libraries[0];
        const syncedPrefs = lib.loadSyncedPrefs();
        // get current preferences or set defaults if they don't yet exist
        const actionGroupTag = lib.prefTag('actionGroupTag');
        const autoInclude = lib.autoInclude();
        const tagPrompt = lib.tagPrompt();
        const inheritTags = lib.inheritTags();
        const moveToTopOfFolder = lib.moveToTopOfFolder();
        const newProjectTag = lib.prefTag('newProjectTag');
        // create and show form
        const form = new Form();
        const tagNames = flattenedTags.map(t => t.name);
        form.addField(new Form.Field.Option('actionGroupTag', 'Action Group Tag', flattenedTags, tagNames, actionGroupTag, null), null);
        form.addField(new Form.Field.Option('autoInclude', 'Automatically Include Action Groups', ['none', 'top', 'all', 'all tasks'], ['None', 'Top-Level', 'All Action Groups', 'All Tasks'], autoInclude, null), null);
        form.addField(new Form.Field.Checkbox('tagPrompt', 'Prompt for Tags', tagPrompt), null);
        form.addField(new Form.Field.Checkbox('inheritTags', 'Inherit Tags When Moving', inheritTags), null);
        form.addField(new Form.Field.Checkbox('moveToTopOfFolder', 'Move to Top of Folder When Creating Projects', moveToTopOfFolder), null);
        const newProjectTagField = new Form.Field.Option('newProjectTag', 'New Project Tag', flattenedTags, tagNames, newProjectTag, 'None');
        newProjectTagField.allowsNull = true;
        form.addField(newProjectTagField, null);
        await form.show('Preferences: Move To Action Group', 'OK');
        // save preferences
        syncedPrefs.write('actionGroupTagID', form.values.actionGroupTag.id.primaryKey);
        syncedPrefs.write('autoInclude', form.values.autoInclude);
        syncedPrefs.write('tagPrompt', form.values.tagPrompt);
        syncedPrefs.write('inheritTags', form.values.inheritTags);
        syncedPrefs.write('moveToTopOfFolder', form.values.moveToTopOfFolder);
        if (form.values.newProjectTag !== null)
            syncedPrefs.write('newProjectTagID', form.values.newProjectTag.id.primaryKey);
    });
    action.validate = function (_selection, _sender) {
        return true;
    };
    return action;
})();
