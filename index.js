'use strict';

const Quake = require('./quake');
const log = require('electron-log');
const registerShortcut = require('hyperterm-register-shortcut');

let quake;

module.exports.onApp = function registerGlobalHotkey(app) {
    let quakeWindow;
    if (quake) {
        quakeWindow = quake.quakeWindow;
        quake.destroy();
    }

    if (!quakeWindow) {
        const windows = app.getWindows();
        if (windows.size === 1) {
            quakeWindow = windows.values().next().value;
        }
    }
    
    quake = new Quake(app, quakeWindow);
    console.log('hello');
    registerShortcut('quake-show', () => quake.toggleWindow())(app);
    registerShortcut('quake-expand', () => quake.expandWindow())(app);
    registerShortcut('quake-stay-on-top', () => quake.stayOnTop())(app);
};

module.exports.onUnload = function unregisterGlobalHotkey() {
    if (!quake) {
        console.error('onUnload was called before a quake window was created');
    } else {
        quake.destroy();
    }
};
