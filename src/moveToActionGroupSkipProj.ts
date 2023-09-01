(() => {
  const action = new PlugIn.Action(async (selection: Selection) => {

    const lib = this.libraries[0]
    const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)]

    await lib.processTasks(tasks, null, false)

  })

  action.validate = (selection: Selection) => {

    // valid if tasks are selected and they all belong to the same project/assigned project
    const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)]

    return tasks.length > 0
  }

  return action
})()
