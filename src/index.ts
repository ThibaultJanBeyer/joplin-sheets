import joplin from 'api'
import { v4 as uuidv4 } from 'uuid';

import { Settings } from "./types"
import { replaceData, parseData, isJSheet } from './handleStrings'

let panel, note

const createPanel = async (): Promise<string> => {
  // unfortunately it's wayyy more reliable to just close and re-create than to re-use a panel :'(
  const panel = await joplin.views.panels.create(`luckysheet-${uuidv4()}`)
  await joplin.views.panels.onMessage(panel, handleMessage)

  await joplin.views.panels.setHtml(panel, `<div class="container" id="luckysheet"></div>`)
  await joplin.views.panels.addScript(panel, './webview.js')
  await joplin.views.panels.addScript(panel, './webview.css')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/plugins/css/pluginsCss.css')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/plugins/plugins.css')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/css/luckysheet.css')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/assets/iconfont/iconfont.css')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/plugins/js/plugin.js')
  await joplin.views.panels.addScript(panel, './luckysheet/dist/luckysheet.umd.js')

  return panel
}

const handleClose = async () => {
  if(!panel) return
  await joplin.views.panels.postMessage(panel, { message: 'JSheets_close' })
  await joplin.views.panels.hide(panel)
}

const handleOpen = async () => {
  panel = await createPanel()
  await joplin.views.panels.postMessage(panel, {
    message: 'JSheets_init',
    options: await parseData(note.body)
  })
  await joplin.views.panels.show(panel)
}

const updateView = async () => {
  await handleClose()

  note = await joplin.workspace.selectedNote()
  if (isJSheet(note?.body)) await handleOpen()
}

const handleSync = async ({ jsonData }) => {
  if (!isJSheet(note?.body)) return
  console.log("handleSync", jsonData)
  note.body = replaceData(note.body, JSON.stringify(jsonData))
  await joplin.commands.execute("editor.setText", note.body);
  await joplin.data.put(['notes', note.id], null, { body: note.body });
}

const handleMessage = async (message: {message:string,sheets:any[],jsonData:Settings}) => {
  if(message.message === 'JSheets_sync') handleSync(message)
}

joplin.plugins.register({
  onStart: async () => {
    await joplin.workspace.onNoteSelectionChange(updateView)
  },
})
