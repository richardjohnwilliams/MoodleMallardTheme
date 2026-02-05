"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
const child_process_1 = require("child_process");
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function activate(context) {
    function formatDocument(document) {
        return new Promise((resolve) => {
            const text = document.getText();
            const awk = (0, child_process_1.spawn)('awk', ['-f', path.resolve(__dirname, '../bin/inifmt.awk')]);
            console.log('Spawned:', ...awk.spawnargs);
            let stdout = '';
            awk.stdout.setEncoding('utf8');
            awk.stdout.on('data', (chunk) => { stdout += chunk; });
            let stderr = '';
            awk.stderr.setEncoding('utf8');
            awk.stderr.on('data', (chunk) => { stderr += chunk; });
            awk.on('close', (code) => {
                if (code === 0) {
                    console.log('%s succeeded (output length: %i)', awk.spawnfile, stdout.length);
                    if (stdout.length > 0 && stdout !== text) {
                        resolve([new vscode.TextEdit(new vscode.Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end), stdout)]);
                    }
                    else {
                        console.log('Nothing to change');
                        resolve([]);
                    }
                }
                else {
                    console.log('%s failed (exit status: %i)', awk.spawnfile, code);
                    console.error(stderr);
                    resolve([]);
                }
            });
            awk.stdin.write(document.getText());
            awk.stdin.end();
        });
    }
    function handleCommand() {
        const document = vscode.window.activeTextEditor?.document;
        if (document != null) {
            formatDocument(document)
                .then((edits) => {
                const edit = new vscode.WorkspaceEdit();
                edit.set(document.uri, edits);
                vscode.workspace.applyEdit(edit)
                    .then(() => { }, () => { });
            }, () => { });
        }
    }
    vscode.languages.registerDocumentFormattingEditProvider([
        'ini',
        'dotenv',
        'hosts',
        'ignore',
        'plaintext',
        'properties',
        'ssh_config'
    ], {
        provideDocumentFormattingEdits(document) {
            return formatDocument(document);
        }
    });
    context.subscriptions.push(vscode.commands.registerCommand('inifmt.format', () => handleCommand()));
}
exports.activate = activate;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map