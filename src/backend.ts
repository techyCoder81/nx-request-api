import { skyline } from ".";
import * as Messages from "./messages";
import { Progress } from "./progress";
import { OkOrError, PathList, DirTree } from "./responses";

/**
 * This represents the backend interface, which
 * could be anything. The provided supplier is a 
 * `SwitchBackend`, which is a wrapper around `window.nx` 
 * calls available in skyline-web applications.
 */
 export interface BackendSupplier {
    /** invokes on the backend instance and returns a promise of a result */
    invoke(call_name: string, args: string[] | null, progressCallback?: (p: Progress) => void): Promise<string>;
}

/**
 * This represents a basic messenger. Use this to structure your custom calls, or
 * extend DefaultMessenger to get some common calls baked-in to your backend.
 */
export class BasicMessenger {
    /** the supplier of the backend - this could be custom implemented */
    private supplier: BackendSupplier;

    /**
     * the constructor, which optionally takes a backend supplier. If no
     * supplier implementation is given, the `SwitchBackend` is used by default.
     * @param supplier the backend supplier (wrapper for all backend calls),
     *      defaults to the `SwitchBackend`.
     */
    public constructor(supplier?: BackendSupplier) {
        if (supplier) {
            this.supplier = supplier;
        } else {
            this.supplier = SwitchBackend.instance();
        }
    }

    /**
     * performs a request of the given name and awaits a response
     * @param name the name of the request
     * @returns a boolean
     */
    public async booleanRequest(name: string, args: string[] | null): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.customRequest(name, args)
                .then(result => (result === 'true') ? resolve(true) : resolve(false))
                .catch(e => {console.error(e);reject(e);});
        });
    }

    /**
     * performs a request of the given name and awaits a OkOrError response()
     * @param name the name of the request
     * @returns a promise which resolves if the result is Ok, and rejects if the result is a failure
     */
    public async customRequest(name: string, args: string[] | null, progressCallback?: (p: Progress) => void): Promise<string> {
        console.debug("beginning " + name);
        return new Promise<string>((resolve, reject) => {
            this.supplier.invoke(name, args, progressCallback).then((json: string) => {
                console.debug("response for " + name + ": " + json);
                let response = OkOrError.from(json);
                if (response.isOk()) {
                    resolve(response.getMessage());
                } else {
                    reject("Operation failed on the backend, reason: " + response.message);
                }
            }).catch(e => {
                console.error("rejection of customRequest: " + e);
                reject(e);
            });
        });
    }

    /**
     *  invokes on the backend instance and returns a promise of a result. This is available
     *  for the purpose of defining custom requests.
     */
    invoke(call_name: string, args: string[] | null, progressCallback?: (p: Progress) => void): Promise<string> {
        return this.supplier.invoke(call_name, args, progressCallback);
    }
}

/**
 * This is the default messenger class. This class includes basic
 * backend calls like `download_version`, `read_file`, etc.
 */
export class DefaultMessenger extends BasicMessenger {
    /**
     * pings the backend with a message.
     * @returns whether the backend responded.
     */
    async ping(): Promise<boolean> {
        return this.customRequest("ping", null).then((response) => {
            console.debug("Ping got response: " + response);
            return true;
        }).catch(e => {
            console.debug("Ping failed: " + e);
            throw e;
        });
    }

    /**
     * sends a string to be logged by the backend logger with println!()
     * @returns acknowledgement
     */
     async println(str: string): Promise<String> {
        return this.invoke("log", [str]);
    }

    /**
     * sends a message to the backend to exit the session.
     */
    exitSession(): Promise<string> {
        return this.invoke("exit_session", null);
    }

    /**
     * sends a message to the backend to exit the game entirely.
     */
     exitApplication(): Promise<string> {
        return this.invoke("exit_application", null);
    }

    /** downloads the requested file to the requested 
     * location relative to sdcard root */
     async downloadFile(url: string, location: string, progressCallback?: (p: Progress) => void): Promise<string> {
        return this.customRequest("download_file", [url, location], progressCallback);
    }

    /** returns the text contents of a file */
    async readFile(filepath: string): Promise<string> {
        return this.customRequest("read_file", [filepath]);
    }

    /** deletes the given file if it exists */
    async deleteFile(filepath: string): Promise<string> {
        return this.customRequest("delete_file", [filepath]);
    }

    /** (over)writes to the given file */
    async writeFile(filepath: string, data: string): Promise<string> {
        return this.customRequest("write_file", [filepath, data]);
    }

    /** returns the md5 checksum of a file */
    async getMd5(filepath: string): Promise<string> {
        return this.customRequest("get_md5", [filepath]);
    }

    /** makes the given directory(ies) recursively */
    async mkdir(path: string): Promise<string> {
        return this.customRequest("mkdir", [path]);
    }

    /** unzips the file at the given path to the given destination */
    async unzip(filepath: string, destination: string, progressCallback?: (p: Progress) => void): Promise<string> {
        return this.customRequest("unzip", [filepath, destination], progressCallback);
    }

    /** returns whether a file exists with the given absolute path */
    async fileExists(filepath: string): Promise<boolean> {
        return this.booleanRequest("file_exists", [filepath]);
    }

    /** returns whether a directory exists with the given absolute path */
    async dirExists(filepath: string): Promise<boolean> {
        return this.booleanRequest("dir_exists", [filepath]);
    }

