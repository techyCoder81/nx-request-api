import * as skyline from "./skyline";
import * as Messages from "./messages";
import { BooleanResponse, OkOrError, StringResponse, PathList, DirTree } from "./responses";
import { Progress } from "./progress";

/**
 * This represents the backend interface, which
 * could be anything. The provided supplier is a 
 * `SwitchBackend`, which is a wrapper around `window.nx` 
 * calls available in skyline-web applications.
 */
export interface BackendSupplier {
    /** sends an async message to the backend instance, with no response */
    send(message: Messages.Message): any;

    /** invokes on the backend instance and returns a promise of a result */
    invoke(message: Messages.Message, progressCallback?: (p: Progress) => void): Promise<string>;
}

/**
 * This represents a basic messenger. Use this to structure your custom calls, or
 * extend DefaultMessenger to get some common calls baked-in to your backend.
 */
export class BasicMessenger {
    /** the supplier of the backend - this could be custom implemented */
    private supplier: BackendSupplier;

    /**
     * the constructor, which takes a backend supplier and implements 
     * @param supplier the backend supplier (wrapper for all backend calls)
     */
    constructor(supplier: BackendSupplier) {
        this.supplier = supplier;
    }
    
    /**
     * sends a request to the backend which expects a string response
     * @param name the name of the call, such as `read_file`
     * @param args the `string[]` of arguments, or none
     * @returns a `Promise` represending the outcome of the operation
     */
    public async stringRequest(name: string, args: string[] | null): Promise<string> {
        console.debug("beginning " + name);
        return await this.supplier.invoke(new Messages.Message(name, args)).then((json: string) => {
            console.debug("response for " + name + ": " + json);
            return StringResponse.from(json).getMessage();
        }).catch((e: string) => {
            console.error("Error while performing " + name + ": " + e);
            throw e;
        });
    }

    /**
     * performs a request of the given name and awaits a BooleanResponse
     * @param name the name of the request
     * @returns a boolean
     */
    public async booleanRequest(name: string, args: string[] | null): Promise<boolean> {
        console.debug("beginning " + name);
        return await this.supplier.invoke(new Messages.Message(name, args)).then((json: string) => {
            console.debug("response for " + name + ": " + json);
            let response = BooleanResponse.from(json);
            return response.isOk();
        }).catch((e: string) => {
            console.error("Error while performing " + name +": " + e);
            throw e;
        });
    }

    /**
     * performs a request of the given name and awaits a OkOrError response()
     * @param name the name of the request
     * @returns a promise which resolves if the result is Ok, and rejects if the result is a failure
     */
    public async okOrErrorRequest(name: string, args: string[] | null, progressCallback?: (p: Progress) => void): Promise<string> {
        console.debug("beginning " + name);
        return await this.supplier.invoke(new Messages.Message(name, args), progressCallback).then((json: string) => {
            console.debug("response for " + name + ": " + json);
            let response = OkOrError.from(json);
            if (response.isOk()) {
                return response.getMessage();
            } else {
                throw new Error("Operation failed on the backend, reason: " + response.message);
            }
        }).catch((e) => {
            throw e
        });
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
        return this.stringRequest("ping", null).then((response) => {
            console.debug("Ping got response: " + response);
            return true;
        }).catch(e => {
            console.debug("Ping failed: " + e);
            throw e;
        });
    }

    /** downloads the requested file to the requested 
     * location relative to sdcard root */
     async downloadFile(url: string, location: string, progressCallback?: (p: Progress) => void): Promise<string> {
        return this.okOrErrorRequest("download_file", [url, location], progressCallback);
    }

    /** returns the text contents of a file */
    async readFile(filepath: string): Promise<string> {
        return this.okOrErrorRequest("read_file", [filepath]);
    }

    /** deletes the given file if it exists */
    async deleteFile(filepath: string): Promise<string> {
        return this.okOrErrorRequest("delete_file", [filepath]);
    }

    /** deletes the given file if it exists */
    async writeFile(filepath: string, data: string): Promise<string> {
        return this.okOrErrorRequest("write_file", [filepath, data]);
    }

    /** returns the md5 checksum of a file */
    async getMd5(filepath: string): Promise<string> {
        return this.okOrErrorRequest("get_md5", [filepath]);
    }

    /** unzips the file at the given path to the given destination */
    async unzip(filepath: string, destination: string): Promise<string> {
        return this.okOrErrorRequest("unzip", [filepath, destination]);
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
    async listDirAll(filepath: string): Promise<DirTree> {
        return new Promise<DirTree>((resolve, reject) => {
            this.okOrErrorRequest("list_all_files", [filepath])
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
            this.okOrErrorRequest("list_dir", [filepath])
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
    async getRequest(url: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.okOrErrorRequest("get_request", [url])
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
    async getJson(url: string): Promise<any> {
        return new Promise<PathList>((resolve, reject) => {
            this.getRequest(url).then(result => {
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

    constructor() {
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
                    return;
                }

                var callback = this.callbacks.get(id);
                if (callback != undefined) {
                    try {
                        callback(response);
                    } catch (e) {
                        console.error("Callback failed for id " + id + " with error " + e);
                    }
                } else {
                    console.error("Received response for unknown ID: " + JSON.stringify(response));
                }
            } catch (e) {
                console.error("general error while calling back in skyline: " + e + "\nData: " + data);
            }
        });
    }
    
    invoke(message: Messages.Message, progressCallback?: (p: Progress) => void): Promise<string> {
        console.debug("trying to invoke on nx: " + JSON.stringify(message));
        return new Promise((resolve, reject) => {
            try {
                console.debug("setting callback for skyline invocation");

                // if a progress callback was defined, set the callback
                if (typeof progressCallback !== 'undefined') {
                    this.callbacks.set("progress", (response) => {
                        try {
                            
                            progressCallback(Progress.from(response.message));
                        } catch (e) {
                            console.error("Could not parse response as Progress: " + response);
                        }
                    })
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

    send(message: Messages.Message) {
        console.debug("trying to send to nx: " + JSON.stringify(message));
        skyline.sendMessage(JSON.stringify(message));
    }
}