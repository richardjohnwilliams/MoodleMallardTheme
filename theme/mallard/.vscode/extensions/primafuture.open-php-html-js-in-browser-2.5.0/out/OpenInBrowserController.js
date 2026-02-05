'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const g = require("./g");
const path = require('path');
const fs = require("fs");
const isSubdir = require('is-subdir');
const variableResolver_1 = require("./variableResolver");
const child_process_1 = require("child_process");
const browsers = require("./browsers");
class OpenInBrowserController {
    constructor(context) {
        this.context = context;
        this.createStatusBarItem();
        this.context.subscriptions.push(vscode.commands.registerCommand(g.COMMANDS.openInBrowser, this.onCommandOpenInBrowser, this));
        this.context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(this.onChangeConfiguration, this));
    }
    createStatusBarItem() {
        const configuration = vscode.workspace.getConfiguration();
        if (this.statusBarItem) {
            this.statusBarItem.dispose();
            this.statusBarItem = undefined;
        }
        if (configuration.get(g.CONF.showStatusBarItem)) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -100);
            this.statusBarItem.command = g.COMMANDS.openInBrowser;
            this.statusBarItem.text = "$(globe) Open In Browser";
            this.statusBarItem.show();
        }
    }
    onCommandOpenInBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            const configuration = vscode.workspace.getConfiguration();
            if (!vscode.window.activeTextEditor) {
                vscode.window.showErrorMessage('No document to open in browser');
                return;
            }
            if (vscode.window.activeTextEditor.document.isUntitled) {
                vscode.window.showErrorMessage('Document must be saved before Open in browser');
                return;
            }
            yield vscode.window.activeTextEditor.document.save();
            const currentFilename = vscode.window.activeTextEditor.document.fileName;
            const isSubdirSmart = (dir, subdir) => {
                if (!fs.existsSync(dir) || !fs.existsSync(subdir)) {
                    return false;
                }
                if (isSubdir(dir, subdir)) {
                    return true;
                }
                /*
                dir = fs.realpathSync(dir);
                if (isSubdir(dir, subdir)) {
                    return true;
                }
                subdir = fs.realpathSync(subdir);
                if (isSubdir(dir, subdir)) {
                    return true;
                }*/
                return false;
            };
            const autodetectDocumentInfo = (filename) => {
                const filenameFolder = path.dirname(currentFilename);
                let folder;
                let autodetectedDocumentRootFolder;
                let autodetectedHost;
                if (isSubdirSmart(folder = "/var/www/", filenameFolder)) {
                    autodetectedDocumentRootFolder = folder;
                    autodetectedHost = "localhost";
                }
                else if (isSubdirSmart(folder = "C:\\xampp\\htdocs\\", filenameFolder)) {
                    autodetectedDocumentRootFolder = folder;
                    autodetectedHost = "localhost";
                }
                else if (isSubdirSmart(folder = "C:\\wamp\\www\\", filenameFolder)) {
                    autodetectedDocumentRootFolder = folder;
                    autodetectedHost = "localhost";
                }
                else if (isSubdirSmart(folder = "/Applications/MAMP/htdocs/", filenameFolder)) {
                    autodetectedDocumentRootFolder = folder;
                    autodetectedHost = "localhost:8888";
                }
                else if (isSubdirSmart(folder = "/Applications/XAMPP/htdocs/", filenameFolder)) {
                    autodetectedDocumentRootFolder = folder;
                    autodetectedHost = "localhost";
                }
                if (autodetectedDocumentRootFolder && autodetectedHost) {
                    return {
                        documentRoot: autodetectedDocumentRootFolder,
                        host: autodetectedHost,
                    };
                }
                else {
                    return null;
                }
            };
            const getRelativeDirnameDocumentRoot = (filename) => {
                const filenameFolder = path.dirname(currentFilename);
                const documentRootFolderCandidates = [];
                let documentRootFolder = configuration.get(g.CONF.documentRootFolder);
                // autodetection of document root folder
                if (!documentRootFolder) {
                    const autodetectedDocumentInfo = autodetectDocumentInfo(filename);
                    if (autodetectedDocumentInfo) {
                        console.log(`Autodetected document root folder: ${autodetectedDocumentInfo.documentRoot}`);
                        documentRootFolder = autodetectedDocumentInfo.documentRoot;
                        documentRootFolderCandidates.push(documentRootFolder);
                    }
                }
                else {
                    documentRootFolderCandidates.push(documentRootFolder);
                }
                const alternativeDocumentRootFolders = configuration.get(g.CONF.alternativeDocumentRootFolders);
                if (alternativeDocumentRootFolders !== undefined) {
                    for (const folder of alternativeDocumentRootFolders) {
                        documentRootFolderCandidates.push(folder);
                    }
                }
                if (documentRootFolderCandidates.length === 0) {
                    throw new Error('Invalid Configuration! Document root folder must be set to use http://localhost');
                }
                else {
                    for (const documentRootFolder of documentRootFolderCandidates) {
                        console.log(`Check folder: ${documentRootFolder}`);
                        if (isSubdirSmart(documentRootFolder, filenameFolder)) {
                            const subpath = filenameFolder.substr(documentRootFolder.length);
                            return subpath;
                        }
                    }
                    throw new Error('Workspace folder is outside configured Document root');
                }
            };
            let variableResolver = new variableResolver_1.VariableResolver();
            const variableResolverWorkspaceUri = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : undefined;
            const variableResolverCustomVariables = {
                host: (originalMatch) => {
                    let customHost = configuration.get(g.CONF.customHost);
                    if (customHost) {
                        return customHost;
                    }
                    // autodetekce z cesty k souboru
                    const autodetectedDocumentInfo = autodetectDocumentInfo(currentFilename);
                    if (autodetectedDocumentInfo) {
                        console.log(`Autodetected document host: ${autodetectedDocumentInfo.host}`);
                        return autodetectedDocumentInfo.host;
                    }
                    return "localhost";
                },
                relativeDirnameDocumentRoot: (originalMatch) => {
                    try {
                        const relativeDirnameDocumentRoot = getRelativeDirnameDocumentRoot(currentFilename);
                        return relativeDirnameDocumentRoot;
                    }
                    catch (err) {
                        return "";
                    }
                }
            };
            let urlToOpenConf = configuration.get(g.CONF.urlToOpen);
            let url;
            if (!urlToOpenConf || urlToOpenConf === 'http://localhost/') {
                let err;
                try {
                    getRelativeDirnameDocumentRoot(currentFilename);
                }
                catch (e) {
                    err = `${e}`;
                    if (currentFilename.endsWith('.html')) {
                        // ignore for html
                    }
                    else {
                        vscode.window.showErrorMessage(`${e}. Falling back to scheme file:///`);
                    }
                    urlToOpenConf = 'file:///';
                }
                if (!err) {
                    url = variableResolver.resolveString(variableResolverWorkspaceUri, "http://${host}/${relativeDirnameDocumentRoot}/${fileBasename}", variableResolverCustomVariables);
                }
            }
            if (urlToOpenConf && urlToOpenConf === 'file:///') {
                // odstranit z nazvu souboru lomitka na zacatku, aby
                // na linuxu to bylo file:///home/whatever
                // a na windows to bylo file:///c:/whatever/
                url = `file:///${currentFilename.replace(/\/+/, '')}`;
            }
            if (urlToOpenConf && urlToOpenConf === 'custom') {
                const customUrlToOpen = configuration.get(g.CONF.customUrlToOpen);
                if (!customUrlToOpen) {
                    vscode.window.showErrorMessage('Custom url is not set');
                    return;
                }
                url = variableResolver.resolveString(variableResolverWorkspaceUri, customUrlToOpen, variableResolverCustomVariables);
            }
            if (!url) {
                vscode.window.showErrorMessage('Unknown behaviour. Invalid url to open set');
                return;
            }
            else {
                // opravit double slashes
                url = url.replace('://', ':⁄⁄');
                url = url.replace('//', '/');
                url = url.replace(':⁄⁄', '://');
            }
            console.log(`Open url: ${url}`);
            let selectedBrowser = configuration.get(g.CONF.selectedBrowser);
            const browserItems = browsers.getBrowsersForUrl(configuration, url);
            if (!selectedBrowser || selectedBrowser === 'Ask always...') {
                const browser = yield vscode.window.showQuickPick(browserItems.filter((v) => { return v.command !== null; }), { placeHolder: 'Select the browser' });
                if (browser) {
                    selectedBrowser = browser.label;
                    if (configuration.get(g.CONF.remmemberBrowserSelection)) {
                        configuration.update(g.CONF.selectedBrowser, selectedBrowser, vscode.ConfigurationTarget.Global);
                    }
                }
            }
            if (selectedBrowser === 'Custom') {
                selectedBrowser = 'Custom...';
            }
            if (selectedBrowser) {
                console.log(`Open in browser: ${selectedBrowser}`);
                let browser = browserItems.filter((v) => { return v.label === selectedBrowser; })[0];
                if (browser && browser.command) {
                    let process = child_process_1.exec(browser.command, (error, stdout, stderr) => {
                        if (error) {
                            vscode.window.showErrorMessage(`Unable to launch selected browser (${selectedBrowser}). \r\n ${error} \r\n ${stderr} \r\n ${stdout}`);
                            configuration.update(g.CONF.selectedBrowser, "", vscode.ConfigurationTarget.Global);
                        }
                    });
                    console.log(`Browser process PID ${process.pid}`);
                }
                else {
                    console.warn('No browser command to launch');
                }
            }
        });
    }
    onChangeConfiguration() {
        this.createStatusBarItem();
    }
    dispose() {
        if (this.statusBarItem) {
            this.statusBarItem.dispose();
            this.statusBarItem = undefined;
        }
    }
}
exports.OpenInBrowserController = OpenInBrowserController;
//# sourceMappingURL=OpenInBrowserController.js.map