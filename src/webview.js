let isInit

webviewApi.onMessage(({ message }) => {
  if(message.message === 'JSheets_init')
    setTimeout(() => {
      luckysheet.create(message.options)
      isInit = true
    }, 1000)
})

setInterval(() => {
  if(!isInit) return
  webviewApi.postMessage({
    message: 'JSheets_sync',
    sheets: luckysheet.getAllSheets(),
    jsonData: luckysheet.toJson()
  })
}, 1000);



// // There are many ways to listen to click events, you can even use
// // something like jQuery or React. This is how it can be done using
// // plain JavaScript:
// document.addEventListener('click', event => {
// 	const element = event.target;
// 	if (element.className === 'toc-item-link') {
// 		// Post the message and slug info back to the plugin:
// 		webviewApi.postMessage({
// 			name: 'scrollToHash',
// 			hash: element.dataset.slug,
// 		});
// 	}
// });
