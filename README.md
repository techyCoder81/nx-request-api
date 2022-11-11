# nx-request-api
NPM package for making requests to Nintendo Switch Skyline plugins using the native `window.nx` functionality.

This allows pages to be more responsive and use standard `Promise` patterns, rather than attaching event listeners for all messaging.
This package should be used in tandem with the `nx-request-handler` Rust crate, which provides a convenient callback mechanism for handling requests plugin-side.
# installation
`yarn add nx-request-api`
or
`npm install nx-request-api`

# Example usage
```typescript
import { Progress, DefaultMessenger } from "nx-request-api"

let messenger = new DefaultMessenger();
try {
    // examples using default messenger and register_defaults()
    // download a file to a location on sd, while providing a progress callback for display
    let download_result = await messenger.downloadFile(
        "https://url.com/hugefile.json", 
        "sd:/hugefile.json", 
        (p: Progress) => console.info("Operation: " + p.title + ", Progress: " + p.progress)
    );

    // read the contents of the file (in this case a json file), and parse the data into an object.
    let contents = await messenger.readFile("sd:/hugefile.json");
    let obj = JSON.parse(contents);
    console.info(obj.some_field);


    // generic invocation examples for custom handlers
    // simple string-based request, no arguments
    let version = await messenger.customRequest("get_sdcard_root", null);

    // string-based request, with no arguments
    let result = await messenger.customRequest("call_with_args", ["arg1", "arg2", "arg3"]);

    // request which returns a bool instead of a string
    let is_installed = await messenger.booleanRequest("is_installed", null);

    // another example of a default message call
    messenger.exitSession();
} catch (e) { 
    // this will be called if any of the requests are rejected. you can also use .then() and .catch() on the individual calls.
    console.error(e); 
}
```