    /** returns a list of all files and directories recursively under the given path */
    async listDirAll(filepath: string, progressCallback?: (p: Progress) => void): Promise<DirTree> {
        return new Promise<DirTree>((resolve, reject) => {
            this.customRequest("list_all_files", [filepath], progressCallback)
                .then(result => {
                    let retval = DirTree.fromStr(result);
                    console.debug("parsed directory list as PathList!");
                    resolve(retval);
                })
                .catch(e => {
                    console.error("Error while parsing result as PathList! " + e);
                    reject(e);
                });
        });
    }

    /** returns a list of all files and directories in the given path */
    async listDir(filepath: string): Promise<PathList> {
        return new Promise<PathList>((resolve, reject) => {
            this.customRequest("list_dir", [filepath])
                .then(result => {
                    console.debug("parsing as PathList: " + result);
                    let retval = PathList.from(result);
                    console.debug("parsed directory list as PathList!");
                    resolve(retval);
                })
                .catch(e => {
                    console.error("Error while parsing result as PathList! " + e);
                    reject(e);
                });
        });
    }

    /**
     * performs a get request and returns the body as a string
     * @param url the url
     * @returns the body of the returned data
     */
    async getRequest(url: string, progressCallback?: (p: Progress) => void): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.customRequest("get_request", [url], progressCallback)
                .then(result => {
                    console.debug("get request result: " + result);
                    resolve(result);
                })
                .catch(e => {
                    console.error("Error while performing GET request: " + e);
                    reject(e);
                });
        });
    }

    /**
     * performs a GET request and returns the json body as a parsed object
     * @param url the url
     * @returns the parsed object the json represented
     */
    async getJson(url: string, progressCallback?: (p: Progress) => void): Promise<any> {
        return new Promise<PathList>((resolve, reject) => {
            this.getRequest(url, progressCallback).then(result => {
                resolve(JSON.parse(result));
            })
            .catch(e => {
                reject(e);
            });
        });
    }
}

export class SwitchBackend implements BackendSupplier {

    /// the map of callbacks that have been registered
    /// Map<ID, function(received object){}>
    callbacks: Map<string, {(object: any): void}> = new Map();

    /** singleton to help manage callback behavior */
    private static singleton: SwitchBackend;

    public static instance(): SwitchBackend {
        if (!this.singleton) {
            this.singleton = new SwitchBackend();
        }
        return this.singleton;
    }

    private constructor() {
        //super();
        // add listener for all messages from window.nx
        skyline.addEventListener("message", (event: any) => {
            // call any registered callbacks for this ID
            //console.debug("Received event from nx: ");
            //console.debug("Event data: " + event.data);
            let data = event.data;
            try {

                try {
                    var response = JSON.parse(data);
                    var id: string = response.id;
                } catch (e) {
                    console.error("parse/callback failure of received data!\nError: " + e + "\nData: " + data);
                    alert("An error has occurred while receiving data from the backend.\n" + e);
                    return;
                }

                var callback = this.callbacks.get(id);
                if (callback !== undefined) {
                    try {
                        callback(response);
                    } catch (e) {
                        console.error("Callback failed for id " + id + " with error " + e);
                    }
                } else if (id === 'progress') {
                    console.debug("got progress, but no callback assigned. Dropping.");
                } else {
                    console.error("Received response for unknown ID: " + JSON.stringify(response));
                }
            } catch (e) {
                console.error("general error while calling back in skyline: " + e + "\nData: " + data);
            }
        });
    }
    
    invoke(call_name: string, args: string[] | null, progressCallback?: (p: Progress) => void): Promise<string> {
        let message = new Messages.Message(call_name, args);
        console.debug("trying to invoke on nx: " + JSON.stringify(message));
        return new Promise((resolve, reject) => {
            try {
                console.debug("beginning callback for skyline invocation, callback?: " + progressCallback);

                // if a progress callback was defined, set the callback
                if (progressCallback !== undefined) {
                    // use the real progress callback given
                    this.callbacks.set("progress", (response) => {
                        try {
                            progressCallback(Progress.from(response.message));
                        } catch (e) {
                            console.error("Could not parse response as Progress: " + response);
                        }
                    });
                } else {
                    // use an empty progress callback, since no callback was provided
                    this.callbacks.set("progress", (res) => {});
                }
                var first_response: any = null;
                // set a callback for when that ID is returned
                this.callbacks.set(message.id, (response) => {
                    console.debug("response called back for id " + message.id + " with response");
                    if (first_response == null) {
                        console.debug("got first response");
                        first_response = response;
                    } else {
                        console.debug("appending...");
                        first_response.message += response.message;
                    }
                    if (response.more === undefined || response.more == false) {
                        this.callbacks.delete(message.id);
                        this.callbacks.delete("progress");
                        resolve(JSON.stringify(first_response));
                    }
                });
                console.debug("sending message to skyline: " + JSON.stringify(message));
                skyline.sendMessage(JSON.stringify(message));
                console.debug("waiting for response from skyline");
            } catch (e) {
                console.error("Error while invoking on skyline: " + e + ", object data: " + JSON.stringify(e))
                this.callbacks.delete("progress");
                reject("Error: " + JSON.stringify(e));
            }
        });
    }
}