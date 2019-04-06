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
const URL = require('url')
const fs = require('fs')
const path = require('path')
const {ipcRenderer, shell} = require('electron')
const {EventEmitter} = require('events')
const keycode = require('keycode')
const Mustache = require('mustache')

const {Model, Diagram} = require('./core/core')
const packageJSON = require('../package.json')

const MetamodelManager = require('./core/metamodel-manager')
const PreferenceManager = require('./core/preference-manager')
const {Repository, Writer, Reader} = require('./core/repository')
const Validator = require('./core/validator')

const CommandManager = require('./engine/command-manager')
const ProjectManager = require('./engine/project-manager')
const SelectionManager = require('./engine/selection-manager')
const ClipboardManager = require('./engine/clipboard-manager')
const Engine = require('./engine/engine')
const Factory = require('./engine/factory')
const LicenseManager = require('./engine/license-manager')
const FontManager = require('./engine/font-manager')
const UpdateManager = require('./engine/update-manager')

const TitlebarView = require('./views/titlebar-view')
const SidebarView = require('./views/sidebar-view')
const NavigatorView = require('./views/navigator-view')
const WorkingDiagramsView = require('./views/working-diagrams-view')
const ToolboxView = require('./views/toolbox-view')
const ModelExplorerView = require('./views/model-explorer-view')
const EditorsHolderView = require('./views/editors-holder-view')
const StyleEditorView = require('./views/style-editor-view')
const PropertyEditorView = require('./views/property-editor-view')
const DocumentationEditorView = require('./views/documentation-editor-view')
const ToolbarView = require('./views/toolbar-view')
const StatusbarView = require('./views/statusbar-view')

const MenuManager = require('./ui/menu-manager')
const ContextMenuManager = require('./ui/context-menu-manager')
const KeymapManager = require('./ui/keymap-manager')
const StylesheetManager = require('./ui/stylesheet-manager')
const DiagramManager = require('./ui/diagram-manager')
const QuickeditManager = require('./ui/quickedit-manager')
const PanelManager = require('./ui/panel-manager')
const ToastManager = require('./ui/toast-manager')
const ValidationPanel = require('./ui/validation-panel')
const ExtensionManager = require('./extensibility/extension-manager')

const DialogManager = require('./dialogs/dialog-manager')
const ElementPickerDialog = require('./dialogs/element-picker-dialog')
const ElementListPickerDialog = require('./dialogs/element-list-picker-dialog')
const ElementListEditorDialog = require('./dialogs/element-list-editor-dialog')
const ExtensionManagerDialog = require('./dialogs/extension-manager-dialog')
const CheckUpdatesDialog = require('./dialogs/check-updates-dialog')

const ExtensionLoader = require('./extensibility/extension-loader')
const Resizer = require('./utils/resizer')

const Constants = {
  APP_EXT: '.mdj',
  FRAG_EXT: '.mfj'
}

const AUTO_BACKUP_INTERVAL = 1000 * 60 * 10 // 10 minutes.

const MainViewHTML = fs.readFileSync(path.join(__dirname, './static/html-contents/main-view.html'), 'utf8')
const WindowsStylesheet = fs.readFileSync(path.join(__dirname, './static/html-contents/windows-stylesheet.html'), 'utf8')

/**
 * The global application context.
 * An instance of this class can be accessed via the global `app` variable.
 * Do not try to create an instance using `new` keyword.
 *
 * @example
 * var appName = app.name
 * console.log(appName)
 */
