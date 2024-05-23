
# API Accelerate
_**A Node.js framework for building web APIs**_

API Accelerate is a Node.js framework that simplifies the development of APIs. It creates a wrapper around Express.js and extends it with services such as logging, database access and error handling. 

## Quick Start
### Create and Run an App

1․ Create a new Node.js project.

```
mkdir test
cd test
npm init
```

2․ Install API Accelerate as a dependency:

```
npm install api-accelerate --save
```

3․ Add this start script line to **package.js**:

```
  "scripts": {
    ...
    "start": "./node_modules/api-accelerate/bin/run.js"
  },
```

4․ Create these files in the project:

**./config.js**

```
module.exports = {
  server:{
    port: 10000
  }
}
```

**./routes/test.js**

```
module.exports = (router) => {

var test = require('../controllers/test')

router.route('/')
  .get(test.get);
}
```

**./controllers/test.js**

```
exports.get = async (req, res) => {
  req.context.responder.text(req, res, "Hello, world\n");
}
```

5․ Run the server in a terminal window:

```
npm start
```

6․ In another window, issue a request using a client such as Curl:

```
curl http://127.0.0.1:10000
```

You should see the response `Hello, world`. 

7․ Terminate the app by pressing **Ctl-C** in the app window. 

### Explanation of the Code
The start script instantiates, configures and runs an app. 

The framework looks for the configuration file in the project root. In this example, the configuration is minimal, specifying only the port number on which the server listens. 

The framework then looks in folder **routes** for route files. It loads each file it finds and calls the entry point to initialize it. Note that the framework passes a router object to which routes are added. 

