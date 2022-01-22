/* global PlugIn flattenedTags Alert Form moveTasks Task save projectsMatching tagsMatching Device */
(() => {
  const action = new PlugIn.Action(async selection => {
    const tag = flattenedTags.byName('Action Group')

    const tasks = selection.tasks
    let goToSetting = false

    // FUNCTION: allow user to select location of child task
    const promptAndMove = async (tasks, group) => {
      const locationForm = async () => {
        const form = new Form()
        form.addField(new Form.Field.Option(
          'taskLocation',
          'Insert after',
          ['beginning', ...group.children],
          ['(beginning)', ...group.children.map(child => child.name)],
          group.children[group.children.length - 1]))
        form.addField(new Form.Field.Checkbox('goTo', 'Show task in project after moving', goToSetting))
        await form.show('Task Location', 'Move')
        goToSetting = form.values.goTo
        return (form.values.taskLocation === 'beginning') ? group.beginning : form.values.taskLocation.after
      }
      const location = group.flattenedTasks.length < 1 ? group.ending : await locationForm()
      // check if there are tags before moving - if none action group tag will be inherited and needs to be removed
      const hasExistingTags = tasks.map(task => task.tags.length > 0)
      moveTasks(tasks, location)
      save()
      for (let i = 0; i < tasks.length; i++) {
        if (!hasExistingTags[i]) tasks[i].removeTag(tag)
      }
    }

    // FUNCTION: prompt user for the name of a new action group, create and move
    const addActionGroup = async () => {
      const form = new Form()
      form.addField(new Form.Field.String('groupName', 'Group Name'))
      await form.show('Action Group Name', 'Create and Move')
      const group = new Task(form.values.groupName, proj.ending)
      group.addTag(tag)
      await promptAndMove(tasks, group)
    }

    // FUNCITON: show search form - adapted from code shared by Sal Soghoian
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

    // FUNCTION: go to a task
    const goTo = async (task) => {
      // new tab - only Mac supported
      if (Device.current.mac) await document.newTabOnWindow(document.windows[0])
      URL.fromString('omnifocus:///task/' + task.containingProject.id.primaryKey).call(() => {})
      URL.fromString('omnifocus:///task/' + task.id.primaryKey).call(() => {})
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
    const groups = proj.flattenedTasks.filter(task => task.tags.includes(tag) && (task.taskStatus === Task.Status.Available || task.taskStatus === Task.Status.Blocked))

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
      form.addField(new Form.Field.Checkbox('goTo', 'Show task in project after moving', goToSetting))
      await form.show('Select Action Group', 'Move')
      goToSetting = form.values.goTo
      if (form.values.actionGroup === 'New action group') await addActionGroup()
      else await promptAndMove(tasks, form.values.actionGroup)
      if (goToSetting) goTo(tasks[0])
    }

    // if there are none show warning
    if (groups.length === 0) {
      const warning = new Alert('No Action Groups', 'There are no action groups with the relevant tag in this project.')
      warning.addOption('Add group')
      warning.addOption('Add group and show task in project')
      warning.addOption('OK')
      const alertIndex = await warning.show()
      if (alertIndex === 0) await addActionGroup()
      if (alertIndex === 1) {
        await addActionGroup()
        goTo(tasks[0])
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
