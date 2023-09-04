(() => {
    const action = new PlugIn.Action(async (selection) => {
        const lib = this.libraries[0];
        const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)];
        const groups = await lib.potentialActionGroups(null);
        const fuzzySearchLib = lib.getFuzzySearchLib();
        const searchForm = fuzzySearchLib.searchForm(groups, groups.map(g => g.name), null, null);
        await searchForm.show('Select Task', 'Append To Note');
        const location = searchForm.values.menuItem;
        // append to note
        for (const task of tasks) {
            location.note = location.note + '\n- ' + task.name;
            deleteObject(task);
        }
    });
    action.validate = (selection) => {
        // valid if tasks are selected and they all belong to the same project/assigned project
        const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)];
        if (tasks.length == 0)
            return false;
        else
            return true;
    };
    return action;
})();