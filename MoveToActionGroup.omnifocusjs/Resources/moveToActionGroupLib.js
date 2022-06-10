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

    return form
  }

  lib.projectPrompt = async () => {
    // show form
    const projectForm = await lib.searchForm(projectsMatching)
    const form = await projectForm.show('Select a project', 'Continue')

    // PROCESSING USING THE DATA EXTRACTED FROM THE FORM
    const textValue = form.values.textInput
    const menuItemIndex = form.values.menuItem
    const results = projectsMatching(textValue)
    return results[menuItemIndex]
  }

  return lib
})()
