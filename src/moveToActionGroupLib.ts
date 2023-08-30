
interface SyncedPref {
  id: string
  read: (key: string) => any
  readNumber: (key: string) => number | null
  readString(id: string): string | null
  readBoolean(id: string): boolean
  write(key: string, value: any): void
}

declare var SyncedPref: {
  new(id: string): SyncedPref
}

interface SyncedPrefLib extends PlugIn.Library {
  SyncedPref?: typeof SyncedPref
}

interface ActionGroupLib extends PlugIn.Library {
  goTo?: (task: Task) => Promise<void>
  loadSyncedPrefs?: () => SyncedPref
  getFuzzySearchLib?: () => FuzzySearchLibrary
  prefTag?: (prefTag: string) => Tag | null
  getPrefTag?: (prefTag: string) => Promise<Tag>
  autoInclude?: () => 'none' | 'top' | 'all' | 'all tasks'
  tagPrompt?: () => boolean
  promptForProject?: () => boolean
  inheritTags?: () => boolean
  moveToTopOfFolder?: () => boolean
  projectPrompt?: () => Promise<Project | Folder>
  tagForm?: () => Promise<TagForm>
  addTags?: (tasks: Task[]) => Promise<void>
  potentialActionGroups?: (proj: Project | null) => Promise<Task[]>
  actionGroupPrompt?: (tasks: Task[], proj: Project | null) => Promise<void>
  locationForm?: (group: Task | Project) => Promise<LocationForm>
  selectLocation?: (tasks: Task[], group: Task | Project) => Promise<Task | Task.ChildInsertionLocation>
  moveToNewActionGroup?: (tasks: Task[], location: Project | Task | Task.ChildInsertionLocation) => Promise<void>
  moveTasks?: (tasks: Task[], location: Project | Task, setPosition: boolean) => Promise<void>
}

interface FuzzySearchLibrary extends PlugIn.Library {
  getTaskPath?: (task: Task) => string
  searchForm?: (allItems: any, itemTitles: string[], firstSelected: any, matchingFunction: Function | null) => FuzzySearchForm
  allTasksFuzzySearchForm?: () => FuzzySearchForm
  remainingTasksFuzzySearchForm?: () => FuzzySearchForm
  activeTagsFuzzySearchForm?: () => FuzzySearchForm
}

interface FuzzySearchForm extends Form {
  values: {
    textInput?: string
    menuItem?: any
  }
}

interface ProjectForm extends Form {
  values: {
    textInput?: string
    menuItem?: any
  }
}

interface TagForm extends Form {
  values: {
    another?: boolean
    textInput?: string
    menuItem?: any
  }
}

interface ActionGroupForm extends Form {
  values: {
    textInput?: string
    menuItem?: any
    setPosition?: boolean
  }
}

interface LocationForm extends Form {
  values: {
    taskLocation?: 'beginning' | 'new' | Task
    appendAsNote?: boolean
  }
}

interface MoveForm extends Form {
  values: {
    groupName?: string
    completeWithLast?: boolean
    tagNewGroup?: boolean
  }
}


