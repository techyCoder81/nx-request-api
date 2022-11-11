# nx-request-api
NPM package for making requests to Nintendo Switch Skyline plugins using the native `window.nx` functionality.

This allows pages to be more responsive and use standard `Promise` patterns, rather than attaching event listeners for all messaging.
This package should be used in tandem with the `nx-request-handler` Rust crate, which provides a convenient callback mechanism for handling requests plugin-side.
# installation
`yarn add nx-request-api`
or
`npm install nx-request-api`

# default usage
```
let backend = new DefaultMessenger();

backend.readFile("sd:/somefile.txt")
    .then(contents => console.info("File contents: " + contents))
    .catch(e => console.error(e));
```