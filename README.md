# nx-request-api
NPM package for making requests to Nintendo Switch Skyline plugins using the native `window.nx` functionality.

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