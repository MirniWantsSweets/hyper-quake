'use strict';

const electron = require('electron');
const { isNumber } = require('lodash');
const {
    BrowserWindow,
    Menu
} = electron;

const DEBUG = process.env.NODE_ENV === 'development' || process.env.DEBUG || false;
const isMac = process.platform === 'darwin';

let log;
if (DEBUG) {
    log = require('electron-log');
    log.transports.file.level = 'silly';
}

module.exports = class Quake {
    constructor(app, quakeWindow = null) {
        this.app = app;
        this.config = app.config.getConfig().quake || {};
        this.quakeWindow = quakeWindow;
        this.quakeWindow.on('close', () => this.handleOnQuakeWindowClose());
        this.previousAppFocus = null;

        if (this.config.hideDock) {
            this.app.dock.hide();
        }

        if (this.quakeWindow) {
            this.setBounds();
        }
    }

    toggleWindow() {
        debug('toggling window');
        console.error('test2');
        if ( !this.quakeWindow ) {
            // if no quake window, create one and try toggling again after it's created
            this.createNewQuakeWindow(() => this.setBounds());
            return;
        }

        if (this.quakeWindow.isFocused()) {
            if (!this.quakeWindow.isFullScreen()) {
                this.quakeWindow.hide();
            }
            this.returnFocus();
            this.isExpanded = false;
            this.quakeWindow.setAlwaysOnTop(false);
        } else {
            this.setBounds();
            if (this.quakeWindow.isVisible()) {
                this.quakeWindow.focus();
            } else {
                this.previousAppFocus = BrowserWindow.getFocusedWindow();
                this.quakeWindow.show(() => debug('test'));
                this.quakeWindow.focus();
            }
        }

    }

    expandWindow() {
        debug('expanding window');
        console.error('test3');
        if ( !this.quakeWindow || !this.quakeWindow.isVisible() || !this.quakeWindow.isFocused() ) {
            return;
        }
        if ( !this.isExpanded ) {
            this.setBounds(true);
            this.quakeWindow.focus();
            this.isExpanded = true;
        }
        else {
            this.setBounds();
            this.isExpanded = false;
        }
    }

    stayOnTop() {
        debug('staying on top');
        console.error('test4');
        if ( !this.quakeWindow || !this.quakeWindow.isVisible() || !this.quakeWindow.isFocused() ) {
            return;
        }
        if ( !this.quakeWindow.isAlwaysOnTop() ) {
            this.quakeWindow.setAlwaysOnTop(true);
            this.isFixed = true;
        }
        else {
            this.quakeWindow.setAlwaysOnTop(false);
            this.isFixed = false;
        }

    }

    setBounds(all_screen = false) {
        debug(`setting position to ${this.config.position}`);

        // Get current screen size
        const screen = electron.screen;
        const point = screen.getCursorScreenPoint();
        const display = screen.getDisplayNearestPoint(point);        
        const bounds = display.workArea;
        const {
            height,
            width
        } = bounds;

        let size = this.config.size || 0.5;
        if (all_screen) {
            size = 1
        }

        const position = this.config.position || "top"; 
        if (['top', 'bottom'].includes(position)) {
            if (size <= 1) {
                bounds.height = height*size; 
            }
            else {
                bounds.height = size;
            }
        }
        if (['left', 'right'].includes(position)) {
            if (size < 1) {
                bounds.width = width*size; 
            }
            else {
                bounds.width = size;
            }
        }

        if (position === "bottom")
            bounds.y += height - bounds.height;
        if (position === "right")
            bounds.x += width - bounds.width;

        bounds.y = Math.round(bounds.y);
        bounds.width = Math.round(bounds.width);
        bounds.x = Math.round(bounds.x);
        bounds.height = Math.round(bounds.height);

        this.quakeWindow.setBounds(bounds);
    }

    createNewQuakeWindow(callback) {
        debug('creating new window');

        this.app.createWindow(win => {
            this.quakeWindow = win;

            // creates a shell in the new window
            win.rpc.emit('termgroup add req');

            this.quakeWindow.on('close', () => this.handleOnQuakeWindowClose());

            if (callback) {
                callback();
            }
        });
    }

    returnFocus() {
        // this attempts to return focus to the app that previously had focus before Hyper
        if (((this.previousAppFocus || {}).sessions || {}).size) {
            this.previousAppFocus.focus();
        } else if (isMac) {
            Menu.sendActionToFirstResponder('hide:');
        }
    }

    handleOnQuakeWindowClose() {
        debug('closing');

        this.quakeWindow = null;
    }

    destroy() {
        this.quakeWindow = null;
        this.previousAppFocus = null;

        debug('destroyed');
        // @TODO other cleanup?
    }
};

function debug(...args) {
    if (DEBUG) {
        console.error(...args);
        log.info(...args);
    }
}