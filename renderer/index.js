'use strict'

// const { ipcRenderer } = require('electron')

const loadConfig = document.getElementById("load-config");
const setOutputDir = document.getElementById("set-output-dir");
const patreonLink = document.getElementById("patreon-link");
const outputLocation = document.getElementById("output-location");
const bookList = document.getElementById("book-select");
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

generateButton.addEventListener('click', (event) => {
  event.preventDefault();
  generateButton.disabled = true;
  const bookCode = document.getElementById("book-select");
  if (bookCode.value !== 0)
  window.api.send("generate", bookCode.value);
});

window.api.receive("generate", (data) => {
  generateButton.disabled = false;
});


window.api.receive("books", (data) => {
  data.forEach((book) => {
    console.log(`${book.bookCode} : ${book.book}`);
  })
  const bookHtml = data.reduce((html, book) => {
    html += `<option value="${book.bookCode}">${book.book}</option>`;
    return html
  }, '<option value="0">Select book:</option>');
  bookList.innerHTML = bookHtml;
});


window.api.receive("config", (data) => {
  console.log(`Received config from main process`);
  console.log(data);
  config = data;

  if (config.cobalt) {
    contentLoadMessage.innerHTML = "Config loaded!";
    setOutputDir.disabled = false;
    if (config.outputDirEnv) {
      generateButton.disabled = false;
      outputLocation.innerHTML = config.outputDirEnv;
      window.api.send("books");
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
