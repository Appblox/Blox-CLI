# node-blox-sdk

This projects includes everything needed to build node-functions.

This included following modules,
- Appblox Function SDK with node

To work with functions in local,

There is 2 option

1. Using emulator

`Make use of appblox emulator. Emulator will act as a proxy, instead of we pointing and managing multiple port emulator will takecare of that hard jobs.`

then run functions as,

```
cd ./examples/functions-example
node index.js
```
the above command will run function in port provided by emulator.


2. Assigning a port manually using flags.

```
cd ./examples/functions-example/
npm index.js --port=3000 
```

the above command will run function in port 3000

Emulator Doc - link

- Appblox Function SDK with node

To access details from shield admin SDK,

```
cd ./examples/shield-example/
npm index.js --port=3000 
```
## SDK Usage

1. Appblox Functions SDK

```
npm install node-blox-sdk
```

Run Handler / Function using run method by importing functions sdk from node-blox-sdk.

```
import { functions } from "node-blox-sdk";

functions.run(ExampleHandler)
```

go to github.com/AppBlox/node-blox-sdk/tree/main/examples/functions-example to see example.


2. SHIELD SDK

```
npm install node-blox-sdk
```

`Before using shield, app need to be initialized.`

Initialze the application using internals SDK

```
import { internals } from "node-blox-sdk";

internals.initialize({
		clientId:     process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
	})
```

Using the methods from shield sdk

```
import { shield } from "node-blox-sdk";

const SheildExampleHandler = async (req, res, next) => {
  try {
  
    // Get user details using shield
    const userDetails = await shield.getUser(req);

    // Get user uid using shield
    const userUID = await shield.getUID(req);

  } catch (error) {
    // handle the error
  }
};
```

Run SheildExampleHandler using run method from funciton sdk.

```
import { functions } from "node-blox-sdk";

functions.run(SheildExampleHandler)
```

go to github.com/AppBlox/node-blox-sdk/tree/main/examples/shield-example to see example.