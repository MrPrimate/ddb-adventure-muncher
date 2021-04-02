'use strict'

// const { ipcRenderer } = require('electron')

let loadConfig = document.getElementById("load-config");
let setOutputDir = document.getElementById("set-output-dir");
let patreonLink = document.getElementById("patreon-link");
let outputLocation = document.getElementById("output-location");

const contentLoadMessage = document.getElementById("config-loader");
const generateButton = document.getElementById("munch-book");

var config;

patreonLink.addEventListener('click', (event) => {
  event.preventDefault();
  window.api.patreon();
});

loadConfig.addEventListener('click', (event) => {
  event.preventDefault();
  window.api.send("loadConfig");
});

setOutputDir.addEventListener('click', (event) => {
  event.preventDefault();
  window.api.send("outputDir");
});


window.api.receive("config", (data) => {
  console.log(`Received config from main process`);
  console.log(data);
  config = data;

  if (config.cobalt) {
    contentLoadMessage.innerHTML = "Config loaded!";
    setOutputDir.disabled = false;
    generateButton.disabled = false;
    if (config.outputDirEnv) {
      outputLocation.innerHTML = config.outputDirEnv;
    }
  } else {
    console.warn("No config file!");
    contentLoadMessage.innerHTML = "Config not found";
  }
});
window.api.send("config", "get config");

// const { ipcRenderer } = require('electron')

// // delete todo by its text value ( used below in event listener)
// const deleteTodo = (e) => {
//   ipcRenderer.send('delete-todo', e.target.textContent)
// }

// // create add todo window button
// document.getElementById('createTodoBtn').addEventListener('click', () => {
//   ipcRenderer.send('add-todo-window')
// })

// // on receive todos
// ipcRenderer.on('todos', (event, todos) => {
//   // get the todoList ul
//   const todoList = document.getElementById('todoList')

//   // create html string
//   const todoItems = todos.reduce((html, todo) => {
//     html += `<li class="todo-item">${todo}</li>`

//     return html
//   }, '')

//   // set list html to the todo items
//   todoList.innerHTML = todoItems

//   // add click handlers to delete the clicked todo
//   todoList.querySelectorAll('.todo-item').forEach(item => {
//     item.addEventListener('click', deleteTodo)
//   })
// })
