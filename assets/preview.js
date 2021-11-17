const vscode = acquireVsCodeApi();
var selfscroll = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.addEventListener('scroll', () => {
    if (!selfscroll) {
        vscode.postMessage({ scrolling: Math.round(document.documentElement.scrollTop / 20) });
        sleep(100);
    }
});

window.addEventListener('message', event => {
    let message = event.data;
    if (message.type === 'scrolling') {
        selfscroll = true;
        window.scroll(0, message.line[0][0].line * 20);
        sleep(150).then(() => selfscroll = false);
    }
});