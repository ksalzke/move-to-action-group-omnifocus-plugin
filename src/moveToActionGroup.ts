/* global PlugIn Alert Form moveTasks Task save projectsMatching tagsMatching Preferences deleteObject */
(() => {
  const action = new PlugIn.Action(async (selection: Selection) => {
    const lib = this.libraries[0]
    const syncedPrefs = lib.loadSyncedPrefs()

    const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)]

    // get currently assigned project - if none show prompt
    const currentProject = tasks[0].containingProject

    const lastSelectedID = syncedPrefs.read('lastSelectedProjectID')
    const lastSelectedSection = (lastSelectedID === null) ? null : Project.byIdentifier(lastSelectedID) || Folder.byIdentifier(lastSelectedID)

    const defaultSelection = currentProject ? currentProject : tasks[0].assignedContainer ? tasks[0].assignedContainer : lastSelectedSection

    const section: null | Project | Folder = (lib.promptForProject()) ? await lib.projectPrompt(defaultSelection) : null
    // check that a tag has been assigned to all tasks, if that setting is enabled - and if not show prompt and assign
    if (lib.tagPrompt() && tasks.some(task => task.tags.length === 0)) await lib.addTags(tasks)

    // select action group from selected project, and perform processing
    if (section instanceof Folder) {
      const location = lib.moveToTopOfFolder() ? section.beginning : section.ending
      convertTasksToProjects(tasks, location)
    } else await lib.actionGroupPrompt(tasks, section)
  })

  action.validate = (selection: Selection) => {
    const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)]

    if (tasks.length == 0) return false

    const project = tasks[0].containingProject || tasks[0].assignedContainer
    return tasks.every(task => task.containingProject === project || task.assignedContainer === project)
  }

  return action
})()
