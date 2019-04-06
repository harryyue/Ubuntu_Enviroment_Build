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

const _ = require('lodash')
const { EventEmitter } = require('events')
const Window = require('./window')
const ApplicationMenu = require('./application-menu')
const ContextMenu = require('./context-menu')
const electron = require('electron')
const app = electron.app
const autoUpdater = require('electron-updater').autoUpdater
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain
const MetadataManager = require('./metadata-manager')
const ExtensionLoader = require('../extensibility/extension-loader')

/**
 * Application
 */
class Application extends EventEmitter {

  constructor () {
    super()

    /**
     * @member {Array<Window>}
     */
    this.windows = []

    /**
     * @member {ApplicationMenu}
     */
    this.applicationMenu = new ApplicationMenu()

    /**
     * @member {ContextMenu}
     */
    this.contextMenu = new ContextMenu()

    /**
     * @member {MetadataManager}
     */
    this.metadata = new MetadataManager()
    global.app = this.metadata
    // load default elements
    require('../core/graphics')
    require('../core/core')
    // load default metamodel
    const metamodel = require('../../resources/default/metamodel.json')
    this.metadata.metamodels.register(metamodel)
    // load default rules
    require('../../resources/default/rules')

    /**
     * @member {Object}
     * .state = 'no-update' | 'available' | 'ready'
     */
    this.autoUpdateInfo = {
      state: 'no-update',
      showDialog: false,
      release: null
    }

    this.loadExtensions()
    this.handleCommands()
    this.handleMessages()
    this.handleEvents()

    // Check for updates on start
    autoUpdater.checkForUpdatesAndNotify()
  }

  /**
   * Add a window
   *
   * @param {Window} window
   */
  addWindow (window) {
    this.windows.push(window)
  }

  /**
   * Remove a window
   *
   * @param {Window} window
   */
  removeWindow (window) {
    if (this.windows.indexOf(window) > -1) {
      this.windows.splice(this.windows.indexOf(window), 1)
    }
  }

  /**
   * Open a window
   *
   * options = {fileToOpen: string, template: string, devTools: boolean, ...}
   *
   * @param {Object} options
   */
  openWindow (options) {
    options = options || {}
    let window = new Window(options)
    this.addWindow(window)
  }

  /**
   * Return a focused window
   *
   * @return {Window}
   */
  focusedWindow () {
    return _.find(this.windows, (win) => { return win.isFocused() })
  }

  /**
   * Send a command to the focused window only if not handled by handleCommands().
   *
   * @param {string} command
   */
  sendCommand (command, ...args) {
    if (!this.emit(command, ...args)) {
      const focusedWindow = this.focusedWindow()
      if (focusedWindow) {
        focusedWindow.sendCommand(command, ...args)
      }
    }
  }

  /**
   * Send a command to all windows only if not handled by handleCommands().
   *
   * @param {string} command
   */
  sendCommandToAll (command, ...args) {
    if (!this.emit(command, ...args)) {
      this.windows.forEach(win => {
        win.sendCommand(command, ...args)
      })
    }
  }

  /**
   * Send a IPC message to all windows.
   *
   * @param {string} channel
   */
  sendMessageToAll (channel, ...args) {
    this.windows.forEach(win => {
      win.sendMessage(channel, ...args)
    })
  }

  /**
   * Load extensions
   */
  loadExtensions () {
    const extensionLoader = new ExtensionLoader()
    const paths = ['essential', 'default', 'dev', extensionLoader.getUserExtensionPath()]
    const features = ['metamodel', 'elements', 'rules']
    extensionLoader.init(paths, features)
  }

  /**
   * Handle commands triggered by menu items
   */
  handleCommands () {
    // Handle commands at main process level
    this.on('application:quit', () => {
      global.app.quit()
    })
    this.on('application:new', () => {
      this.openWindow()
    })
    this.on('application:new-from-template', (arg) => {
      if (arg) {
        this.openWindow({template: arg})
      }
    })
    this.on('application:open', (arg) => {
      var options = {}
      options.fileToOpen = arg
      this.openWindow(options)
    })
    this.on('application:check-for-updates', (arg) => {
      autoUpdater.checkForUpdatesAndNotify()
    })
    this.on('application:install-and-restart', (arg) => {
      autoUpdater.quitAndInstall(false, true)
    })
  }

  /**
   * Handle messages from renderer processes.
   */
  handleMessages () {
    ipcMain.on('setup-application-menu', (event, template, keystrokesByCommand) => {
      this.applicationMenu.setup(template, keystrokesByCommand)
    })

    ipcMain.on('setup-context-menu', (event, templatesBySelector, keystrokesByCommand) => {
      this.contextMenu.setup(templatesBySelector, keystrokesByCommand)
    })

    ipcMain.on('popup-context-menu', (event, selector) => {
      this.contextMenu.popup(selector)
    })

    ipcMain.on('update-menu-states', (event, visibleStates, enabledStates, checkedStates) => {
      this.applicationMenu.updateStates(visibleStates, enabledStates, checkedStates)
      this.contextMenu.updateStates(visibleStates, enabledStates, checkedStates)
    })

    ipcMain.on('validate', (event, filename) => {
      this.metadata.loadFromFile(filename)
      const errors = this.metadata.validate()
      event.sender.send('validation-result', errors)
    })

    ipcMain.on('command', (event, command, ...args) => {
      this.emit(command, ...args)
    })

    ipcMain.on('close-window', (event) => {
      const window = BrowserWindow.fromWebContents(event.sender)
      window.close()
    })

    ipcMain.on('relaunch', (event) => {
      app.relaunch()
    })

    ipcMain.on('quit', (event) => {
      app.quit()
    })

    // Propagated events triggered in a window process
    ipcMain.on('window-event-propagate', (event, eventName, ...args) => {
      const window = BrowserWindow.fromWebContents(event.sender)
      window.emit(eventName, ...args)
    })
  }

  handleEvents () {
    // Forward autoUpdate events to all app.updateManager(s) in renderer processes.
    autoUpdater.on('error', (err) => {
      this.sendMessageToAll('autoUpdater:error', err)
    })
    autoUpdater.on('update-available', (info) => {
      this.sendMessageToAll('autoUpdater:update-available', info)
    })
    autoUpdater.on('update-not-available', (info) => {
      this.sendMessageToAll('autoUpdater:update-not-available', info)
    })
    autoUpdater.on('download-progress', (info) => {
      this.sendMessageToAll('autoUpdater:download-progress', info)
    })
    autoUpdater.on('update-downloaded', (info) => {
      this.sendMessageToAll('autoUpdater:update-downloaded', info)
    })
  }

}

module.exports = Application
