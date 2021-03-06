/* global PlugIn Form flattenedTags */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    const lib = PlugIn.find('com.KaitlinSalzke.MoveToActionGroup').libraries[0]
    const syncedPrefs = lib.loadSyncedPrefs()

    // get current preferences or set defaults if they don't yet exist
    const actionGroupTag = lib.prefTag('actionGroupTag')
    const autoInclude = lib.autoInclude()
    const tagPrompt = lib.tagPrompt()
    const projectPrompt = lib.promptForProject()

    // create and show form
    const form = new Form()
    const tagNames = flattenedTags.map(t => t.name)
    form.addField(new Form.Field.Option('actionGroupTag', 'Action Group Tag', flattenedTags, tagNames, actionGroupTag, null))
    form.addField(new Form.Field.Option('autoInclude', 'Automatically Include Action Groups', ['none', 'top', 'all'], ['None', 'Top-Level', 'All'], autoInclude))
    form.addField(new Form.Field.Checkbox('tagPrompt', 'Prompt for Tags', tagPrompt))
    form.addField(new Form.Field.Checkbox('projectPrompt', 'Prompt for Projects', projectPrompt))
    await form.show('Preferences: Move To Action Group', 'OK')

    // save preferences
    syncedPrefs.write('actionGroupTagID', form.values.actionGroupTag.id.primaryKey)
    syncedPrefs.write('autoInclude', form.values.autoInclude)
    syncedPrefs.write('tagPrompt', form.values.tagPrompt)
    syncedPrefs.write('projectPrompt', form.values.projectPrompt)
  })

  action.validate = function (selection, sender) {
    return true
  }

  return action
})()
