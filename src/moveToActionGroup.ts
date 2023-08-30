/* global PlugIn Alert Form moveTasks Task save projectsMatching tagsMatching Preferences deleteObject */
(() => {
  const action = new PlugIn.Action(async (selection: Selection) => {
    const lib = this.libraries[0]

    const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)]

    // get currently assigned project - if none show prompt
    const section: null | Project | Folder = (!lib.promptForProject()) ? null : tasks[0].assignedContainer !== null ? tasks[0].assignedContainer : await lib.projectPrompt()
    // check that a tag has been assigned to all tasks, if that setting is enabled - and if not show prompt and assign
    if (lib.tagPrompt() && tasks.some(task => task.tags.length === 0)) await lib.addTags(tasks)

    // select action group from selected project, and perform processing
    if (section instanceof Folder) {
      convertTasksToProjects(tasks, section)
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
