"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("path");
const vscode = require("vscode");
const fs = require("fs");
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
/** Templates base folder */
let templatesBaseDir;
function activate(context) {
    // The server is implemented in node
    let serverModule = context.asAbsolutePath(path.join('server', 'out', 'html-language-features', 'smarty', 'server.js'));
    // Set up exec options
    let initializationOptions = {
        storageDir: context.storageUri.scheme === "file" ? context.storageUri.path : null
    };
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    let debugOptions = {
        execArgv: ['--nolazy', '--inspect=6009']
    };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions = {
        run: {
            module: serverModule,
            transport: node_1.TransportKind.ipc
        },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
            options: debugOptions
        }
    };
    // Options to control the language client
    let clientOptions = {
        // Register the server for TPL files
        documentSelector: [
            { scheme: 'file', language: 'smarty' },
            { scheme: 'untitled', language: 'smarty' }
        ],
        initializationOptions: initializationOptions,
        synchronize: {
            // Watch for plugin directories
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/*.php')
        }
    };
    // Create the language client and start the client.
    client = new node_1.LanguageClient('smarty', 'Smarty Language Server', serverOptions, clientOptions);
    // Start the client. This will also launch the server
    client.start();
    // Set up PHP document hints
    setUpTemplatesBaseFolder();
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((e) => {
        setUpTemplatesBaseFolder();
    }));
    context.subscriptions.push(vscode.languages.registerDocumentLinkProvider('php', {
        provideDocumentLinks: async (doc, token) => {
            let links = [];
            if (vscode.workspace.workspaceFolders && templatesBaseDir !== undefined) {
                for (let lineIdx = 0; lineIdx < doc.lineCount; lineIdx++) {
                    const line = doc.lineAt(lineIdx);
                    let pos;
                    while ((pos = line.text.indexOf(".tpl", pos)) !== -1) {
                        pos += 3; // End of .tpl
                        const nextChar = line.text.substring(pos + 1, pos + 2);
                        if (nextChar === '\'' || nextChar === '"') {
                            const startPos = line.text.lastIndexOf(nextChar, pos);
                            if (startPos !== -1) {
                                const range = new vscode.Range(lineIdx, startPos + 1, lineIdx, pos + 1);
                                const file = templatesBaseDir + line.text.substring(startPos + 1, pos + 1);
                                links.push({
                                    range: range,
                                    target: vscode.Uri.file(file)
                                });
                            }
                        }
                    }
                }
            }
            return links;
        }
    }));
    // Copy TPL path
    context.subscriptions.push(vscode.commands.registerTextEditorCommand("smarty.copyTplPath", async (textEditor) => {
        const escapedPathSep = path.sep.replace(/([\\\/])/, '\\$1');
        const regex = new RegExp("^.*" + escapedPathSep + "templates" + escapedPathSep);
        vscode.env.clipboard.writeText(textEditor.document.uri.fsPath.replace(regex, ''));
    }));
}
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
/**
 * Set up templates base folder
 */
async function setUpTemplatesBaseFolder() {
    templatesBaseDir = undefined;
    let wsPaths = vscode.workspace.workspaceFolders.map((folder) => folder.uri.fsPath);
    for (let depthLeft = 3; depthLeft > 0 && templatesBaseDir === undefined; depthLeft--) {
        let pathDirs = await Promise.all(wsPaths.map((path) => fs.promises.readdir(path, { withFileTypes: true })));
        let newPaths = [];
        for (let wsPath of wsPaths) {
            let dirs = pathDirs.shift();
            if (dirs !== undefined) {
                for (const dir of dirs) {
                    if (dir.isDirectory()) {
                        const dirPath = wsPath + path.sep + dir.name;
                        if (dir.name === "templates") {
                            templatesBaseDir = dirPath + path.sep;
                            break;
                        }
                        else
                            newPaths.push(dirPath);
                    }
                }
            }
        }
        wsPaths = newPaths;
    }
}
//# sourceMappingURL=extension.js.map