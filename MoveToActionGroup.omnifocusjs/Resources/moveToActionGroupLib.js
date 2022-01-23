/* global PlugIn Version Device */
(() => {
  const lib = new PlugIn.Library(new Version('1.0'))

  lib.goTo = async (task) => {
    'in lib goTo function'
    // new tab - only Mac supported
    if (Device.current.mac) await document.newTabOnWindow(document.windows[0])
    URL.fromString('omnifocus:///task/' + task.containingProject.id.primaryKey).call(() => {})
    URL.fromString('omnifocus:///task/' + task.id.primaryKey).call(() => {})
  }

  return lib
})()
