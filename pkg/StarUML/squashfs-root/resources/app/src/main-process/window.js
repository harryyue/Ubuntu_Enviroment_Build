/*
* Copyright (c) 2013-2014 Minkyu Lee. All rights reserved.
*
* NOTICE:  All information contained herein is, and remains the
* property of Minkyu Lee. The intellectual and technical concepts
* contained herein are proprietary to Minkyu Lee and may be covered
* by Republic of Korea and Foreign Patents, patents in process,
* and are protected by trade secret or copyright law.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Minkyu Lee (niklaus.lee@gmail.com).
*
*/

const URL = require('url')
const { BrowserWindow } = require('electron')
const { EventEmitter } = require('events')

/**
 * Window represent a browser window
 *
 * This module dispatches these event(s):
 *   - app-ready : triggered when the application is ready
 *
 * @param {Object} options {fileToOpen:string, template:string, devTools:boolean, ...}
 */
class Window extends EventEmitter {

  constructor (options) {
    super()

    options = options || {}
    let browserOptions = {}
    browserOptions.width = options.width || 1200
    browserOptions.height = options.height || 900
    if (process.platform === 'darwin') {
      browserOptions.titleBarStyle = 'hidden'
    }
    this.browserWindow = new BrowserWindow(browserOptions)

    this.url = URL.format({
      protocol: 'file',
      slashes: true,
      pathname: `${__dirname}/../static/index.html`,
      query: { initParams: JSON.stringify(options) }
    })
    this.browserWindow.loadURL(this.url)

    if (options.devTools) {
      this.browserWindow.webContents.openDevTools()
    }

    this.handleEvents()
  }

  /**
   * Check the window is focused or not
   *
   * @return {boolean}
   */
  isFocused () {
    return this.browserWindow.isFocused()
  }

  /**
   * Send a command to the window
   *
   * @param {string} command
   * @param {...} ...args
   */
  sendCommand (command, ...args) {
    this.browserWindow.webContents.send('command', command, ...args)
  }

  /**
   * Send a IPC message to the window
   *
   * @param {string} channel
   * @param {...} ...args
   */
  sendMessage (channel, ...args) {
    this.browserWindow.webContents.send(channel, ...args)
  }

  /**
   * Close the window
   */
  close () {
    this.browserWindow.close()
  }

  /**
   * Handle events
   */
  handleEvents () {
    this.browserWindow.on('focus', () => {
      this.browserWindow.webContents.send('focus')
    })

    this.browserWindow.on('close', (event) => {
      // ...
    })

    this.browserWindow.on('closed', () => {
      global.application.removeWindow(this)
    })

    this.browserWindow.once('window:app-ready', (init) => {
      this.emit('app-ready', init)
    })

    this.browserWindow.once('window:close', () => {
      this.close()
    })
  }

}

module.exports = Window
