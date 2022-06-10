/* global PlugIn Alert Form moveTasks Task save projectsMatching tagsMatching Preferences deleteObject */
(() => {
  const action = new PlugIn.Action(async selection => {
    const lib = this.libraries[0]

    const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)]

    // get currently assigned project - if none show prompt
    const proj = tasks[0].assignedContainer !== null ? tasks[0].assignedContainer : await lib.projectPrompt()

    // check that a tag has been assigned to all tasks, if that setting is enabled - and if not show prompt and assign
    if (lib.tagPrompt() && tasks.some(task => task.tags.length === 0)) await lib.addTags(tasks)

    // select action group from selected project
    const actionGroupPrompt = await lib.actionGroupPrompt(proj)
    const actionGroupForm = await actionGroupPrompt.show('Select Action Group', 'OK')
    const actionGroup = actionGroupForm.values.actionGroup
    const setPosition = actionGroupForm.values.setPosition

    switch (actionGroupForm.values.actionGroup) {
      case 'New action group':
        await lib.moveToNewActionGroup(tasks, proj)
        break
      case 'Add to root of project':
        lib.moveTasks(tasks, proj, setPosition)
        break
      default:
        lib.moveTasks(tasks, actionGroup, setPosition)
    }
  })

  action.validate = selection => {
    const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)]

    if (tasks.length == 0) return false

    const project = tasks[0].containingProject || tasks[0].assignedContainer
    return tasks.every(task => task.containingProject === project || task.assignedContainer === project)
  }

  return action
})()
