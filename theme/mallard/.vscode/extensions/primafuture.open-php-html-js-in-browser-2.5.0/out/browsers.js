"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const g = require("./g");
const isWsl = require("is-wsl");
function commandByPlatform(platformCommand) {
    if (process.platform.toLowerCase() === 'win32' || isWsl) {
        return platformCommand.windows;
    }
    else if (process.platform.toLowerCase() === 'linux') {
        return platformCommand.linux;
    }
    else if (process.platform.toLowerCase() === 'darwin') {
        return platformCommand.mac;
    }
    throw Error("Unknown OS platform");
}
function getBrowsersForUrl(configuration, url) {
    let items = [];
    items = items.concat([
        {
            label: 'Chrome',
            detail: '',
            description: '',
            command: commandByPlatform({
                linux: `google-chrome "${url}"`,
                windows: `start chrome.exe "${url}"`,
                mac: `open -a "Google Chrome" "${url}"`,
            })
        },
    ]);
    items = items.concat([
        {
            label: 'Chromium',
            detail: '',
            description: '',
            command: commandByPlatform({
                linux: `chromium-browser "${url}"`,
                windows: null,
                mac: `open -a "Chromium" "${url}"`,
            })
        },
    ]);
    items = items.concat([
        {
            label: 'Firefox',
            detail: '',
            description: '',
            command: commandByPlatform({
                linux: `firefox "${url}"`,
                windows: `start firefox.exe "${url}"`,
                mac: `open -a "Firefox" "${url}"`,
            })
        },
    ]);
    items = items.concat([
        {
            label: 'Safari',
            detail: '',
            description: '',
            command: commandByPlatform({
                linux: null,
                windows: null,
                mac: `open -a "Safari" "${url}"`,
            })
        },
    ]);
    items = items.concat([
        {
            label: 'Opera',
            detail: '',
            description: '',
            command: commandByPlatform({
                linux: `opera "${url}"`,
                windows: `start opera.exe "${url}"`,
                mac: `open -a "Opera" "${url}"`,
            })
        },
    ]);
    items = items.concat([
        {
            label: 'Edge',
            detail: '',
            description: '',
            command: commandByPlatform({
                linux: null,
                windows: `start microsoft-edge:"${url}"`,
                mac: null,
            })
        },
    ]);
    items = items.concat([
        {
            label: 'Internet Explorer',
            detail: '',
            description: '',
            command: commandByPlatform({
                linux: null,
                windows: `start iexplore.exe "${url}"`,
                mac: null,
            })
        },
    ]);
    const customBrowserPath = configuration.get(g.CONF.customBrowserPath);
    if (customBrowserPath) {
        items = items.concat([
            {
                label: 'Custom...',
                detail: '',
                description: `(${customBrowserPath})`,
                command: `"${customBrowserPath}" "${url}"`
            },
        ]);
    }
    return items;
}
exports.getBrowsersForUrl = getBrowsersForUrl;
//# sourceMappingURL=browsers.js.map