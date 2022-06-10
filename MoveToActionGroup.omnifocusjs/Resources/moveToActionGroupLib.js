/* global PlugIn Version Device Alert Tag */
(() => {

  const preferences = new Preferences()

  const lib = new PlugIn.Library(new Version('1.0'))

  lib.goTo = async (task) => {
    if (Device.current.mac) await document.newTabOnWindow(document.windows[0]) // new tab - only Mac supported
    URL.fromString('omnifocus:///task/' + task.containingProject.id.primaryKey).call(() => {})
    URL.fromString('omnifocus:///task/' + task.id.primaryKey).call(() => {})
  }

  lib.loadSyncedPrefs = () => {
    const syncedPrefsPlugin = PlugIn.find('com.KaitlinSalzke.SyncedPrefLibrary')

    if (syncedPrefsPlugin !== null) {
      const SyncedPref = syncedPrefsPlugin.library('syncedPrefLibrary').SyncedPref
      return new SyncedPref('com.KaitlinSalzke.MoveToActionGroup')
    } else {
      const alert = new Alert(
        'Synced Preferences Library Required',
        'For the Move To Action Group plug-in to work correctly, the \'Synced Preferences for OmniFocus\' plug-in (https://github.com/ksalzke/synced-preferences-for-omnifocus) is also required and needs to be added to the plug-in folder separately. Either you do not currently have this plugin installed, or it is not installed correctly.'
      )
      alert.show()
    }
  }

  lib.prefTag = prefTag => {
    const preferences = lib.loadSyncedPrefs()
    const tagID = preferences.readString(`${prefTag}ID`)

    if (tagID !== null && Tag.byIdentifier(tagID) !== null) return Tag.byIdentifier(tagID)
    return null
  }

  lib.getPrefTag = async (prefTag) => {
    const tag = lib.prefTag(prefTag)

    if (tag !== null) return tag
    // if not set, show preferences pane and then try again)
    await this.action('preferences').perform()
    return lib.getPrefTag(prefTag)
  }

  lib.autoInclude = () => {
    const preferences = lib.loadSyncedPrefs()

    const setting = preferences.readString('autoInclude')
    if (['none', 'top', 'all'].includes(setting)) return setting
    else return 'none'
  }

  lib.tagPrompt = () => {
    const preferences = lib.loadSyncedPrefs()
    return preferences.readBoolean('tagPrompt')
  }

  lib.searchForm = async (matchingFunction) => {
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

    let currentValue = ''

    // validation
    form.validate = function (formObject) {
      const textValue = formObject.values.textInput
      if (!textValue) { return false }
      if (textValue !== currentValue) {
        currentValue = textValue
        // remove popup menu
        if (form.fields.some(field => field.key === 'menuItem')) {
          form.removeField(form.fields.find(field => field.key === 'menuItem'))
        }
      }

      if (!form.fields.some(field => field.key === 'menuItem')) {
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
        form.addField(popupMenu, 1)
        return false
      }
      else {
        const menuValue = formObject.values.menuItem
        if (menuValue === undefined || String(menuValue) === 'null') { return false }
        return true
      }
    }

    return form
  }

  lib.projectPrompt = async () => {
    // show form
    const projectForm = await lib.searchForm(projectsMatching)
    const form = await projectForm.show('Select a project', 'Continue')

    // processing
    const textValue = form.values.textInput
    const menuItemIndex = form.values.menuItem
    const results = projectsMatching(textValue)
    return results[menuItemIndex]
  }

  lib.tagForm = async () => {
    const form = await lib.searchForm(tagsMatching)
    form.addField(new Form.Field.Checkbox('another', 'Add another?', false))
    return form
  }

  lib.addTags = async (tasks) => {
    const untagged = tasks.filter(task => task.tags.length === 0)

    let form
    do {
      const tagForm = await lib.tagForm()
      form = await tagForm.show('Select a tag to apply to untagged tasks', 'OK')
      const textValue = form.values.textInput
      const menuItemIndex = form.values.menuItem
      const tag = tagsMatching(textValue)[menuItemIndex]

      untagged.forEach(task => task.addTag(tag))
    } while (form.values.another)
  }

  lib.potentialActionGroups = async (proj) => {
    const tag = await lib.getPrefTag('actionGroupTag')
    const allActionGroups = proj.flattenedTasks.filter(task => {
      if (task.tags.includes(tag)) return true
      if (lib.autoInclude() === 'all' && task.hasChildren) return true
      if (lib.autoInclude() === 'top' && task.hasChildren && task.parent.project !== null) return true
      else return false
    })

    const availableActionGroups = allActionGroups.filter(task => task.taskStatus === Task.Status.Available || task.taskStatus === Task.Status.Blocked)

    return availableActionGroups
  }

  lib.actionGroupPrompt = async (proj) => {
    const getGroupPath = (task) => {
      const getPath = (task) => {
        if (task.parent === task.containingProject.task) return task.name
        else return `${getPath(task.parent)} > ${task.name}`
      }
      return getPath(task)
    }
    const groups = await lib.potentialActionGroups(proj)
    const selection = (groups.length) > 0 ? groups[0] : 'Add to root of project'

    const form = new Form()
    const actionGroupSelect = new Form.Field.Option('actionGroup', 'Action Group', [...groups, 'New action group', 'Add to root of project'], [...groups.map(getGroupPath), 'New action group', 'Add to root of project'], selection)
    form.addField(actionGroupSelect)
    form.addField(new Form.Field.Checkbox('setPosition', 'Set position', false))
    return form
  }

  lib.locationForm = async (group) => {
    const form = new Form()
    const remainingChildren = group.children.filter(child => child.taskStatus === Task.Status.Available || child.taskStatus === Task.Status.Blocked)
    form.addField(new Form.Field.Option(
      'taskLocation',
      'Insert after',
      ['beginning', ...remainingChildren, 'new'],
      ['(beginning)', ...remainingChildren.map(child => child.name), 'New action group'],
      remainingChildren[remainingChildren.length - 1] || 'beginning'))
    form.addField(new Form.Field.Checkbox('appendAsNote', 'Append to note', false))

    return form
  }

  lib.selectLocation = async (tasks, group) => {
    const form = await lib.locationForm(group)
    await form.show('Task Location', 'Move')
    if (form.values.taskLocation === 'new') {
      console.log('new selected')
      await lib.moveToNewActionGroup(tasks, group)
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

  lib.moveToNewActionGroup = async (tasks, location) => {
    const tag = await lib.getPrefTag('actionGroupTag')

    const form = new Form()
    form.addField(new Form.Field.String('groupName', 'Group Name'))
    form.addField(new Form.Field.Checkbox('tagNewGroup', 'Apply action group tag', lib.autoInclude() === 'none'))
    await form.show('Action Group Name', 'Create and Move')

    const newGroup = new Task(form.values.groupName, location)
    if (form.values.tagNewGroup) newGroup.addTag(tag)
    lib.moveTasks(tasks, newGroup, false)
  }

  lib.moveTasks = async (tasks, location, setPosition) => {
    const loc = setPosition ? await lib.selectLocation(tasks, location) : location.ending

    // check if there are tags before moving - if none action group tag will be inherited and needs to be removed
    const hasExistingTags = tasks.map(task => task.tags.length > 0)
    moveTasks(tasks, loc)
    save()
    for (let i = 0; i < tasks.length; i++) {
      if (!hasExistingTags[i]) tasks[i].removeTag(tag)
    }

    // store last moved task as preference
    preferences.write('lastMovedID', tasks[0].id.primaryKey)
  }

  return lib
})()
