export {};
import { DefaultMessenger, SwitchBackend } from "../index";
import * as Messages from "../messages";
import { OkOrError, StringResponse } from "../responses";


declare global {
    interface Window {
        nx: NxTest;
    }
}

type Event = {data: any};
var listeners: Map<string, (event: Event) => void> = new Map<string, (event: Event) => void>;

class NxTest {
    sendMessage: (object: string) => void = (object: string): void => {
        let message = JSON.parse(object) as Messages.Message;
        let callback = listeners.get("message");
        if (callback === null || callback === undefined) {
            throw new Error("callback was not defined for 'message'");
        }
        var response = new StringResponse("unsupported test.", message.id);
        switch (message.call_name) {
            case "ping":
                response = new StringResponse("pong", message.id);
                break;
            case "read_file":
                if (message.arguments === null || message.arguments === undefined || message.arguments.length < 1 || message.arguments.length > 1) {
                    response = new OkOrError(false, "bad args", message.id);
                    break;
                }
                if (message.arguments[0] === "sd:/realfile") {
                    response = new OkOrError(true, "contents", message.id);
                } else {
                    response = new OkOrError(false, "nope", message.id);
                }
                break;
            default:
                response = new StringResponse("unsupported test.", message.id);
                break;
        }   
        callback({data: JSON.stringify(response)});
    }
    addEventListener: (name: string, callback: (event: Event) => void) => void = (name: string, callback: (event: Event) => void): void => {
        listeners.set(name, callback);
    }
}


window.nx = new NxTest();


console.info(JSON.stringify(window.nx));
let backend = new DefaultMessenger(new SwitchBackend());

test('ping', async () => {
    expect(await backend.ping()).toBe(true);
});

test('realfile', async () => {
expect(await backend.readFile("sd:/realfile")).toBe("contents");
});

test('fakefile', async () => {
    expect(backend.readFile("sd:/fakefile")).rejects.toBeTruthy();
});