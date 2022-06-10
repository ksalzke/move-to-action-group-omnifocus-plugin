/* global PlugIn Version Device Alert Tag */
(() => {
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
      console.log('another? : '+ form.values.another)
    } while (form.values.another)
  }

  lib.potentialActionGroups = async (proj) => {
    console.log('in potentialActionGroups')
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
    console.log('in actionGroupPrompt')

    const getGroupPath = (task) => {
      const getPath = (task) => {
        if (task.parent === task.containingProject.task) return task.name
        else return `${getPath(task.parent)} > ${task.name}`
      }
      return getPath(task)
    }

    const groups = await lib.potentialActionGroups(proj)
    console.log('potential action groups: ' + groups)

    const selection = (groups.length) > 0 ? groups[0] : 'Add to root of project'

    console.log('about to create action group prompt form')
    const form = new Form()
    const actionGroupSelect = new Form.Field.Option('actionGroup', 'Action Group', [...groups, 'New action group', 'Add to root of project'], [...groups.map(getGroupPath), 'New action group', 'Add to root of project'], selection)
    form.addField(actionGroupSelect)
    console.log('selection added')
    form.addField(new Form.Field.Checkbox('setPosition', 'Set position', false))
    console.log('form created')
    return form
  }

  return lib
})()
