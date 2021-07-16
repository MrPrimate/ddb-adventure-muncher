/* eslint-disable no-undef */
"use strict";

// const { ipcRenderer } = require('electron')

const loadConfig = document.getElementById("load-config");
const setOutputDir = document.getElementById("set-output-dir");
const patreonLink = document.getElementById("patreon-link");
const outputLocation = document.getElementById("output-location");
const bookList = document.getElementById("book-select");
const contentLoadMessage = document.getElementById("config-loader");
const generateButton = document.getElementById("munch-book");
const userField = document.getElementById("user");

// var config;

patreonLink.addEventListener("click", (event) => {
  event.preventDefault();
  window.api.patreon();
});

loadConfig.addEventListener("click", (event) => {
  event.preventDefault();
  window.api.send("loadConfig");
});

setOutputDir.addEventListener("click", (event) => {
  event.preventDefault();
  window.api.send("outputDir");
});

generateButton.addEventListener("click", (event) => {
  event.preventDefault();
  generateButton.disabled = true;
  const bookCode = document.getElementById("book-select");
  const generateTokens = document.getElementById("generate-tokens");
  const observeAll = document.getElementById("observe-all");
  const messageDiv = document.getElementById("message-div");
  messageDiv.innerHTML = "";
  
  const options = {
    bookCode: bookCode.value,
    generateTokens: generateTokens.checked,
    observeAll: observeAll.checked,
  };
  if (bookCode.value !== 0) {
    window.api.send("generate", options);
  }

});

window.api.receive("generate", (data) => {
  console.log(data);
  generateButton.disabled = false;
  const messageDiv = document.getElementById("message-div");
  const colour = data.success ? "green" : "red";
  messageDiv.innerHTML = `<p style="color:${colour};">${data.message}</p>`;
  if (!data.success) {
    messageDiv.innerHTML += "<p><b>Missing:</b> ";
    data.data.slice(0,9).forEach((item) => {
      messageDiv.innerHTML += `${item.actorName}, `;
    });
    if (data.data.length > 10) messageDiv.innerHTML += `and more to a total of ${data.data.length} monsters.`;
    messageDiv.innerHTML += "</p><br><br><br>";
  }
});


window.api.receive("books", (data) => {
  data.forEach((book) => {
    console.log(`${book.bookCode} : ${book.book.description}`);
    console.log(book);
  });
  const bookHtml = data.reduce((html, book) => {
    html += `<option value="${book.bookCode}">${book.book.description}</option>`;
    return html;
  }, "<option value=\"0\">Select book:</option>");
  bookList.innerHTML = bookHtml;
});

window.api.receive("user", (data) => {
  if (data.error) {
    userField.innerHTML = "<b>Authentication Failure - please generate and load a new config file!</b>";
  }
  else if (data.userDisplayName) {
    userField.innerHTML = `<b>User name:</b> ${data.userDisplayName}`;
  }
});


window.api.receive("config", (config) => {
  console.log("Received config from main process");
  console.log(config);

  if (config.cobalt) {
    contentLoadMessage.innerHTML = "Config loaded!";
    setOutputDir.disabled = false;
    window.api.send("user");
    if (config.outputDirEnv) {
      generateButton.disabled = false;
      outputLocation.innerHTML = config.outputDirEnv;
      window.api.send("books");
    }
    document.getElementById("generate-tokens").checked = config.generateTokens === true;
  } else {
    console.warn("No config file!");
    contentLoadMessage.innerHTML = "Config not found";
  }
});
window.api.send("config", "get config");

