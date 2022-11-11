# nx-request-api
NPM package for making requests to Nintendo Switch Skyline plugins using the native `window.nx` functionality.

This allows pages to be more responsive and use standard `Promise` patterns, rather than attaching event listeners for all messaging.
This package should be used in tandem with the `nx-request-handler` Rust crate, which provides a convenient callback mechanism for handling requests plugin-side.
# installation
`yarn add nx-request-api`
or
`npm install nx-request-api`

# Example usage
```rust
let messenger = new DefaultMessenger();
try {
    // using default messenger and register_defaults()
    let contents = await backend.readFile("sd:/somefile.json");
    let obj = JSON.parse(contents);
    console.info(obj.some_field);

    // generic invocation for custom handlers
    let version = await backend.customRequest("get_sdcard_root", null);
    let result = await backend.customRequest("call_with_args", ["arg1", "arg2", "arg3"]);
    let is_installed = await backend.booleanRequest("is_installed", null);

    // another example of a default message
    backend.exitSession();
} catch (e) { 
    // this will be called if any of the requests are rejected. you can also use .then() and .catch() on the individual calls.
    console.error(e); 
}
```