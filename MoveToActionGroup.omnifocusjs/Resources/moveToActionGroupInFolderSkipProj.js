(() => {
    const action = new PlugIn.Action(async (selection) => {
        const lib = this.libraries[0];
        const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)];
        await lib.processTasks(tasks, false, true);
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
