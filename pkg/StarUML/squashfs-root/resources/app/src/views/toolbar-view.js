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

/**
 * Toolbar
 * @private
 */
class ToolbarView {

  constructor () {
    this.$toolbar = null

    this.$contentHolder = null

    this.preferenceManager = null
  }

  /**
   * Toggle Toolbar
   */
  toggle () {
    if (this.isVisible()) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * Show Toolbar
   */
  show () {
    var elementPrefs = {
      size: this.$toolbar.outerWidth(),
      visible: true
    }
    this.$toolbar.show()
    this.$contentHolder.css('right', elementPrefs.size)
    this.$toolbar.trigger('panelExpanded', [elementPrefs.size])
    this.preferenceManager.setViewState('toolbar', elementPrefs)
    this.updateMenu()
  }

  /**
   * Hide Toolbar
   */
  hide () {
    var elementPrefs = {
      size: this.$toolbar.outerWidth(),
      visible: false
    }
    this.$toolbar.hide()
    this.$contentHolder.css('right', 0)
    this.$toolbar.trigger('panelCollapsed', [0])
    this.preferenceManager.setViewState('toolbar', elementPrefs)
    this.updateMenu()
  }

  /**
   * Return whether Toolbar is visible or not
   *
   * @return {booean}
   */
  isVisible () {
    return this.$toolbar.is(':visible')
  }

  updateMenu () {
    let checkedStates = {
      'view.toolbar': this.isVisible()
    }
    app.menu.updateStates(null, null, checkedStates)
  }

  htmlReady () {
    this.$toolbar = $('#toolbar')
    this.$contentHolder = $('.content-holder')

    var elementPrefs = this.preferenceManager.getViewState('toolbar')
    if (elementPrefs.visible === false) {
      this.hide()
    } else {
      this.show()
    }

    app.commands.register('view:toolbar', () => { this.toggle() })
  }

  appReady () {
    this.updateMenu()
  }
}

module.exports = ToolbarView
