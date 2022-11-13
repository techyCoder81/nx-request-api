/// this file is for switch offline web browser bootstrap logic

export function sendMessage(object) {
    console.debug("sending to nx: \n" + object)
    if (window.nx === undefined) {
        console.warn("window.nx is not defined, this is likely a test environment.")
        return;
    }
    window.nx.sendMessage(object);
}

export function addEventListener(eventName, callback) {
    if (window.nx === undefined) {
        console.warn("window.nx is not defined, this is likely a test environment.")
        return;
    }
    return window.nx.addEventListener(eventName, callback);
}

export function removeEventListener(listener) {
    if (window.nx === undefined) {
        console.warn("window.nx is not defined, this is likely a test environment.")
        return;
    }
    return window.nx.removeEventListener(listener);
}

export function setButtonAction(button, action) {
    if (window.nx) {
        window.nx.footer.setAssign(button, "", action);
    }
}

export function setScrollSpeed(speed) {
    if (window.nx) {
        window.nx.setCursorScrollSpeed(speed);
    }
}