/* global PlugIn Form flattenedTags */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    const lib = PlugIn.find('com.KaitlinSalzke.MoveToActionGroup').libraries[0]
    const syncedPrefs = lib.loadSyncedPrefs()

    // get current preferences or set defaults if they don't yet exist
    const actionGroupTag = lib.prefTag('actionGroupTag')
    const autoInclude = lib.autoInclude()

    // create and show form
    const form = new Form()
    const tagNames = flattenedTags.map(t => t.name)
    form.addField(new Form.Field.Option('actionGroupTag', 'Action Group Tag', flattenedTags, tagNames, actionGroupTag, null))
    form.addField(new Form.Field.Option('autoInclude', 'Automatically Include Action Groups', ['none', 'top', 'all'], ['None', 'Top-Level', 'All'], autoInclude))
    await form.show('Preferences: Move To Action Group', 'OK')

    // save preferences
    syncedPrefs.write('actionGroupTagID', form.values.actionGroupTag.id.primaryKey)
    syncedPrefs.write('autoInclude', form.values.autoInclude)
  })

  action.validate = function (selection, sender) {
    return true
  }

  return action
})()
