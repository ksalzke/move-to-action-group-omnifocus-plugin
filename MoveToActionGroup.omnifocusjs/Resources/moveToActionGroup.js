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
          ['beginning', ...remainingChildren],
          ['(beginning)', ...remainingChildren.map(child => child.name)],
          remainingChildren[remainingChildren.length - 1]))
        form.addField(new Form.Field.Checkbox('appendAsNote', 'Append to note', false))
        await form.show('Task Location', 'Move')
        appendAsNote = form.values.appendAsNote
        if (form.values.appendAsNote) {
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
    const addActionGroup = async () => {
      const form = new Form()
      form.addField(new Form.Field.String('groupName', 'Group Name'))
      form.addField(new Form.Field.Checkbox('tagNewGroup', 'Apply action group tag', lib.autoInclude() === 'none'))
      await form.show('Action Group Name', 'Create and Move')

      const group = new Task(form.values.groupName, proj.ending)
      if (form.values.tagNewGroup) group.addTag(tag)
      await promptAndMove(tasks, group)
    }

    // FUNCTION: show search form - adapted from code shared by Sal Soghoian
    const searchForm = async (matchingFunction, prompt) => {
      const form = new Form()

      // search box
      form.addField(new Form.Field.String('textInput', 'Search', null))

      // result box
      const searchResults = []
      const searchResultIndexes = []
      const popupMenu = new Form.Field.Option('menuItem', 'Results', searchResultIndexes, searchResults, null)
      popupMenu.allowsNull = true
      popupMenu.nullOptionTitle = 'No Results'
      form.addField(popupMenu)

      // validation
      form.validate = function (formObject) {
        const textValue = formObject.values.textInput
        if (!textValue) { return false }
        if (textValue !== currentValue) {
          currentValue = textValue
          // remove popup menu
          if (form.fields.length === 2) {
            form.removeField(form.fields[1])
          }
        }

        if (form.fields.length === 1) {
          // search using provided string
          const searchResults = matchingFunction(textValue)
          const resultIndexes = []
          const resultTitles = searchResults.map((item, index) => {
            resultIndexes.push(index)
            return item.name
          })
          // add new popup menu
          const popupMenu = new Form.Field.Option(
            'menuItem',
            'Results',
            resultIndexes,
            resultTitles,
            resultIndexes[0]
          )
          form.addField(popupMenu)
          return false
        }
        if (form.fields.length === 2) {
          const menuValue = formObject.values.menuItem
          if (menuValue === undefined || String(menuValue) === 'null') { return false }
          return true
        }
      }

      // show form
      let currentValue = ''
      await form.show(prompt, 'Continue')

      // PROCESSING USING THE DATA EXTRACTED FROM THE FORM
      const textValue = form.values.textInput
      const menuItemIndex = form.values.menuItem
      const results = matchingFunction(textValue)
      return results[menuItemIndex]
    }

    // get currently assigned project - if none show warning
    const proj = tasks[0].assignedContainer !== null ? tasks[0].assignedContainer : await searchForm(projectsMatching, 'Select a project')
    if (proj === null) {
      const message = tasks.length > 1 ? 'The selected tasks have not been assigned to a project.' : 'The selected task has not been assigned to a project'
      const warning = new Alert('No Project', message)
      warning.show()
      return
    }

    // check that a tag has been assigned to all tasks
    const untagged = tasks.filter(task => task.tags.length === 0)
    if (untagged.length > 0) {
      const another = new Alert('Add another tag?', '')
      another.addOption('Yes')
      another.addOption('No')
      let index = 0
      while (index === 0) {
        const tag = await searchForm(tagsMatching, 'Select a tag to apply to untagged tasks')
        untagged.forEach(task => task.addTag(tag))
        index = await another.show()
      }
    }

    // check which action groups exist
    const actionGroups = proj.flattenedTasks.filter(task => {
      if (task.tags.includes(tag)) return true
      if (lib.autoInclude() === 'all' && task.hasChildren) return true
      if (lib.autoInclude() === 'top' && task.hasChildren && task.parent.project !== null) return true
      else return false
    })

    const groups = actionGroups.filter(task => task.taskStatus === Task.Status.Available || task.taskStatus === Task.Status.Blocked)

    // if there are relevant action groups show selection form
    const getGroupPath = (task) => {
      const getPath = (task) => {
        if (task.parent === task.containingProject.task) return task.name
        else return `${getPath(task.parent)} > ${task.name}`
      }
      return getPath(task)
    }

    if (groups.length > 0) {
      const form = new Form()
      const actionGroupSelect = new Form.Field.Option('actionGroup', 'Action Group', [...groups, 'New action group'], [...groups.map(getGroupPath), 'New action group'], groups[0], 'No action group')
      actionGroupSelect.allowsNull = true
      form.addField(actionGroupSelect)
      form.addField(new Form.Field.Checkbox('setPosition', 'Set position', setPosition))
      await form.show('Select Action Group', 'Move')
      setPosition = form.values.setPosition
      if (form.values.actionGroup === 'New action group') await addActionGroup()
      else await promptAndMove(tasks, form.values.actionGroup)
    }

    // if there are none show warning
    if (groups.length === 0) {
      const form = new Form()
      const actions = ['Add group', 'Add to root of project']
      form.addField(new Form.Field.Option('action', 'Action', actions, actions, actions[0]))
      form.addField(new Form.Field.Checkbox('setPosition', 'Show in project after moving', setPosition))
      await form.show('There were no action groups found in this project.\n What would you like to do?', 'OK')

      setPosition = form.values.setPosition

      switch (form.values.action) {
        case 'Add group':
          await addActionGroup()
          break
        case 'Add to root of project':
          await promptAndMove(tasks, proj)
          break
      }
    }
  })

  action.validate = selection => {
    if (selection.tasks.length < 1) return false

    const project = selection.tasks[0].containingProject || selection.tasks[0].assignedContainer
    return selection.tasks.every(task => task.containingProject === project || task.assignedContainer === project)
  }

  return action
})()
