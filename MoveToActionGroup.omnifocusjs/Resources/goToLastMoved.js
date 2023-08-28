(() => {
    const preferences = new Preferences(null);
    const action = new PlugIn.Action(async () => {
        const lib = this.libraries[0];
        const id = preferences.read('lastMovedID');
        const task = Task.byIdentifier(id.toString());
        lib.goTo(task);
    });
    action.validate = () => {
        return preferences.read('lastMovedID') !== null;
    };
    return action;
})();