This particular route file sets up a route to **GET** on path **/**. The route is bound to controller method **test**. When the controller receives the request, it extracts a responder object and uses it to respond back to the client with a text message. 

This app can now be extended by adding more routes and controllers. The configuration can be extended to use additional capabilities, such as database access. 

## Demo Apps
A set of demo apps can be found at
[API Accelerate Demos](https://github.com/keithhilen/api-accelerate-demos).

These demonstrate various features of the framework. 

## Application Structure

### Model-View-Controller
API Accelerate apps follow a [model–view–controller](https://en.wikipedia.org/wiki/Model–view–controller) pattern.

Views are API endpoints, associated with a route. Models manage business logic, including storage. Controllers tie views and models together, providing coordination and translation. 

The interactions between models, views and controllers are consistent with the MVC pattern. Route files (views) invoke controllers, and controllers interact with models and pass information back to views. 

### File Structure
By convention, a project includes these folders:

```
├── controllers     # Controller files
├── models          # Model files
└── routes          # Routes files
```

### Startup and Config

The **run** script starts the app. This script also provides control to stop the app gracefully by listening for **Ctl-C** and terminating gracefully. 

Once the **start** script is configured in **package.json**, the app can be started with this command:

```
npm start
```

This command prompts the framework to create, configure and run an app. It starts by looking for the config file in the project root. By default it then scans folder **routes** for route files. It loads each route file it finds and calls the entry point to initialize it. The framework passes an **Express** router object to the entry point. Routes are added to this object. 

### Requests

When a request arrives, the route passes it to a controller for processing. The controller receives the request, extracts a responder object and uses it to respond back to the client. 

The request object contains a property called **app**. This provides access to framework services, such as logging and database querying. 

### Configuration
#### Overview
The application requires a configuration file. A simple application can operate with minimal changes to the default configuration, 

By default, the framework will look for file **config.js** file in the root directory. 

#### Configuration File Example
This is an example of a minimal configuration file:

```
module.exports = {
  server:{
    port:               10000
  }
}
```

The only configuration setting is the port number on which the server listens. Even this setting is optional - the port number defaults to **80**. 

#### Configuration Sections

The config file is organized in sections. 

| Section  | Description |
| --- | --- |
| `server` | Defines the general operation of the server. |
| `router` | Changes the default router options, and adds additional routers if needed. |
| `logger` | Sets logging options to control which log entry types are emitted. |
| `database` | Defines database access parameters, such as server address and credentials. |
| `app` | Provides settings the app logic can use to configure its operations. |

#### Server Configuration Section

| Parameter      | Description |
| --- | --- |
| port          | The port the server listens on. Default is 80. |
| timeout       | The interval in milliseconds after which a request will time out. Default is 30 seconds. |
| prettify_json | Specifies whether JSON strings sent back to the client are formatted for human readability. Default is __false__. |

### Routing
API Accelerate scans the routes folder recursively to find and invoke all route files. It passes an [Express Router object](https://expressjs.com/en/4x/api.html#router) to the entry point. 

The application can provide as many or as few route files as needed. The general guidance is that each route file define a set of related routes for a particular process or resource type. 

A route file should not include any logic other than what is needed to route requests to a controller. 

Example route file:

```
// persons.js

module.exports = (router) => {

var persons = require('../controllers/persons')

router.route('/persons')
  .get(persons.list)
  .post(persons.create);

router.route('/persons/:person_id')
  .get(persons.get)
  .put(persons.update);
}
```

#### Router Configuration

It is possible to omit the router configuration section, in which case the default behavior will be implemented. This is sufficient for many applications. Those that need more control can use the following parameters:

| Parameter      | Description |
| --- | --- |
| name         | An optional identifying name. This can be useful in logs. |
| path         | The base path for all routes. Default is "/". |
| folder       | The folder where route files are located. Default is "/routes". |
| params       | Additional parameters specific to the router which are used by application logic. |

It is possible to define more than one router by providing an array of router config objects. (By convention, the parameter name is called "routers" when there is more than one. However, the framework treats keywords "router" and "routers" identically. 

### Controllers
A controller receives requests and invokes the appropriate logic. A standard Express controller method receives Express request and response objects as parameters. 

The framework exposes a context object to the app. It injects this object into the Express request object so it is available to app logic. The context object provides services such as responder, database manager, and logging. 

The context can be obtained in this way:

```
  var context = req.context;
```

Here is an example of a simple controller. 

```
const test = require('../models/test');

exports.get = async (req, res) => {
  try {
    var context = req.context;
    var data = await test.get(context);
    context.responder.json(req, res, data);
  } catch(e) {
    context.responder.error(req,res,e);
  }
}
```

Note that the logic extracts the context from the request and passes it to the model for its use. The controller sends a response back to the client via the responder object. This object provides a variety of response methods. In this example, it returns data explicitly in JSON format. The responder takes care of the details of formatting the data and returning the proper mime type and response code. 

Note that the controller catches and handles errors. In many cases, the responder can automatically map an error to an appropriate HTTP response code. For example, if the model throws __Record Not Found__, the controller simply passes this to the responder, which generates a 404 response. This reduces the complexity of the controller code and ensures a consistent treatment of errors. 

#### Responder Methods

| Method                         | Description | HTTP Code | Content Type |
| --- | --- | --- | --- |
| `ok (req, res)`                  | Returns a standard 200 response with no data. | 200 |  |
| `text (req, res, s)`             | Returns a string value. | 200 | Express default |
| `html (req, res, s)`             | Returns a block of HTML code. | 200 | text/html |
| `respond (req, res, data)`       | Responds with data in a suitable format. It inspects the **Accept** headers provided by the client and formats the data and sets the **Content-Type** accordingly. | 200 | Default is application/json, unless **Accept** header dictates otherwise. |
| `json (req, res, data)`          | Responds with data in JSON format. | 200 | text/json |
| `csv (req, res, data)`           | Responds with data in CSV format. | 200 |  text/csv |
| `tabular (req, res, data)`       | Responds with data in a tabular text form.  | 200 | text/plain |
| `plain_text (req, res, s)`       | Responds with plain text. | 200 | text/plain |
| `notImplemented (req, res, msg)` | Returns HTTP code Not Implemented. | 501 | N/A |
| `notAllowed (req, res, msg)`     | Returns HTTP code Bad Request. | 400 | N/A |
| `badRequest (req, res, msg)`     | Returns HTTP code Bad Request. | 400 | N/A |
| `notFound (req, res, msg)`       | Returns HTTP code Not Found. | 404 | N/A |
| `unauthorized (req, res, msg)`   | Returns HTTP code Unauthorized. | 401 | N/A |
| `failure (req, res, err)`        | Returns HTTP code Server Error. | 500 | N/A |
| `error (req, res, err)`          | Analyzes the exception object passed to it and selects an appropriate response code. | See descriptions in __Errors__ section | N/A |

### CSV and Tabular Responses

The __csv__ and __tabular__ responder methods will convert a record set to the corresponding output formats. A tabular output is simply text with cells evenly padded. 

Both of these methods convert an array of record objects to a grid format with headers. When the record array is passed in, the responder will parse the keys of the records to determine the column names. Example:

```
exports.get = async (req, res) => {
  try {
    var context = req.context;

    var records = [
      { first: 'George', last: 'Washington' },
      { first: 'John', last: 'Adams' },
      { first: 'Thomas', last: 'Jefferson' }
    ]; 

    return context.responder.tabular(req, res, records);

  } catch(e) {context.responder.error(req, res, e)}
}
```

Output:

```
+--------+------------+
| first  | last       |
+--------+------------+
| George | Washington |
| John   | Adams      |
| Thomas | Jefferson  |
+--------+------------+
```

There is an option to pass an explicit list of column names. Example: 

```
exports.get = async (req, res) => {
  try {
    var context = req.context;

    var records = [
      { first: 'George', last: 'Washington' },
      { first: 'John', last: 'Adams' },
      { first: 'Thomas', last: 'Jefferson' }
    ]; 

    var columns = [
      { key: 'first', name: 'First Name' },
      { key: 'last', name: 'Last Name' }
    ];

    return context.responder.tabular(req, res, records, columns);

  } catch(e) {context.responder.error(req, res, e)}

}
```

Output:

```
+------------+------------+
| First Name | Last Name  |
+------------+------------+
| George     | Washington |
| John       | Adams      |
| Thomas     | Jefferson  |
+------------+------------+
```


### Errors
The framework provides a set of error classes for throwing exceptions. These are exported in the `accelerate` module. Example:

```
const SystemError = require('api-accelerate').errors.SystemError;
throw new SystemError("<ERROR DESCRIPTION", <DATA OBJECT>);
```

All error classes are based on the Node.js error class ([https://nodejs.org/api/errors.html#class-error](https://nodejs.org/api/errors.html#class-error))

If an error is passed to the response object, it will be mapped to an HTTP error code which is sent back to the client. 

#### Error classes

| Class | Parameters | Description | HTTP Code |
| --- | --- | --- | --- |
| Error | `message` | A general error that produces a message | 500 |
| SystemError | `message`, `info` | Thrown when there is some problem at the system level. | 500 |
| NotFoundError | `message`, `id`, `info` | The identified resource is not found. | 404 |
| DuplicateError | `message`, `id`, `info` | The identity of a resource already exists. | 400 |
| NotAllowedError | `message`, `info` | The requested operation is not allowed. | 401 |
| NotImplementedError | `message` | The request type is not implemented yet. | 501 |
| FileError | `message`, `info` | An error occurred during file I/O. | 400 |
| HttpError | `message`, `url`, `info` | An error occurred accessing the given URL. This can occur when the server makes an HTTP request to another service. | 400 |
| DatabaseError | `query`, `values`, `info` | An error occurred when performing a database query, where the error is something other than "not found" or "duplicate". | 400 |
| ImageError | `message`, `info` | An error occurred when processing an image or image file. | 400 |

#### Error Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `message` | String | The primary message associated with the error. |
| `info` | Object | An object with additional information about the error. |
| `id` | Scalar | The ID or key associated with the error. |
| `url` | String | The URL associated with the error. |
| `query` | String | The SQL query associated with the error. |
| `values` | Array | The query values associated with the error. |

### Models
Per the MVC pattern, models are designed to manage business logic. 

Generally, model methods should accept the server object so that it has access to services such as logging and database access. 

Models that perform I/O need to be implemented with asynchronous callbacks or promises so they do not block request threads. 

Here is an example of a model that performs loan amortization with an asynchronous method:

```
// models/amortization.js

exports.amortize = async (context, params) => {

  return new Promise((resolve, reject) => {
    var loan = {
      rate: params.rate,
      principal: params.principal,
      term: params.term,
      monthly: null,
      schedule: []
    }

    const round = (n) => {return Math.round(n * 100 / 100);};

    loan.monthly = round((((loan.rate / 12) * loan.principal)) / (1-(Math.pow(1 + (loan.rate / 12),(-loan.term)))));
    var balance = loan.principal;
    var month = 1;

    while (balance > 0) {

      var payment = Math.min(loan.monthly, balance);
      var interest = round((balance*loan.rate / 12));
      if (interest <= 1) {interest = 0;}
      var principal = payment - interest;

      var record = {
        month: month,
        balance: balance,
        payment: payment,
        interest: interest,
        principal: principal
      }
      loan.schedule.push(record);
      balance -= principal;
      month++;
    }
    resolve(loan);
  });

}
```
### Database
#### Overview
The framework natively supports MySQL database access. Postgres and other databases will be added in future. ORM support is under evaluation. 

#### Configuration
It is necessary to configure the system for database access. The configuration specifies information such as the server address and credentials. 

When the application starts, the framework uses the configuration settings to create a database access object which is then available in the app context. 

Example of database configuration:

```
  database: {
    adapter:            "mysql",
    host:               process.env.DB_HOST        || 'localhost',
    port:               process.env.DB_PORT        || null,
    user:               process.env.DB_USER        || 'main',
    password:           process.env.DB_PASSWORD    || 'password',
    database:           process.env.DB_DATABASE    || 'persons',
    connections:        process.env.DB_CONNECTIONS || 10,
    logging: {
      connections:      true,
      queries:          true
    }
  }
```

This configuration specifies the host, port, user ID, password and the number of connections. In addition, it specifies additional logging settings, which can be useful during development and testing. 

Note this example also demonstrates the use of environment variables for configuration. 

##### Database Configuration

| Parameter | Setting | Default |
| --- | --- | --- |
| `name` | An optional name given to this database configuration. | Optional setting - no default. |
| `adapter` | The type of adapter, such as `mysql`. | Required setting - no default. |
| `host` | The name of the host where the database server runs. | Required setting - no default. |
| `port` | The port number for the database socket. | `3306` for MySQL. |
| `user` | The user name for accessing the database server. | Required setting - no default. |
| `password` | The user password for accessing the database server. | Required setting - no default. |
| `database` | The name of the database on the server. | Required setting - no default. |
| `connections` | The number of connections in the connection pool. This can be useful for performance tuning. | 100 |
| `logging` | Settings for controlling logging output from the database logic, as a nested object. | N/A |

##### Database Logging Configuration
These settings can be useful for debugging.

| Parameter | Setting | Default |
| --- | --- | --- |
| `connections` | Log when connections are allocated or released. | `false` |
| `queries` | Log all queries performed. | `false` |

#### Database Calls

The database is accessible from within the application to make calls. App property `db` is an object that can be used to establish a database connection. 

##### Example


```
const get = async (context, person_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      await context.db.perform(async (connection) => {
        var q = 
          "SELECT \
             person_id, first_name, last_name, email_address \
           FROM persons \
           WHERE person_id = ?";
        var v = [person_id]
        var data = await connection.readOne(q, v)
        resolve(data);
      });
    } catch(e) {
      reject(e);
    }
  });
}
```
Note that the caller of this method passes in the context along any parameters needed to perform the query. `context.db` is the adapter object that exposes methods used for making queries. 

This logic must be wrapped in a promise because it performs asynchronous I/O. 

##### Connection Management

Connections must be obtained, used, then released. In this example, the `perform` method takes care of allocating a database connection, executing the app logic, then releasing the database connection. This is a safe way to prevent unreleased connections. 

It is also possible to manually allocate and release the connection. This is not generally recommended, but can be useful in some cases. 

```
    try {
        var connection = context.db.connect();
        // perform a query
        resolve(data);
      });
    } catch(e) {
      reject(e);
    } finally {
      connection.release();
    }
```
In this case, the best practice is to release the connection in the `finally` block to ensure connections are not left open. 

#### Database Access Methods

Database methods are exposed by the connection object. All these methods receive a SQL query, which may have placeholders, and an array of values to replace the placeholders. If no placeholders are used, the values may be omitted. 

| Call | Description |
| --- | --- |
| `readOne(q, v)` | This method expects to read exactly one record. If no records are available, it throws a `NotFoundError`. If more than one record is available, it throws a generic `DatabaseError`. |
| `readList(q, v)` | This method reads zero or more records. |
| `insert(q, v)` | This method inserts a new record. |
| `update(q, v)` | This method updates one or more records. |
| `upsert(q, v, v2)` | This performs a MySQL style `INSERT ... ON ... UPDATE` query. |
| `delete(q, v)` | This method deletes one or more records. |
| `query(q, v)` | This method makes any type of query. |

#### References
[https://www.npmjs.com/package/mysql](https://www.npmjs.com/package/mysql)


### Logging
#### Overview
TBD
#### Logger Configuration

| Parameter    | Description |
| --- | --- |
| system       | Log system information. Default is __false__. |
| request      | Log API requests. Default is __false__. |
| trace        | Log trace calls. Default is __false__. |
| query        | Log database queries. Default is __false__. |
| exception    | Log exceptions. Default is __true__. |



### Helpers
TBD

### Authentication

#### Overview
The framework provides basic configurable authentication using a Java Web Token (JWT). 

Authentication provides two processes: login and authorization. Login uses credentials to validate the account and establish a session. This process generates a token which is sent back to the client. The client then passes this token back to the server on subsequent calls to perform authorization. 

#### Configuration

The configuration must contain an **auth** section. 

| Parameter | Setting | Default |
| --- | --- | --- |
| `method ` | The type of authentication method to use. Currently only *jwt* is supported. | Required setting - no default. |
| `jwt_secret ` | Used for signing the token. | Required setting - no default. |
| `jwt_expiration ` | The maximum lifetime of the token, in seconds. | Defaults to 0, meaning never expires. |
| `password_hash_type ` | The type of hash used on passwords. | MD5 is the default. |
| `password_salt ` | A string that as appended to the password before hashing to create a unique hashing. |  Required setting - no default. |

#### Login

During login, these actions are completed in sequence: 

* __Receive__ - The controller receives the login information, usually as a POST. 
* __Extract__ - The credential information is extracted from the request. 
* __Validate__ - The app uses the credentials to validate access to a particular account. 
* __Establish__ - The app establishes a session object which contains info such as the account ID. 
* __Tokenize__ - The session object is used to generate a token. 
* __Respond__ - The token is passed back to the client. 

The authenticator provides a default method to complete each action. The app needs to override some or all of these actions by providing its own methods. The **receive** method generally should not be overridden. The default **extract** action extracts parameters *user_name* and *password* from the request body. The app only needs to override this method if different parameters are used. The app must provide the **validate** method since the framework provides no standard account management capabilities. The **establish** method creates a session object with *account_id* and *user_name* as properties. The app only needs to override this method if different properties are needed. The **tokenize** method adds timestamp info to the session and then signs the object to create the token. There is rarely a reason to override this method. The **respond** method returns the token in a data object, and generally does not need to be overridden. 

The login process can be configured as part of the app initialization. 

#### Authorization

During authorization, these actions are completed in sequence: 

* __Receive__ - The controller receives the login information, usually as a POST. 
* __Extract__ - The token is extracted from the request. By default, it is in header *authorization*. 
* __Parse__ - The token is parsed to extract its contents. 
* __Inject__ - The session information from the token is injected into the context so it is available to the app.  

The authorizer provides a default method to complete each action. The app needs to override some or all of these actions by providing its own methods. The **receive** method generally should not be overridden. The default **extract** action extracts the *authorization* header from the request. The app only needs override this method if the token is passed in a different property. The **parse** method parses the token to expose its contents. There is rarely a reason to override this method. The **inject** method injects the session object into the context for later use. 

Note that the controller performs a call to *next()* as the final action, so that the subsequent route controller gets invoked.  

The authorize process can be configured as part of the app initialization. 


#### Initialization

The context object contains an object named *auth*. This provides access to the authentication factory methods:

| Parameter | Description |
| --- | --- |
| buildLogin | Returns a login manager which can be used to perform the login action. |
| buildAuthorization | Returns an authorization manager which can be used to perform the process. |
| hashPassword | A method which accepts a password and returns a hashed value. This is used when passwords are set and when validated. |

The login and authorization managers provide two methods: *controller* and *setAction*. The *controller* is the request process for the manager, so control is routed to this when the incoming request is processed. The *setAction* method allows the app to override process methods as describe above. 

#### Routing

Login requests can be routed directly to a controller method which invokes the login process. Example:

```
router.route('/auth')
  .post(auth.login);
```

Requests that require authorization can include the authorize call as middleware. Example:

```
router.route('/object')
  .get(auth.authorize, objects.list);
```


## Advanced Topics

### Alternative Launch Methods
#### Standard Method

The standard launch of an app requires no server code. It only requires a start script directive in the **package.json** file:

```
  "start": "./node_modules/api-accelerate/bin/run.js"
```

The app can then be launched with the standard command:

```
npm start
```

#### Server Launch Code Alternative

It is possible to launch API Accelerate from your own server. For example:

**./server.js**

```
require('api-accelerate')().run();
```

This code creates an app instance and then runs it. 

This can then be launched manually:

```
node server
```

#### Run vs Start

It is also possible to run the server this way:
```
require('api-accelerate')().start();
```

When the __run__ method starts the server it also sets an event listener for CTRL-C press, and stops the server gracefully. The __start__ method does not capture CTRL-C, so that the process is halted immediately by the OS. 


### Alternative Configuration Methods

By default the server looks for configuration file __config.js__. However there are alternative methods. For example, the app can provide a configuration object itself, or pass a JSON string or file. This flexibility can be helpful for automated testing, or for implementing systems that start multiple servers. 

These are the configuration methods:

| Method | Example | Description |
| --- | --- | --- |
| Default | ```require('api-accelerate')().run();``` | Looks for the default __config.js__ file. |
| Other file | ```require('api-accelerate')('<file name>.js').run();``` | Provides a script that exports config information. |
| JSON file | ```require('api-accelerate')('<file name>.json').run();``` | Provides an alternate JSON configuration file. |
| JSON string | ```require('api-accelerate')('<JSON string>').run();``` | Provides a JSON string that is parsed. |
| Object | ```require('api-accelerate')(<object>).run();``` | Provides an object. Equivalent to a parsed JSON string. |
The server will inspect the parameter and determine if it is a JS file name, a JSON file name, a JSON string or an object. 
These alternative methods can be useful for activities such as testing or deployment branching. 

### Lifecycle Events

An app can listen for lifecycle events and perform additional actions such as starting and stopping custom services or performing additional configuration. 

Events:

| Event | Description |
| --- | --- |
| `start` | Invoked at the beginning, before the app is configured. |
| `ready` | Invoked once the app is configured and running. |
| `stop` | Invoked when the app is triggered to stop. |
| `exit` | Invoked once the app is stopped and is about to exit. |

Event listeners are registered using the `on` function. Example:

```
// test.js

const app = (require('api-accelerate'))();

app.on('start', () => {
  app.logger.info('START');
});

app.on('ready', () => {
  app.logger.info('READY');
// Perform additional configuration, start up other services etc.
});

app.on('stop', () => {
  app.logger.info('STOP');
// Stop other services
});

app.on('exit', () => {
  app.logger.info('EXIT');
});

app.run();
```

Output:

```
> node test

info:  START
info:  READY: config = {"sourceUrl":"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson","targetFolder":"/var/usr/geologic/data/earthquakes"}
^C
info:  STOP
info:  EXIT
> 
```

#### Synchronization
TBD

#### Multiple Databases
TBD