class AppContext extends EventEmitter {
  constructor () {
    super()
    this.setMaxListeners(1000)
    this.platform = process.platform
    this.metadata = packageJSON
    this.config = this.metadata.config

    /**
     * Application name
     * @member {string}
     */
    this.name = this.metadata.name

    /**
     * Application version
     * @member {string}
     */
    this.version = this.metadata.version

    /**
     * All available element classes
     * @member {Object<string,Element>}
     */
    this.type = global.type

    /**
     * An instance of MenuManager
     * @member {MenuManager}
     */
    this.menu = new MenuManager()

    /**
     * An instance of ContextMenuManager
     * @member {ContextMenuManager}
     */
    this.contextMenu = new ContextMenuManager()

    /**
     * An instance of KeymapManager
     * @private
     * @member {KeymapManager}
     */
    this.keymaps = new KeymapManager()

    /**
     * An instance of StylesheetManager
     * @private
     * @member {StylesheetManager}
     */
    this.stylesheets = new StylesheetManager()

    /**
     * An instance of CommandManager
     * @member {CommandManager}
     */
    this.commands = new CommandManager()

    /**
     * An instance of ProjectManager
     * @member {ProjectManager}
     */
    this.project = new ProjectManager()

    /**
     * An instance of MetamodelManager
     * @private
     * @member {MetamodelManager}
     */
    this.metamodels = new MetamodelManager()

    /**
     * An instance of Repository
     * @member {Repository}
     */
    this.repository = new Repository()
    this.repository.Writer = Writer
    this.repository.Reader = Reader

    /**
     * An instance of Validator
     * @private
     * @member {Validator}
     */
    this.validator = new Validator()

    /**
     * An instance of PreferenceManager
     * @member {PreferenceManager}
     */
    this.preferences = new PreferenceManager()

    /**
     * An instance of SelectionManager
     * @member {SelectionManager}
     */
    this.selections = new SelectionManager()

    /**
     * An instance of ClipboardManager
     * @private
     * @member {ClipboardManager}
     */
    this.clipboard = new ClipboardManager()

    /**
     * An instance of Engine
     * @member {Engine}
     */
    this.engine = new Engine()

    /**
     * An instance of Factory
     * @member {Factory}
     */
    this.factory = new Factory()

    /**
     * An instance of DiagramManager
     * @member {DiagramManager}
     */
    this.diagrams = new DiagramManager()

    /**
     * An instance of ExtensionLoader
     * @private
     * @member {ExtensionLoader}
     */
    this.extensionLoader = new ExtensionLoader()

    /**
     * An instance of LicenseManager
     * @private
     * @member {LicenseManager}
     */
    this.licenseManager = new LicenseManager()

    /**
     * An instance of FontManager
     * @private
     * @member {FontManager}
     */
    this.fontManager = new FontManager()

    /**
     * An instance of UpdateManager
     * @private
     * @member {UpdateManager}
     */
    this.updateManager = new UpdateManager()

    /**
     * An instance of TitlebarView
     * @private
     * @member {TitlebarView}
     */
    this.titlebar = new TitlebarView()

    /**
     * An instance of SidebarView
     * @private
     * @member {SidebarView}
     */
    this.sidebar = new SidebarView()

    /**
     * An instance of NavigatorView
     * @private
     * @member {NavigatorView}
     */
    this.navigator = new NavigatorView()

    /**
     * An instance of WorkingDiagramsView
     * @private
     * @member {WorkingDiagramsView}
     */
    this.workingDiagrams = new WorkingDiagramsView()

    /**
     * An instance of ToolboxView
     * @private
     * @member {ToolboxView}
     */
    this.toolbox = new ToolboxView()

    /**
     * An instance of ModelExplorerView
     * @private
     * @member {ModelExplorerView}
     */
    this.modelExplorer = new ModelExplorerView()

    /**
     * An instance of EditorsHolderView
     * @private
     * @member {EditorsHolderView}
     */
    this.editorsHolder = new EditorsHolderView()

    /**
     * An instance of StyleEditorView
     * @private
     * @member {StyleEditorView}
     */
    this.styleEditor = new StyleEditorView()

    /**
     * An instance of PropertyEditorView
     * @private
     * @member {PropertyEditorView}
     */
    this.propertyEditor = new PropertyEditorView()

    /**
     * An instance of DocumentationEditorView
     * @private
     * @member {DocumentationEditorView}
     */
    this.documentationEditor = new DocumentationEditorView()

    /**
     * An instance of ToolbarView
     * @private
     * @member {ToolbarView}
     */
    this.toolbar = new ToolbarView()

    /**
     * An instance of ToolbarView
     * @private
     * @member {StatusbarView}
     */
    this.statusbar = new StatusbarView()

    /**
     * An instance of QuickeditManager
     * @private
     * @member {QuickeditManager}
     */
    this.quickedits = new QuickeditManager()

    /**
     * An instance of DialogManager
     * @member {DialogManager}
     */
    this.dialogs = new DialogManager()

    /**
     * An instance of ToastManager
     * @member {ToastManager}
     */
    this.toast = new ToastManager()

    /**
     * An instance of PanelManager
     * @member {PanelManager}
     */
    this.panelManager = new PanelManager()

    /**
     * An instance of ElementPickerDialog
     * @member {ElementPickerDialog}
     */
    this.elementPickerDialog = new ElementPickerDialog()

    /**
     * An instance of ElementListPickerDialog
     * @member {ElementListPickerDialog}
     */
    this.elementListPickerDialog = new ElementListPickerDialog()

    /**
     * An instance of ElementListEditorDialog
     * @member {ElementListEditorDialog}
     */
    this.elementListEditorDialog = new ElementListEditorDialog()

    /**
     * @private
     * A reference to ExtensionManagerDialog
     */
    this.extensionManagerDialog = ExtensionManagerDialog

    // Wiring components
    this.contextMenu.keymapManager = this.keymaps
    this.keymaps.commandManager = this.commands
    this.validator.repository = this.repository
    this.project.repository = this.repository
    this.clipboard.repository = this.repository
    this.engine.repository = this.repository
    this.factory.repository = this.repository
    this.factory.metamodelManager = this.metamodels
    this.factory.engine = this.engine
    this.factory.diagramManager = this.diagrams
    this.licenseManager.projectManager = this.project
    this.workingDiagrams.diagramManager = this.diagrams
    this.toolbox.repository = this.repository
    this.toolbox.diagramManager = this.diagrams
    this.toolbox.commandManager = this.commands
    this.toolbox.quickeditManager = this.quickedits
    this.modelExplorer.repository = this.repository
    this.modelExplorer.preferenceManager = this.preferences
    this.modelExplorer.diagramManager = this.diagrams
    this.propertyEditor.metamodelManager = this.metamodels
    this.propertyEditor.repository = this.repository
    this.styleEditor.editorsHolder = this.editorsHolder
    this.propertyEditor.editorsHolder = this.editorsHolder
    this.documentationEditor.editorsHolder = this.editorsHolder
    this.titlebar.project = this.project
    this.titlebar.repository = this.repository
    this.titlebar.metadata = this.metadata
    this.titlebar.licenseManager = this.licenseManager
    this.toolbar.preferenceManager = this.preferences
    this.statusbar.preferenceManager = this.preferences
    this.quickedits.diagramManager = this.diagrams
    this.quickedits.engine = this.engine
    this.quickedits.keymapManager = this.keymaps
    this.quickedits.commandManager = this.commands

    // Handle events
    this.handleEvents()
  }

