/* global PlugIn Task Preferences */
(() => {
  const preferences = new Preferences()

  const action = new PlugIn.Action(async selection => {
    const lib = this.libraries[0]
    const id = preferences.read('lastMovedID')
    const task = Task.byIdentifier(id)
    lib.goTo(task)
  })

  action.validate = selection => {
    return preferences.read('lastMovedID') !== null
  }

  return action
})()
