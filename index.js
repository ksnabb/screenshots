#!/usr/bin/env node
"use strict";
var program = require('commander');

program
  .version('0.0.1')
  .option('-s, --selenium-server <seleniumServer>', 'URL to selenium server instance', 'http://localhost:4444/wd/hub')
  .option('-u, --url <url>', 'Webpage url to take screenshots of')
  .parse(process.argv);

const seleniumServer = program.seleniumServer;
const pageUrl = program.url;

const webdriver = require("selenium-webdriver");
const fs = require("fs");
const imageDiff = require("image-diff");
const _ = require("lodash");
const driver = new webdriver.Builder()
  .forBrowser("firefox")
  .usingServer(seleniumServer)
  .build();

driver.get(pageUrl)
  .then(() => {
    return driver.takeScreenshot()
  })
  .then((image) => {
    const fileName = Date.now() + "-firefox-" + encodeURIComponent(pageUrl) + ".png";
    fs.writeFileSync("./screenshots/" + fileName, image, "base64")
    const files = fs.readdirSync("./screenshots/")
    const history = _.groupBy(files, (val) => {
      return val.split("-")[2]
    })

    _.forEach(history, (value, key) => {
      let url = key.split(".")
      url.pop()
      url = url.join(".")
      const currentVersion = value.pop();
      const previousVersion = value.pop();

      if (previousVersion && currentVersion) {
        const diffFileName = "./diffs/" + Date.now() + "-" + encodeURIComponent(pageUrl) + ".png";
        imageDiff({
          actualImage: "./screenshots/" + currentVersion,
          expectedImage: "./screenshots/" + previousVersion,
          diffImage: diffFileName,
        }, function (err, imagesAreSame) {
          if (err) {
            console.log(err)
            return;
          }
          if (imagesAreSame) {
            console.log("No changes to previous detected")
            fs.unlink("./screenshots/" + currentVersion)
            fs.unlink(diffFileName)
          }
        });
      }
    })
    driver.quit();
  });
