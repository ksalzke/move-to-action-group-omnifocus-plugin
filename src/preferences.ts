interface PrefForm extends Form {
  values: {
    actionGroupTag?: Tag
    autoInclude?: 'none' | 'top' | 'all' | 'all tasks'
    tagPrompt?: boolean
    projectPrompt?: boolean
    inheritTags?: boolean
  }
}


(() => {
  const action = new PlugIn.Action(async function (_selection: Selection, _sender) {
    const lib: ActionGroupLib = PlugIn.find('com.KaitlinSalzke.MoveToActionGroup', null).libraries[0]
    const syncedPrefs = lib.loadSyncedPrefs()

    // get current preferences or set defaults if they don't yet exist
    const actionGroupTag = lib.prefTag('actionGroupTag')
    const autoInclude = lib.autoInclude()
    const tagPrompt = lib.tagPrompt()
    const projectPrompt = lib.promptForProject()
    const inheritTags = lib.inheritTags()

    // create and show form
    const form: PrefForm = new Form()
    const tagNames = flattenedTags.map(t => t.name)
    form.addField(new Form.Field.Option('actionGroupTag', 'Action Group Tag', flattenedTags, tagNames, actionGroupTag, null), null)
    form.addField(new Form.Field.Option('autoInclude', 'Automatically Include Action Groups', ['none', 'top', 'all', 'all tasks'], ['None', 'Top-Level', 'All Action Groups', 'All Tasks'], autoInclude, null), null)
    form.addField(new Form.Field.Checkbox('tagPrompt', 'Prompt for Tags', tagPrompt), null)
    form.addField(new Form.Field.Checkbox('projectPrompt', 'Prompt for Projects', projectPrompt), null)
    form.addField(new Form.Field.Checkbox('inheritTags', 'Inherit Tags When Moving', inheritTags), null)
    await form.show('Preferences: Move To Action Group', 'OK')

    // save preferences
    syncedPrefs.write('actionGroupTagID', form.values.actionGroupTag.id.primaryKey)
    syncedPrefs.write('autoInclude', form.values.autoInclude)
    syncedPrefs.write('tagPrompt', form.values.tagPrompt)
    syncedPrefs.write('projectPrompt', form.values.projectPrompt)
    syncedPrefs.write('inheritTags', form.values.inheritTags)
  })

  action.validate = function (_selection, _sender) {
    return true
  }

  return action
})()
