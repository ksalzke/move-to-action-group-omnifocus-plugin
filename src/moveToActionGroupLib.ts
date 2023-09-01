
// #region Type Definitions
/** ========================================================================
 **                            TYPE DEFINITIONS
 *========================================================================**/

//#region Helper Types
/*================== External =================*/

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

interface FuzzySearchLibrary extends PlugIn.Library {
  getTaskPath?: (task: Task) => string
  searchForm?: (allItems: any, itemTitles: string[], firstSelected: any, matchingFunction: Function | null) => FuzzySearchForm
  allTasksFuzzySearchForm?: () => FuzzySearchForm
  remainingTasksFuzzySearchForm?: () => FuzzySearchForm
  activeTagsFuzzySearchForm?: () => FuzzySearchForm
  activeFoldersFuzzySearchForm?: () => FuzzySearchForm
}

interface FuzzySearchForm extends Form {
  values: {
    textInput?: string
    menuItem?: any
  }
}

/*================== Forms =================*/

interface SectionForm extends Form {
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

interface NewProjectForm extends Form {
  values: {
    projectName?: string
  }
}

interface ActionGroupForm extends Form {
  values: {
    textInput?: string
    menuItem?: any
    setPosition?: boolean
  }
}

interface PositionForm extends Form {
  values: {
    taskLocation?: 'beginning' | 'new' | Task
    appendAsNote?: boolean
  }
}

interface NewActionGroupForm extends Form {
  values: {
    groupName?: string
    completeWithLast?: boolean
    tagNewGroup?: boolean
  }
}

//#endregion

/*================== LIBRARY =================*/

interface ActionGroupLib extends PlugIn.Library {
  // main logic
  processTasks?: (tasks: Task[], promptForProject: boolean, promptForFolder: boolean) => Promise<void>
  promptForSection?: (defaultSelection: Project | Folder, folder: Folder | null) => Promise<Project | Folder>
  promptForTags?: (tasks: Task[]) => Promise<void>
  createActionGroupAndMoveTasks?: (tasks: Task[], location: Task | Project) => Promise<void>
  moveTasks?: (tasks: Task[], location: Project | Task, setPosition: boolean) => Promise<void>
  promptForLocation?: (tasks: Task[], group: Task | Project) => Promise<Task | Task.ChildInsertionLocation>

  // get other libraries
  loadSyncedPrefs?: () => SyncedPref
  getFuzzySearchLib?: () => FuzzySearchLibrary

  // get preferences
  prefTag?: (prefTag: string) => Tag | null
  getPrefTag?: (prefTag: string) => Promise<Tag>
  autoInclude?: () => 'none' | 'top' | 'all' | 'all tasks'
  tagPrompt?: () => boolean
  inheritTags?: () => boolean
  moveToTopOfFolder?: () => boolean

  // return forms
  tagForm?: () => TagForm
  sectionForm?: (defaultSelection: Project | Folder, folder: Folder | null) => SectionForm
  newProjectForm?: () => NewProjectForm
  actionGroupForm?: (project: Project) => Promise<ActionGroupForm>
  positionForm?: (group: Task | Project) => PositionForm
  newActionGroupForm?: () => NewActionGroupForm

