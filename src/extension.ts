import * as vscode from 'vscode';
import * as path from 'path';

var panel: vscode.WebviewPanel | undefined = undefined;
var current: vscode.TextEditor | undefined = undefined;
var selfScroll = false;

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('rpgrw-vscode.preview', async () => {
        initPreview(context);
    });
	vscode.workspace.onDidChangeTextDocument(function (event) {
		initText(context);
	});
	vscode.window.onDidChangeTextEditorVisibleRanges(function (event) {
		scrollPreview(event);
	});
    context.subscriptions.push(disposable);
}

async function initPreview(context: vscode.ExtensionContext) {
    panel = vscode.window.createWebviewPanel(
        'StringScript Preview',
        'StringScript Preview',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'assets'))]
        }
    );
    panel.webview.onDidReceiveMessage(e => {
        if (!current) {
            return;
        };
        e = e.scrolling;
        const range = current.visibleRanges;
        const posa = new vscode.Position(e, 0);
        const posb = new vscode.Position(e + range[0].end.line - range[0].start.line, 0);
        selfScroll = true;
        current.revealRange(new vscode.Range(posa, posb));
        sleep(150).then(() => selfScroll = false);
    });
	initText(context);
    if (current) {
        panel.webview.postMessage({
            type: 'scrolling',
            line: current.visibleRanges});
    }
    checkCurrent(context);
}

async function initText(context: vscode.ExtensionContext) {
    if (vscode.window.activeTextEditor?.document.languageId === 'rpgrw') {
        current = vscode.window.activeTextEditor;
    }
    if (!panel || !current) {
        return;
    }
    const meta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource} 'self' 'unsafe-inline'; script-src ${panel.webview.cspSource} 'self' 'unsafe-inline'; style-src ${panel.webview.cspSource} 'self' 'unsafe-inline'; font-src ${panel.webview.cspSource}">`;
	const style = `<link rel="stylesheet" type="text/css" href="${getDynamicContentPath(context, panel, 'assets/preview.css')}">`;
    const script = `<script src="${getDynamicContentPath(context, panel, 'assets/preview.js')}"></script>`;
    const text = current?.document.getText().replace(/\\(N|V)\[\d+\]/g, '@@@').replace(/(\\((C|S)\[\d+\]|\||\.|\$|!|_|>|<|\^|\\)|#[a-zA-Z]*#)/g, '');
	panel.webview.html = meta + style + '<pre style="width:50ch"><pre style="width:38ch">' + text + "</pre></pre>" + script;
}

function getDynamicContentPath(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, filepath: string) {
    const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, filepath));
    const uri = panel.webview.asWebviewUri(onDiskPath);
    return uri;
}

function scrollPreview(event: vscode.TextEditorVisibleRangesChangeEvent) {
    if (!panel || selfScroll || (vscode.window.activeTextEditor && vscode.window.activeTextEditor?.document.languageId !== 'rpgrw')) {
        return;
    }
	panel.webview.postMessage({
		type: 'scrolling',
		line: event.visibleRanges});
    sleep(100);
}

function checkCurrent(context: vscode.ExtensionContext){
    if (current !== vscode.window.activeTextEditor) {
        initText(context);
    }
    setTimeout(checkCurrent, 300, context);
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function deactivate() { }