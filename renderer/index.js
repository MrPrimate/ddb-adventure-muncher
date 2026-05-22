/* eslint-disable no-undef */
"use strict";

const loadConfig = document.getElementById("load-config");
const setOutputDir = document.getElementById("set-output-dir");
const patreonLink = document.getElementById("patreon-link");
const outputLocation = document.getElementById("output-location");
const bookList = document.getElementById("book-select");
const categoryList = document.getElementById("category-select");
let allBooks = [];
const contentLoadMessage = document.getElementById("config-loader");
const generateButton = document.getElementById("munch-book");
const userField = document.getElementById("user");
const versionSupport = document.getElementById("version-support");

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
  const observeAll = document.getElementById("observe-all");
  const messageDiv = document.getElementById("message-div");
  messageDiv.innerHTML = "";
  
  const options = {
    bookCode: bookCode.value,
    observeAll: observeAll.checked,
  };

  if (Number.parseInt(bookCode.value) !== 0) {
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
  if (data.success) {
    const currentVersion = data.ddbVersions.currentVersion;
    const supportedVersion = data.ddbVersions.supportedVersion;
    if (supportedVersion == 0) {
      messageDiv.innerHTML += "<p style=\"color:red\">ERROR: Adventure Muncher could not download any meta data for this book, scenes will not be processed correctly.</p>";
    } else if (currentVersion > supportedVersion) {
      messageDiv.innerHTML += `<p style="color:orange">WARNING: Current book version is ${currentVersion}, last known supported version is ${supportedVersion}. There is a chance that this adventure has not parsed properly.</p>`;
    } else if (data.ddbVersions.downloadNewVersion) {
      messageDiv.innerHTML += `<p style="color:green"><b>Used DDB book version (${currentVersion}).</b></p>`;
    }
  }
});

window.api.receive("stateMessage", (message) => {
  console.log(message);
  const messageDiv = document.getElementById("message-div");
  const colour = "blue";
  messageDiv.innerHTML = `<p style="color:${colour};">${message}</p>`;
});

function resetBookList() {
  bookList.innerHTML = "<option value=\"0\">Select book:</option>";
  bookList.disabled = true;
}

window.api.receive("books", (data) => {
  allBooks = data;
  const categories = [...new Set(allBooks.map((b) => b.categoryName))].sort();
  categoryList.innerHTML = categories.reduce((html, category) => {
    html += `<option value="${category}">${category}</option>`;
    return html;
  }, "<option value=\"0\">Select category:</option>");
  resetBookList();
});

categoryList.addEventListener("change", () => {
  const category = categoryList.value;
  if (category === "0") {
    resetBookList();
    return;
  }
  const books = allBooks.filter((book) => book.categoryName === category);
  bookList.innerHTML = books.reduce((html, book) => {
    html += `<option value="${book.bookCode}">${book.book.description}</option>`;
    return html;
  }, "<option value=\"0\">Select book:</option>");
  bookList.disabled = false;
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

  if (config.data.cobalt) {
    contentLoadMessage.innerHTML = "Config loaded!";
    setOutputDir.disabled = false;
    window.api.send("user", config);
    if (config.data.outputDirEnv) {
      generateButton.disabled = false;
      outputLocation.innerHTML = config.data.outputDirEnv;
      window.api.send("books", config);
    }
    versionSupport.innerHTML = "<p><b>Version:</b> Foundry v13+ mode. This version of Adventure Muncher recommends D&D 5e System v5.0.0 or higher.</p>";
  } else {
    console.warn("No config file!");
    contentLoadMessage.innerHTML = "Config not found";
  }
});

window.api.receive("directoryConfig", (config) => {
  console.log("Received config from main process");
  console.log(config);

  if (config.data.outputDirEnv) {
    generateButton.disabled = false;
    outputLocation.innerHTML = config.data.outputDirEnv;
    window.api.send("books", config);
  } else {
    console.warn("No output dir found in config!");
    contentLoadMessage.innerHTML = "Config unable to parse output dir.";
  }
});


