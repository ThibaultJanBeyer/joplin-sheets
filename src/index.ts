import joplin from 'api'
import yaml from 'js-yaml'

interface Settings {
  options?: {
    title?: string
    data?: { [key:string]: any }[]
  }
}

let panel, isCreated, note

const initPanel = async (): Promise<void> => {
  // Create the panel object
  await joplin.views.panels.setHtml(panel, `<div class="container" id="luckysheet"></div>`)
  await joplin.views.panels.addScript(panel, './webview.js')
  await joplin.views.panels.addScript(panel, './webview.css')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/plugins/css/pluginsCss.css')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/plugins/plugins.css')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/css/luckysheet.css')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/assets/iconfont/iconfont.css')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/plugins/js/plugin.js')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/luckysheet.umd.js')
  isCreated = true
}

const parseSettings = (input: string): Settings => {
  // replace invalid chars, i.e. yaml library don't like TABS
  const replacedInvalids = input.replace('\t', '  ')
  const config = replacedInvalids.split('```JSheets\n')[1].split('```')[0]
  if(!config) return {}
  const parsed = yaml.load(config)
  return parsed
}

const updateView = async () => {
  const hasJSheets = note?.body?.includes('```JSheets')
  if (!panel && hasJSheets)
      panel = await joplin.views.panels.create('luckysheet')
  if (!hasJSheets) {
    if (panel) await joplin.views.panels.hide(panel)
    return
  }

  const settings = await parseSettings(note.body)
  console.log("NOTE", note, panel, settings)
  if (!isCreated) await initPanel()
  await joplin.views.panels.show(panel)
  await joplin.views.panels.postMessage(panel, {
    message: 'JSheets_init',
    ...settings
  })
}

const handleSync = async (message) => {
  console.log(message)
  // joplin.workspace.
}

const handleMessage = async (message: {message:string,sheets:any[],jsonData:Settings}) => {
  if(message.message === 'JSheets_sync') handleSync(message)
}

joplin.plugins.register({
  onStart: async () => {
    note = await joplin.workspace.selectedNote();
    if (note?.body?.includes('```JSheets'))
      panel = await joplin.views.panels.create('luckysheet')
    await joplin.workspace.onNoteSelectionChange(() => updateView())
    await joplin.views.panels.onMessage(panel, handleMessage)
    // await joplin.workspace.onNoteChange(() => updateView())
    updateView()
  },
})