  /**
   * Returns the full path to the application directory.
   * @return {!string} fullPath reference
   */
  getAppPath () {
    var electronApp
    if (process.type === 'browser') {
      electronApp = require('electron').app
    } else {
      electronApp = require('electron').remote.app
    }
    return electronApp.getAppPath()
  }

  /**
   * Returns the full path to the user data directory.
   * @return {!string} fullPath reference
   */
  getUserPath () {
    var electronApp
    if (process.type === 'browser') {
      electronApp = require('electron').app
    } else {
      electronApp = require('electron').remote.app
    }
    return electronApp.getPath('userData')
  }

  /**
   * Load custom keymap
   * @private
   */
  loadCustomKeymap () {
    var keymapPath = path.join(this.getUserPath(), 'keymap.json')
    if (fs.existsSync(keymapPath)) {
      try {
        var json = JSON.parse(fs.readFileSync(keymapPath, 'utf8'))
        this.keymaps.add(json)
      } catch (err) {
        console.error(`Custom keymap error - ${keymapPath}`)
        console.error(err)
      }
    }
  }

  /**
   * @private
   */
  beforeHTMLReady () {
    // Use quiet scrollbars if we are on Mac OS X
    if (process.platform !== 'darwin') {
      $('head').append(WindowsStylesheet)
    }

    // Inject main-view.html into <BODY> tag
    $('body').html(Mustache.render(MainViewHTML, {}))

    // Prevent clicks on any link from navigating to a different page (which could lose unsaved
    // changes). We can't use a simple .on("click", "a") because of http://bugs.jquery.com/ticket/3861:
    // jQuery hides non-left clicks from such event handlers, yet middle-clicks still cause CEF to
    // navigate. Also, a capture handler is more reliable than bubble.
    window.document.body.addEventListener('click', function (e) {
      // Check parents too, in case link has inline formatting tags
      var node = e.target
      var url
      while (node) {
        if (node.tagName === 'A') {
          url = node.getAttribute('href')
          if (url && !url.match(/^#/)) {
            shell.openExternal(url)
          }
          e.preventDefault()
          break
        }
        node = node.parentElement
      }
    }, true)

    // Handle drag and drop of files into the browser
    // Prevent unhandled drag and drop of files into the browser from replacing
    // the entire app.
    document.ondragover = document.ondragleave = document.ondragend = function (e) {
      return false
    }
    document.ondrop = (e) => {
      event.stopPropagation()
      event.preventDefault()
      const files = e.dataTransfer.files
      for (let f of files) {
        if (path.extname(f.path).toLowerCase() === Constants.APP_EXT) {
          this.commands.execute('project:open', f.path)
        }
      }
    }

    // Repaint diagram after fonts loading is done
    document.fonts.onloadingdone = (fontFaceSetEvent) => {
      this.diagrams.repaint()
    }
  }

  /**
   * @private
   */
  htmlReady () {
    ExtensionManager.htmlReady()

    Resizer.htmlReady()
    this.toolbox.htmlReady()
    this.diagrams.htmlReady()
    this.modelExplorer.htmlReady()

    this.titlebar.htmlReady()
    this.sidebar.htmlReady()
    this.navigator.htmlReady()
    this.workingDiagrams.htmlReady()
    this.editorsHolder.htmlReady()
    this.styleEditor.htmlReady()
    this.propertyEditor.htmlReady()
    this.documentationEditor.htmlReady()
    this.toolbar.htmlReady()
    this.statusbar.htmlReady()

    this.licenseManager.htmlReady()
    this.extensionManagerDialog.htmlReady()

    this.toast.htmlReady()
    this.panelManager.htmlReady()
    ValidationPanel.htmlReady()

    this.setupRepository()
    this.setupProjectManager()
    this.setupFactory()
    this.setupSelectionManager()
    this.setupModelExplorer()
    this.setupStyleEditor()
    this.setupPropertyEditor()
    this.setupDocumentationEditor()
    this.setupQuickEdit()
    this.setupDiagramManager()
    this.setupKeyBindings()
    this.setupLicenseManager()
    this.setupPreferenceManager()
    this.setupAutoBackup()

    // Prevent default context menu
    document.oncontextmenu = function () { return false }

    // Load default fonts
    this.fontManager.loadDefaultFonts()

    // Set default theme CSS
    var theme = this.preferences.get('theme.default', 'dark')
    this.stylesheets.setThemeCSS(theme)

    // Signal that html is loaded
    this.emit('html-ready')
  }

  /**
   * @private
   */
  appReady () {
    // load all extensions
    this.extensionLoader.init()

    // load custom keymap
    this.loadCustomKeymap()

    // Setup menus and context menus
    this.keymaps.setup()
    this.menu.setup()
    this.contextMenu.setup()

    this.sidebar.appReady()
    this.toolbox.appReady()
    this.navigator.appReady()
    this.editorsHolder.appReady()
    this.toolbar.appReady()
    this.statusbar.appReady()

    this.diagrams.appReady()
    this.modelExplorer.appReady()
    this.styleEditor.appReady()
    this.licenseManager.appReady()

    // Package.appReady()

    // startup
    this.selections.deselectAll()
    this.statusbar.setZoomLevel(this.diagrams.getZoomLevel())
    this.modelExplorer.select(this.project.getProject())
    this.toolbox.setDiagram(null)

    // To compute correct initial size of diagram-editor.
    this.panelManager._notifyLayoutChange()

    // Extract init params from url query string
    var url = URL.parse(window.location.href)
    var searchParams = new URL.URLSearchParams(url.query)
    var initParams = JSON.parse(searchParams.get('initParams')) || {}
    var backupFilePath = localStorage.getItem('__backup_filename')
    var workingFilePath = localStorage.getItem('__working_filename')

    // Open a proper file on startup
    // 1. Open the backup file when app was terminated unexpectedly
    if (backupFilePath && fs.existsSync(backupFilePath)) {
      this.toast.error('App was unexpectedly terminated. Auto backup file has loaded.')
      this.project.loadAsTemplate(backupFilePath)
      this.repository.setModified(true)
    } else {
      if (initParams.fileToOpen) {
        // 2. Open the file passed by initParams.fileToOpen
        this.commands.execute('project:open', initParams.fileToOpen)
      } else if (initParams.template) {
        // 3. Open the file passed by initParams.template as a new project
        this.commands.execute('project:new', initParams.template)
      } else if (initParams.loadWorking && workingFilePath && fs.existsSync(workingFilePath) && this.preferences.get('general.working-file')) {
        // 4. Open the working file
        this.commands.execute('project:open', workingFilePath)
      } else {
        // 5. Otherwise, just create a new project
        this.commands.execute('project:new', initParams.template)
      }
    }

    // init updateManager
    this.updateManager.checkExtensionUpdates()
    this.updateManager.on('update-downloaded', () => {
      CheckUpdatesDialog.setUpdateAvailableIcon(true)
    })

    // Remove splash screen
    $('.splash-screen').remove()

    // Set focus to this window and trigger internal app-ready event
    this.emit('focus')
    this.emit('app-ready')

    // `window:app-ready` event is propagated to main-process's window
    ipcRenderer.send('window-event-propagate', 'window:app-ready')
  }

  /**
   * @private
   */
  start () {
    this.beforeHTMLReady()
    this.htmlReady()

    // load keymaps
    let keys = require(`../resources/default/keymaps/${process.platform}.json`)
    this.keymaps.add(keys)
    // load menus
    let menus = require(`../resources/default/menus/${process.platform}.json`)
    this.menu.add(menus['menu'])
    this.contextMenu.add(menus['context-menu'])
    // load preferences
    let prefs = require('../resources/default/preferences/default.json')
    this.preferences.register(prefs)
    // load core metamodel
    let coreMetamodel = require('../resources/default/metamodel.json')
    this.metamodels.register(coreMetamodel)

    $(window.document).ready(() => {
      this.appReady()
    })
  }

  /**
   * @private
   */
  handleEvents () {
    ipcRenderer.on('command', (event, command, ...args) => {
      this.commands.execute(command, ...args)
    })

    ipcRenderer.on('focus', () => {
      this.emit('focus')
    })

    // on window closing
    window.onbeforeunload = (event) => {
      if (this.repository.isModified()) {
        const result = this.dialogs.showSaveConfirmDialog(this.project.getFilename())
        if (result === 'save') {
          const result = this.commands.execute('project:save')
          if (!result) {
            event.returnValue = false
          }
        } else if (result === 'dontsave') {
          this.project.closeProject()
        } else {
          event.returnValue = false
        }
      } else {
        this.project.closeProject()
      }
      localStorage.removeItem('__backup_filename')
    }
  }

  /**
   * @private
   * Repository Setup
   */
  setupRepository () {
    this.repository.on('created', (elems) => {
      try {
        elems.forEach(elem => {
          if (elem instanceof Model) {
            this.modelExplorer.add(elem, true)
            this.modelExplorer.select(elem, true)
          }
        })
      } catch (err) {
        console.error(err)
      }
    })

    this.repository.on('updated', (elems) => {
      try {
        elems.forEach(elem => {
          if (elem instanceof Diagram) {
            this.diagrams.updateDiagram(elem)
          }
          if (this.selections.getSelected() === elem) {
            this.propertyEditor.show(this.selections.getSelectedModels())
            this.documentationEditor.show(elem)
          }
                    // update ModelExplorer
          this.modelExplorer.update(elem)
                    // update Relations of elem in ModelExplorer
          let relations = this.repository.getRelationshipsOf(elem)
          if (relations.length > 0) {
            relations.forEach(rel => {
              this.modelExplorer.update(rel)
            })
          }
        })
      } catch (err) {
        console.error(err)
      }
    })

    this.repository.on('deleted', (elems) => {
      try {
        elems.forEach(elem => {
          if (elem instanceof global.type.Model) {
            this.modelExplorer.remove(elem)
          }
        })
        // Close deleted diagrams
        this.diagrams.getWorkingDiagrams().forEach(dgm => {
          if (!this.repository.get(dgm._id)) {
            this.diagrams.closeDiagram(dgm)
          }
        })
      } catch (err) {
        console.error(err)
      }
    })

    this.repository.on('reordered', (elem) => {
      try {
        if (elem instanceof global.type.Model) {
          this.modelExplorer.remove(elem)
          this.modelExplorer.add(elem, true)
        }
      } catch (err) {
        console.error(err)
      }
    })

    this.repository.on('relocated', (elem, field, oldParent, newParent) => {
      try {
        if (elem instanceof global.type.Model) {
          this.modelExplorer.remove(elem)
          this.modelExplorer.add(elem, true)
        }
      } catch (err) {
        console.error(err)
      }
    })

    this.repository.on('operationExecuted', (operation) => {
      try {
        var elems = this.repository.extractChanged(operation)
        if (this.diagrams.needRepaint(elems)) {
          this.diagrams.repaint()
        }
      } catch (err) {
        console.error(err)
      }
    })

    this.repository.on('modified', () => {
      try {
        this.titlebar.update()
      } catch (err) {
        console.error(err)
      }
    })
  }

  /**
   * @private
   * Factory Setup
   */
  setupFactory () {
    this.factory.on('diagramCreated', (diagram) => {
      this.diagrams.setCurrentDiagram(diagram)
      this.modelExplorer.select(diagram, true)
    })
    this.factory.on('elementCreated', (model, view) => {
    })
  }

  /**
   * @private
   * ProjectManager Setup
   */
  setupProjectManager () {
    this.project.on('projectCreated', (project) => {
      try {
        this.diagrams.closeAll()
        this.modelExplorer.rebuild()
        this.titlebar.update()
        this.toolbox.setDiagram(null)
      } catch (err) {
        console.error(err)
      }
    })

    this.project.on('projectLoaded', (filename, project) => {
      try {
        this.modelExplorer.rebuild()
        this.modelExplorer.expand(project)
        this.titlebar.update()

        // Remember working file so as to open the working file when app is launched.
        if (filename) {
          localStorage.setItem('__working_filename', filename)
        }

        // Open default diagrams
        var defaultDiagrams = this.repository.findAll(function (elem) {
          return (elem instanceof global.type.Diagram && elem.defaultDiagram === true)
        })
        defaultDiagrams.forEach(diagram => {
          this.diagrams.openDiagram(diagram)
        })

        if (defaultDiagrams.length > 0) {
          this.diagrams.setCurrentDiagram(defaultDiagrams[0])
        }
        this.diagrams.restoreWorkingDiagrams()
      } catch (err) {
        console.error(err)
      }
    })

    this.project.on('projectSaved', (filename, project) => {
      try {
        this.titlebar.update()
        this.diagrams.saveWorkingDiagrams()
      } catch (err) {
        console.error(err)
      }
    })

    this.project.on('beforeProjectClose', (filename, project) => {
      try {
        this.diagrams.saveWorkingDiagrams()
      } catch (err) {
        console.error(err)
      }
    })

    this.project.on('projectClosed', () => {
      try {
        this.diagrams.closeAll()
        this.modelExplorer.rebuild()
        this.toolbox.setDiagram(null)
        this.propertyEditor.show(null)
        this.documentationEditor.show(null)
        this.titlebar.update()
      } catch (err) {
        console.error(err)
      }
    })

    this.project.on('exported', (filename, elem) => {
    })

    this.project.on('imported', (filename, elem) => {
      try {
        this.modelExplorer.add(elem, true)
      } catch (err) {
        console.error(err)
      }
    })
  }

  /**
   * @private
   * SelectionManager Setup
   */
  setupSelectionManager () {
    this.selections.on('selectionChanged', (models, views) => {
      try {
        if (views.length > 0) {
          this.modelExplorer.deselect()
          console.log(views[0])
        } else {
          this.diagrams.deselectAll()
        }

        // Update Property/Documentation/Tag Editor
        if (models.length === 1) {
          this.documentationEditor.show(models[0])
          this.statusbar.setElement(models[0])
        } else {
          this.documentationEditor.show(null)
          this.statusbar.setElement(null)
        }

        this.styleEditor.show(views)

        this.propertyEditor.show(models)

        if (this.diagrams.needRepaint(_.union(models, views))) {
          this.diagrams.repaint()
        }
      } catch (err) {
        console.error(err)
      }
    })
  }

  /**
   * @private
   */
  setupModelExplorer () {
    this.modelExplorer.on('selected', (elem) => {
      try {
        this.selections.select([elem], null)
      } catch (err) {
        console.error(err)
      }
    })
    this.modelExplorer.on('doubleClicked', (elem) => {
      try {
        if (elem instanceof Diagram) {
          this.diagrams.setCurrentDiagram(elem)
        }
      } catch (err) {
        console.error(err)
      }
    })
    // 모델 요소를 ModelExplorer 내에서 Drag 할때, Accept 여부 판단.
    this.modelExplorer.on('dragOver', (dragEvent) => {
      try {
        var source = dragEvent.source
        var target = dragEvent.target
        var field = dragEvent.source.getParentField()
        if (target[field] && target.canContain(source)) {
          dragEvent.accept = true
        } else {
          dragEvent.accept = false
        }
      } catch (err) {
        console.error(err)
      }
    })
        // 모델 요소를 ModelExplorer 내에서 Drop 할때.
    this.modelExplorer.on('drop', (dropEvent) => {
      try {
        var source = dropEvent.source
        var target = dropEvent.target
        var field = dropEvent.source.getParentField()
        if (target.canContain(source) && target[field]) {
          app.engine.relocate(source, target, field)
          this.modelExplorer.select(source, true)
        }
      } catch (err) {
        console.error(err)
      }
    })
        // 모델 요소를 ModelExplorer에서 Diagram영역으로 Drag 할때, Accept 여부 판단.
    this.modelExplorer.on('dragOverDiagram', (dragEvent) => {
      try {
        dragEvent.accept = dragEvent.diagram.canAcceptModel(dragEvent.source)
      } catch (err) {
        console.error(err)
      }
    })
        // 모델 요소를 ModelExplorer에서 Diagram영역으로 Drop 할때.
    this.modelExplorer.on('dropOnDiagram', (dropEvent) => {
      try {
        if (dropEvent.diagram.canAcceptModel(dropEvent.source)) {
          var editor = this.diagrams.getEditor()
          var diagram = editor.diagram
          var model = dropEvent.source
          var p = editor.convertPosition(dropEvent)
          var containerView = diagram.getViewAt(editor.canvas, p.x, p.y, true)

          var options = {
            diagram: diagram,
            editor: editor,
            x: p.x,
            y: p.y,
            model: model,
            containerView: containerView
          }
          this.factory.createViewOf(options)
          this.diagrams.repaint()
        }
      } catch (err) {
        console.error(err)
      }
    })
  }

  /**
   * @private
   */
  setupStyleEditor () {
    this.styleEditor.on('styleChanged', (views, field, value) => {
      try {
        if (field === 'font.face') {
          this.engine.setFontFace(this.diagrams.getEditor(), views, value)
        } else if (field === 'font.size') {
          if (!_.isNumber(value)) {
            value = parseInt(value, 10)
          }
          this.engine.setFontSize(this.diagrams.getEditor(), views, value)
        } else if (field === 'fillColor') {
          this.engine.setFillColor(this.diagrams.getEditor(), views, value)
        } else if (field === 'lineColor') {
          this.engine.setLineColor(this.diagrams.getEditor(), views, value)
        } else if (field === 'fontColor') {
          this.engine.setFontColor(this.diagrams.getEditor(), views, value)
        } else if (field === 'lineStyle') {
          this.engine.setLineStyle(this.diagrams.getEditor(), views, value)
        } else if (field === 'autoResize') {
          this.engine.setAutoResize(this.diagrams.getEditor(), views, value)
        } else {
          this.engine.setElemsProperty(views, field, value)
        }
      } catch (err) {
        console.error(err)
      }
    })
  }

  /**
   * @private
   */
  setupPropertyEditor () {
    this.propertyEditor.on('propertyChanged', (elems, field, value) => {
      try {
        this.engine.setElemsProperty(elems, field, value)
        this.diagrams.repaint()
      } catch (err) {
        console.error(err)
      }
    })
  }

  /**
   * @private
   */
  setupDocumentationEditor () {
    this.documentationEditor.on('documentationChanged', (elem, value) => {
      try {
        this.engine.setProperty(elem, 'documentation', value)
      } catch (err) {
        console.error(err)
      }
    })
  }

  /**
   * @private
   */
  setupQuickEdit () {
    this.quickedits.on('open', (editor, view, x, y) => {
      try {
        // TODO this.commands.get(Commands.EDIT_DELETE_FROM_MODEL).setEnabled(false);
      } catch (err) {
        console.error(err)
      }
    })
    this.quickedits.on('close', (editor, view, x, y) => {
      try {
        // TODO this.commands.get(Commands.EDIT_DELETE_FROM_MODEL).setEnabled(true);
      } catch (err) {
        console.error(err)
      }
    })
  }

  /**
   * @private
   */
  setupDiagramManager () {
    this.diagrams.on('currentDiagramChanged', (diagram, editor) => {
      try {
        if (diagram) {
          this.toolbox.setDiagram(diagram)
        } else {
          this.toolbox.setDiagram(null)
        }
        this.quickedits.close()
      } catch (err) {
        console.error(err)
      }
    })
    this.diagrams.on('workingDiagramRemove', (diagram) => {
      try {
        this.selections.selectViews([])
        this.quickedits.close()
      } catch (err) {
        console.error(err)
      }
    })
    this.diagrams.on('mouseDown', (mouseEvent) => {
      try {
        this.quickedits.close()
      } catch (err) {
        console.error(err)
      }
    })
    this.diagrams.on('selectionChanged', (views) => {
      try {
        if (views && views.length > 0) {
          this.selections.selectViews(views)
          this.modelExplorer.select(null)
        } else {
          this.selections.select([], [])
          this.modelExplorer.select(null)
        }
      } catch (err) {
        console.error(err)
      }
    })
    this.diagrams.on('viewDoubleClicked', (view, x, y) => {
      try {
        if (view instanceof type.HyperlinkView && view.model instanceof type.Hyperlink) {
          if (view.model.reference instanceof type.Model) {
            if (view.model.reference instanceof type.Diagram) {
              this.diagrams.setCurrentDiagram(view.model.reference)
            } else {
              this.modelExplorer.select(view.model.reference)
            }
          } else if (view.model.url && view.model.url.length > 0) {
            // TODO appshell.app.openURLInDefaultBrowser(view.model.url)
          }
        } else {
          this.quickedits.open(view, x, y)
        }
      } catch (err) {
        console.error(err)
      }
    })
    this.diagrams.on('viewMoved', (views, dx, dy) => {
      try {
        this.engine.moveViews(this.diagrams.getEditor(), views, dx, dy)
      } catch (err) {
        console.error(err)
      }
    })
    this.diagrams.on('parasiticViewMoved', (view, alpha, distance) => {
      try {
        this.engine.moveParasiticView(this.diagrams.getEditor(), view, alpha, distance)
      } catch (err) {
        console.error(err)
      }
    })
    this.diagrams.on('nodeResized', (node, left, top, right, bottom) => {
      try {
        this.engine.resizeNode(this.diagrams.getEditor(), node, left, top, right, bottom)
      } catch (err) {
        console.error(err)
      }
    })
    this.diagrams.on('edgeModified', (edge, points) => {
      try {
        this.engine.modifyEdge(this.diagrams.getEditor(), edge, points)
      } catch (err) {
        console.error(err)
      }
    })

    // -- Move to uml/main.js (to treat UMLSeqMessageView's reconnect specially)
    // this.diagrams.on('edgeReconnected', (edge, points, newParticipant, isTailSide) => {
    //     this.engine.reconnectEdge(this.diagrams.getEditor(), edge, points, newParticipant, newParticipant.model, isTailSide);
    // });
  }

  /**
   * @private
   */
  setupKeyBindings () {
    $('body').keydown(e => {
      switch (e.which) {
      case keycode('+'):
      case keycode('='):
      case keycode('numpad +'):
        if (e.ctrlKey || e.metaKey) {
          this.commands.execute('view:zoom-in')
        }
        break
      case keycode('-'):
      case keycode('numpad -'):
        if (e.ctrlKey || e.metaKey) {
          this.commands.execute('view:zoom-out')
        }
        break
      }
    })
  }

  /**
   * @private
   */
  setupLicenseManager () {
    this.licenseManager.on('statusChanged', status => {
      this.titlebar.update()
    })
  }

  setupPreferenceManager () {
    this.preferences.on('change', (key, value) => {
      if (key === 'theme.default') {
        this.stylesheets.setThemeCSS(value)
      }
      if (key === 'diagramEditor.showGrid') {
        app.menu.updateStates(null, null, {'view.show-grid': value})
      }
    })
  }

  /**
   * @private
   */
  setupAutoBackup () {
    setInterval(() => {
      if (this.preferences.get('general.auto-backup')) {
        var fullPath = path.join(this.getUserPath(), '__backup.mdj')
        var project = this.project.getProject()
        if (project) {
          var data = this.repository.writeObject(project)
          fs.writeFile(fullPath, data, 'utf8', err => {
            if (err) {
              console.error('[AutoBackup] Failed to backup file: ', err)
            } else {
              localStorage.setItem('__backup_filename', fullPath)
              console.log('[AutoBackup] Temporal backup has done at ' + fullPath)
            }
          })
        }
      }
    }, AUTO_BACKUP_INTERVAL)
  }
}

module.exports = AppContext