  // other helper functions
  potentialActionGroups?: (proj: Project | null) => Promise<Task[]>
  goTo?: (task: Task) => Promise<void>
  promptForFolder?: () => Promise<Folder>
}

// #endregion

(() => {

  const preferences = new Preferences(null)

  const lib: ActionGroupLib = new PlugIn.Library(new Version('1.0'))

  /**------------------------------------------------------------------------
   **                           MAIN LOGIC
   *------------------------------------------------------------------------**/

  lib.processTasks = async (tasks: Task[], promptForProject: boolean, promptForFolder: boolean) => {
    const syncedPrefs = lib.loadSyncedPrefs()

    // determine default selection - use current or assigned project if applicbale, otherwise use the last selected section
    const currentProject = tasks[0].containingProject
    const lastSelectedID = syncedPrefs.read('lastSelectedProjectID')
    const lastSelectedSection = (lastSelectedID === null) ? null : Project.byIdentifier(lastSelectedID) || Folder.byIdentifier(lastSelectedID)
    const defaultSelection = currentProject ?
      currentProject
      : (tasks[0].assignedContainer instanceof Project) ?
        tasks[0].assignedContainer
        : lastSelectedSection


    /*======= Prompt for folder (if relevant) =======*/
    const folder = (promptForFolder) ? await lib.promptForFolder() : null

    /*------- Prompt for section (if enabled) -------*/
    const section: null | Project | Folder = (promptForProject) ? await lib.promptForSection(defaultSelection, folder) : null

    /*------- Prompt for tag(s) (if enabled and no tags) -------*/
    if (lib.tagPrompt() && tasks.some(task => task.tags.length === 0)) await lib.promptForTags(tasks)

    /*------- Create new project if folder selected -------*/
    if (section instanceof Folder) {
      const location = lib.moveToTopOfFolder() ? section.beginning : section.ending
      const newProjects = convertTasksToProjects(tasks, location)
      for (const newProject of newProjects) newProject.addTag(lib.prefTag('newProjectTag'))
      return
    }

    /*------- Otherwise, prompt for action group based on project -------*/
    const actionGroupForm = await lib.actionGroupForm(section)
    await actionGroupForm.show('Select Action Group', 'OK')

    const actionGroupSelection: Task | 'New action group' | 'Add to root of project' = actionGroupForm.values.menuItem
    const setPosition = actionGroupForm.values.setPosition

    /*------- Create destination (if needed) and move -------*/
    // position is also set as part of moveTasks function
    switch (actionGroupSelection) {
      case 'New action group':
        await lib.createActionGroupAndMoveTasks(tasks, section)
        break
      case 'Add to root of project':
        await lib.moveTasks(tasks, section, setPosition)
        break
      default:
        await lib.moveTasks(tasks, actionGroupSelection, setPosition)
    }
  }

  lib.promptForSection = async (defaultSelection: Project | Folder, folder: Folder | null): Promise<Project | Folder> => {
    const syncedPrefs = lib.loadSyncedPrefs()
    const sectionForm = lib.sectionForm(defaultSelection, folder)
    await sectionForm.show('Select a project or folder', 'Continue')
    const section = sectionForm.values.menuItem

    if (section === 'New project') {
      const newProjectForm = lib.newProjectForm()
      await newProjectForm.show('New Project Name', 'Continue')

      const folderForm = lib.getFuzzySearchLib().activeFoldersFuzzySearchForm()
      await folderForm.show('Select a folder', 'Continue')

      const location = lib.moveToTopOfFolder() ? folderForm.values.menuItem.beginning : folderForm.values.menuItem.ending
      const newProject = new Project(newProjectForm.values.projectName, location)
      newProject.addTag(lib.prefTag('newProjectTag')) // TODO: stop being inherited by task
      return newProject
    } else {
      // save project for next time
      syncedPrefs.write('lastSelectedProjectID', section.id.primaryKey)
      return section
    }
  }

  lib.promptForTags = async (tasks) => {
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

  lib.createActionGroupAndMoveTasks = async (tasks: Task[], location: Task | Project) => {
    // create action group
    const newActionGroupForm = lib.newActionGroupForm()
    await newActionGroupForm.show('Action Group Name', 'Create')
    location = new Task(newActionGroupForm.values.groupName, location)
    location.completedByChildren = newActionGroupForm.values.completeWithLast

    const tag = await lib.getPrefTag('actionGroupTag')
    if (newActionGroupForm.values.tagNewGroup) location.addTag(tag)

    // move task to new action group
    await lib.moveTasks(tasks, location, false)

  }

  lib.moveTasks = async (tasks, location, setPosition) => {
    const loc: Task.ChildInsertionLocation | 'new' | 'appended as note' = setPosition ? await lib.promptForLocation(tasks, location) : location.ending

    switch (loc) {
      case 'new':
        await lib.createActionGroupAndMoveTasks(tasks, location)
        break
      case 'appended as note':
        break
      default:
        // clear any existing tags
        const tag = await lib.getPrefTag('actionGroupTag')
        const inheritTags = lib.inheritTags()
        const hasExistingTags = tasks.map(task => task.tags.length > 0)
        moveTasks(tasks, loc)
        save()
        for (let i = 0; i < tasks.length; i++) {
          if (!hasExistingTags[i]) tasks[i].removeTag(tag)
          if (!hasExistingTags[i] && !inheritTags) tasks[i].clearTags()
        }
        break
    }

    // store last moved task as preference
    preferences.write('lastMovedID', tasks[0].id.primaryKey)
  }

  lib.promptForLocation = async (tasks: Task[], group: Task | Project): Promise<Task.ChildInsertionLocation | 'new' | 'appended as note'> => {
    const form = lib.positionForm(group)
    await form.show('Task Location', 'Move')

    if (form.values.taskLocation === 'new') return 'new'
    else if (form.values.taskLocation === 'beginning') return group.beginning

    if (form.values.appendAsNote) {
      for (const task of tasks) {
        form.values.taskLocation.note = form.values.taskLocation.note + '\n- ' + task.name
        deleteObject(task)
        return 'appended as note'
      }
    }

    return form.values.taskLocation.after
  }

  // #region Helper Functions
  /**========================================================================
   **                            HELPER FUNCTIONS
   *========================================================================**/

  /*================== Get Other Libraries =================*/


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

  /*================== Get Preference Info =================*/

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

  /*------------------ Get Forms -----------------*/


  lib.tagForm = (): TagForm => {
    const fuzzySearchLib = lib.getFuzzySearchLib()
    const form = fuzzySearchLib.activeTagsFuzzySearchForm()
    form.addField(new Form.Field.Checkbox('another', 'Add another?', false), null)
    return form
  }

  lib.sectionForm = (defaultSelection: Project | Folder, folder: Folder | null): SectionForm => {
    const fuzzySearchLib = lib.getFuzzySearchLib()
    const relevantSections = folder ? folder.flattenedSections : flattenedSections
    const activeSections = relevantSections.filter(section => [Project.Status.Active, Project.Status.OnHold, Folder.Status.Active].includes(section.status))
    const defaultSelected = activeSections.includes(defaultSelection) ? defaultSelection : null
    return fuzzySearchLib.searchForm([...activeSections, 'New project'], [...activeSections.map(p => p.name), 'New project'], defaultSelected, null) // TODO: return fuzzy matching for projects and folders
  }

  lib.newProjectForm = (): NewProjectForm => {
    const newProjectForm: NewProjectForm = new Form()
    newProjectForm.addField(new Form.Field.String('projectName', 'Project Name', null, null), null)
    return newProjectForm
  }

  lib.actionGroupForm = async (proj: Project): Promise<ActionGroupForm> => {
    const fuzzySearchLib = lib.getFuzzySearchLib()
    const groups = await lib.potentialActionGroups(proj)

    const additionalOptions = ['Add to root of project', 'New action group']

    const formOptions = [...groups, ...additionalOptions]
    const formLabels = [...groups.map(fuzzySearchLib.getTaskPath), ...additionalOptions]
    const searchForm = fuzzySearchLib.searchForm(formOptions, formLabels, formOptions[0], null)
    searchForm.addField(new Form.Field.Checkbox('setPosition', 'Set position', false), null)
    return searchForm
  }

  lib.positionForm = (group): PositionForm => {
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

    form.validate = (form: PositionForm) => {
      if (form.values.appendAsNote && form.values.taskLocation === 'beginning') return false // can't append to non-existant task
      if (form.values.appendAsNote && form.values.taskLocation === 'new') return false // won't be a new action group if task isn't added
      else return true
    }
    return form
  }

  lib.newActionGroupForm = (): NewActionGroupForm => {
    const form: NewActionGroupForm = new Form()
    form.addField(new Form.Field.String('groupName', 'Group Name', null, null), null)
    form.addField(new Form.Field.Checkbox('completeWithLast', 'Complete with last action', settings.boolForKey('OFMCompleteWhenLastItemComplete')), null)
    form.addField(new Form.Field.Checkbox('tagNewGroup', 'Apply action group tag', lib.autoInclude() === 'none'), null)
    return form
  }

  /*------------------ Other Helper Functions -----------------*/

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

  lib.goTo = async (task) => {
    if (Device.current.mac) await document.newTabOnWindow(document.windows[0]) // new tab - only Mac supported
    URL.fromString('omnifocus:///task/' + task.containingProject.id.primaryKey).open()
    URL.fromString('omnifocus:///task/' + task.id.primaryKey).open()
  }

  lib.promptForFolder = async (): Promise<Folder> => {
    const fuzzySearchLib = lib.getFuzzySearchLib()
    const folderForm = fuzzySearchLib.activeFoldersFuzzySearchForm()
    await folderForm.show('Select a folder', 'Continue')
    return folderForm.values.menuItem
  }

  // #endregion

  return lib
})()