(() => {

  const preferences = new Preferences(null)

  const lib: ActionGroupLib = new PlugIn.Library(new Version('1.0'))

  lib.goTo = async (task) => {
    if (Device.current.mac) await document.newTabOnWindow(document.windows[0]) // new tab - only Mac supported
    URL.fromString('omnifocus:///task/' + task.containingProject.id.primaryKey).open()
    URL.fromString('omnifocus:///task/' + task.id.primaryKey).open()
  }

  lib.loadSyncedPrefs = (): SyncedPref | null => {
    const syncedPrefsPlugin = PlugIn.find('com.KaitlinSalzke.SyncedPrefLibrary', null)

    if (syncedPrefsPlugin !== null) {
      const syncedPrefLib: SyncedPrefLib = syncedPrefsPlugin.library('syncedPrefLibrary')
      const SyncedPref: SyncedPref = new syncedPrefLib.SyncedPref('com.KaitlinSalzke.followUpTask')
      return SyncedPref
    } else {
      const alert = new Alert(
        'Synced Preferences Library Required',
        'For the Move To Action Group plug-in to work correctly, the \'Synced Preferences for OmniFocus\' plug-in (https://github.com/ksalzke/synced-preferences-for-omnifocus) is also required and needs to be added to the plug-in folder separately. Either you do not currently have this plugin installed, or it is not installed correctly.'
      )
      alert.show(null)
    }
  }

  lib.getFuzzySearchLib = (): FuzzySearchLibrary => {
    const fuzzySearchPlugIn = PlugIn.find('com.KaitlinSalzke.fuzzySearchLib', null)
    if (!fuzzySearchPlugIn) {
      const alert = new Alert(
        'Fuzzy Search Library Required',
        'For the Follow-Up Task plug-in to work correctly, the \'Fuzzy Search\' plug-in (https://github.com/ksalzke/fuzzy-search-library) is also required and needs to be added to the plug-in folder separately. Either you do not currently have this plugin installed, or it is not installed correctly.'
      )
      alert.show(null)
    }
    return fuzzySearchPlugIn.library('fuzzySearchLib')
  }

  lib.prefTag = (prefTag: string): Tag | null => {
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

  lib.autoInclude = (): 'none' | 'top' | 'all' | 'all tasks' => {
    const preferences = lib.loadSyncedPrefs()

    const setting = preferences.readString('autoInclude')
    // @ts-ignore ignore re 'setting' properties*/
    if (['none', 'top', 'all', 'all tasks'].includes(setting)) return setting
    else return 'none'
  }

  lib.tagPrompt = () => {
    const preferences = lib.loadSyncedPrefs()
    return preferences.readBoolean('tagPrompt')
  }

  lib.promptForProject = () => {
    const preferences = lib.loadSyncedPrefs()
    if (preferences.read('projectPrompt') !== null) return preferences.read('projectPrompt') // TODO: rename setting to 'section prompt'
    else return true
  }

  lib.inheritTags = () => {
    const preferences = lib.loadSyncedPrefs()
    if (preferences.read('inheritTags') !== null) return preferences.read('inheritTags')
    else return true
  }

  lib.moveToTopOfFolder = (): boolean => {
    const preferences = lib.loadSyncedPrefs()
    if (preferences.read('moveToTopOfFolder') !== null) return preferences.read('moveToTopOfFolder')
    else return false // TODO: consolidate actions into one 'get preference' action
  }

  lib.projectPrompt = async () => { // TODO: rename to sectionPrompt
    const syncedPrefs = lib.loadSyncedPrefs()
    const fuzzySearchLib = lib.getFuzzySearchLib()

    const activeSections = flattenedSections.filter(section => [Project.Status.Active, Project.Status.OnHold, Folder.Status.Active].includes(section.status))
    const lastSelectedID = syncedPrefs.read('lastSelectedProjectID')
    const lastSelectedSection = (lastSelectedID === null) ? null : Project.byIdentifier(lastSelectedID) || Folder.byIdentifier(lastSelectedID)

    const sectionForm: ProjectForm = fuzzySearchLib.searchForm(activeSections, activeSections.map(p => p.name), lastSelectedSection, null) // TODO: return fuzzy matching for projects and folders
    await sectionForm.show('Select a project or folder', 'Continue')
    const section = sectionForm.values.menuItem

    // save project for next time
    syncedPrefs.write('lastSelectedProjectID', section.id.primaryKey)
    return section
  }

  lib.tagForm = async () => {
    const fuzzySearchLib = lib.getFuzzySearchLib()
    const form = fuzzySearchLib.activeTagsFuzzySearchForm()
    form.addField(new Form.Field.Checkbox('another', 'Add another?', false), null)
    return form
  }

  lib.addTags = async (tasks) => {
    const untagged = tasks.filter(task => task.tags.length === 0)

    let form: TagForm
    do {
      // show form
      const tagForm = await lib.tagForm()
      form = await tagForm.show('Select a tag to apply to untagged tasks', 'OK')

      const tag = tagForm.values.menuItem

      untagged.forEach(task => task.addTag(tag))
    } while (form.values.another)
  }

  lib.potentialActionGroups = async (proj) => {
    const tag = await lib.getPrefTag('actionGroupTag')

    const allTasks = (proj === null) ? flattenedTasks : proj.flattenedTasks

    const allActionGroups = allTasks.filter(task => {
      if (task.project !== null) return false
      if (task.tags.includes(tag)) return true
      if (lib.autoInclude() === 'all tasks') return true
      if (lib.autoInclude() === 'all' && task.hasChildren) return true
      if (lib.autoInclude() === 'top' && task.hasChildren && task.parent.project !== null) return true
      else return false
    })

    const availableActionGroups = allActionGroups.filter(task => ![Task.Status.Completed, Task.Status.Dropped].includes(task.taskStatus))

    return availableActionGroups
  }

  lib.actionGroupPrompt = async (tasks, proj) => {
    const fuzzySearchLib = lib.getFuzzySearchLib()
    const groups = await lib.potentialActionGroups(proj)

    const additionalOptions = lib.promptForProject() ? ['Add to root of project', 'New action group'] : []

    const formOptions = [...groups, ...additionalOptions]
    const formLabels = [...groups.map(fuzzySearchLib.getTaskPath), ...additionalOptions]
    const searchForm = fuzzySearchLib.searchForm(formOptions, formLabels, formOptions[0], null)
    searchForm.addField(new Form.Field.Checkbox('setPosition', 'Set position', false), null)

    const actionGroupForm: ActionGroupForm = await searchForm.show('Select Action Group', 'OK')

    const actionGroup = searchForm.values.menuItem
    const setPosition = actionGroupForm.values.setPosition

    switch (actionGroup) {
      case 'New action group':
        await lib.moveToNewActionGroup(tasks, proj)
        break
      case 'Add to root of project':
        lib.moveTasks(tasks, proj, setPosition)
        break
      default:
        // @ts-ignore after above have run actionGroup can only be a Task // TODO: review
        lib.moveTasks(tasks, actionGroup, setPosition)
    }

    return
  }

  lib.locationForm = async (group) => {
    const form = new Form()
    const remainingChildren = group.children.filter(child => child.taskStatus === Task.Status.Available || child.taskStatus === Task.Status.Blocked)
    form.addField(new Form.Field.Option(
      'taskLocation',
      'Insert after',
      ['beginning', ...remainingChildren, 'new'],
      ['(beginning)', ...remainingChildren.map(child => child.name), 'New action group'],
      remainingChildren[remainingChildren.length - 1] || 'beginning',
      null), null)
    form.addField(new Form.Field.Checkbox('appendAsNote', 'Append to note', false), null)

    return form
  }

  lib.selectLocation = async (tasks, group) => {
    const form = await lib.locationForm(group)
    await form.show('Task Location', 'Move')
    if (form.values.taskLocation === 'new') await lib.moveToNewActionGroup(tasks, group)
    const appendAsNote = form.values.appendAsNote
    if (appendAsNote) {
      for (const task of tasks) {
        // @ts-ignore // TODO: come back and review this
        form.values.taskLocation.note = form.values.taskLocation.note + '\n- ' + task.name
        deleteObject(task)
      }
    }
    // @ts-ignore // TODO: come back and review this
    return (form.values.taskLocation === 'beginning') ? group.beginning : form.values.taskLocation.after
  }

  lib.moveToNewActionGroup = async (tasks, location) => {
    const tag = await lib.getPrefTag('actionGroupTag')
    const inheritTags = lib.inheritTags()

    const form: MoveForm = new Form()
    form.addField(new Form.Field.String('groupName', 'Group Name', null, null), null)
    form.addField(new Form.Field.Checkbox('completeWithLast', 'Complete with last action', settings.boolForKey('OFMCompleteWhenLastItemComplete')), null)
    form.addField(new Form.Field.Checkbox('tagNewGroup', 'Apply action group tag', lib.autoInclude() === 'none'), null)
    await form.show('Action Group Name', 'Create and Move')

    const newGroup = new Task(form.values.groupName, location)
    newGroup.completedByChildren = form.values.completeWithLast
    if (form.values.tagNewGroup) newGroup.addTag(tag)
    lib.moveTasks(tasks, newGroup, false)
  }

  lib.moveTasks = async (tasks, location, setPosition) => {
    const loc = setPosition ? await lib.selectLocation(tasks, location) : location.ending
    const tag = await lib.getPrefTag('actionGroupTag')
    const inheritTags = lib.inheritTags()

    const hasExistingTags = tasks.map(task => task.tags.length > 0)
    moveTasks(tasks, loc)
    save()
    for (let i = 0; i < tasks.length; i++) {
      if (!hasExistingTags[i]) tasks[i].removeTag(tag)
      if (!hasExistingTags[i] && !inheritTags) tasks[i].clearTags()
    }

    // store last moved task as preference
    preferences.write('lastMovedID', tasks[0].id.primaryKey)
  }

  return lib
})()
