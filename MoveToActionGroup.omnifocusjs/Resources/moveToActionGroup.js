/* global PlugIn Alert Form moveTasks Task save projectsMatching tagsMatching Preferences deleteObject */
(() => {
  const preferences = new Preferences()

  const action = new PlugIn.Action(async selection => {
    const lib = this.libraries[0]
    const tag = await lib.getPrefTag('actionGroupTag')

    const tasks = selection.tasks
    let setPosition = false
    let appendAsNote = false

    // FUNCTION: allow user to select location of child task
    const promptAndMove = async (tasks, group) => {
      const locationForm = async () => {
        const form = new Form()
        const remainingChildren = group.children.filter(child => child.taskStatus === Task.Status.Available || child.taskStatus === Task.Status.Blocked)
        form.addField(new Form.Field.Option(
          'taskLocation',
          'Insert after',
          ['beginning', ...remainingChildren, 'new'],
          ['(beginning)', ...remainingChildren.map(child => child.name), 'New action group'],
          remainingChildren[remainingChildren.length - 1] || 'beginning'))
        form.addField(new Form.Field.Checkbox('appendAsNote', 'Append to note', false))
        await form.show('Task Location', 'Move')
        if (form.values.taskLocation === 'new') {
          await addActionGroup(group)
        }
        appendAsNote = form.values.appendAsNote
        if (appendAsNote) {
          for (const task of tasks) {
            form.values.taskLocation.note = form.values.taskLocation.note + '\n- ' + task.name
            deleteObject(task)
          }
        }
        return (form.values.taskLocation === 'beginning') ? group.beginning : form.values.taskLocation.after
      }
      const location = setPosition ? await locationForm() : group.ending
      // check if there are tags before moving - if none action group tag will be inherited and needs to be removed
      const hasExistingTags = tasks.map(task => task.tags.length > 0)
      if (!appendAsNote) {
        moveTasks(tasks, location)
        save()
        for (let i = 0; i < tasks.length; i++) {
          if (!hasExistingTags[i]) tasks[i].removeTag(tag)
        }
      }

      // store last moved task as preference
      preferences.write('lastMovedID', tasks[0].id.primaryKey)
    }

    // FUNCTION: prompt user for the name of a new action group, create and move
    const addActionGroup = async (location) => {
      const form = new Form()
      form.addField(new Form.Field.String('groupName', 'Group Name'))
      form.addField(new Form.Field.Checkbox('tagNewGroup', 'Apply action group tag', lib.autoInclude() === 'none'))
      await form.show('Action Group Name', 'Create and Move')

      const group = new Task(form.values.groupName, location.ending)
      if (form.values.tagNewGroup) group.addTag(tag)
      await promptAndMove(tasks, group)
    }

    // get currently assigned project - if none show prompt
    const proj = tasks[0].assignedContainer !== null ? tasks[0].assignedContainer : await lib.projectPrompt()

    // check that a tag has been assigned to all tasks, if that setting is enabled - and if not show prompt and assign
    if (lib.tagPrompt() && tasks.some(task => task.tags.length === 0)) await lib.addTags(tasks)

    // select action group from selected project
    const actionGroupPrompt = await lib.actionGroupPrompt(proj)
    const actionGroupForm = await actionGroupPrompt.show('Select Action Group', 'Move')
    setPosition = actionGroupForm.values.setPosition

    switch (actionGroupForm.values.actionGroup) {
      case 'New action group':
        await addActionGroup(proj)
        break
      case 'Add to root of project':
        await promptAndMove(tasks, proj)
        break
      default:
        await promptAndMove(tasks, actionGroupForm.values.actionGroup)
    }
  })

  action.validate = selection => {
    if (selection.tasks.length < 1) return false

    const project = selection.tasks[0].containingProject || selection.tasks[0].assignedContainer
    return selection.tasks.every(task => task.containingProject === project || task.assignedContainer === project)
  }

  return action
})()
