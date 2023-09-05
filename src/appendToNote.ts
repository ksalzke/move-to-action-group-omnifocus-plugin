(() => {
  const action = new PlugIn.Action(async (selection: Selection) => {

    const lib = this.libraries[0]
    const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)]

    const fuzzySearchLib = lib.getFuzzySearchLib()
    const searchForm = fuzzySearchLib.remainingTasksFuzzySearchForm()

    await searchForm.show('Select Task', 'Append To Note')
    const location = searchForm.values.menuItem

    // append to note
    for (const task of tasks) {
      location.note = location.note + '\n- ' + task.name
      deleteObject(task)
    }

  })

  action.validate = (selection: Selection) => {

    // valid if tasks are selected and they all belong to the same project/assigned project
    const tasks = [...selection.tasks, ...selection.projects.map(project => project.task)]

    if (tasks.length == 0) return false
    else return true
  }

  return action
})()
