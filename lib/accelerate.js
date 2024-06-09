'use strict'

const Promise = require("bluebird");

// Define constants

const errors = require("./errors");

const fs = require("fs");
const path = require("path");

const DEFAULT_SERVER_PORT = 80;
const DEFAULT_SERVER_TIMEOUT = 5*60*1000;
const DEFAULT_PATH = "/";
const DEFAULT_ROUTES_FOLDER = "./routes";
const DEFAULT_CONFIG_FILE = "./config.js";
const DEFAULT_INIT_FILE = "./initialize.js";

// Primary app creation function
const create = (config) => {

  // Create the app object
  var app = {};

  // Create the express app
  var expressApp = require('express')();
  var expressServer = null;

  // Make the app available from the Express app 
  expressApp.set("app", app);

  // App run function
  const run = () => {
    try {
      var expressServer = start(app);
      var stopping = false;
      process.on('SIGINT', function() {
        if (stopping) {
          process.exit();
        }
        stopping = true;
        stop();
      });

    } catch(e) {
      console.log(e);
      process.exit(1);
    }
  }

  // App start function
  const start = async () => {
    try {

      logger.system("Starting server")

      var cfg = config.server || {};

      expressServer = expressApp.listen(cfg.port || DEFAULT_SERVER_PORT);
      expressServer.setTimeout(cfg.timeout || DEFAULT_SERVER_TIMEOUT);

      for (var k of Object.keys(app.dbs)) {
        await app.dbs[k].start();
      }

      logger.system("Server started");

    } catch(e) {
      logger.exception(e);
      logger.system("Unable to start server");
      throw e;
    }
  }

  // App stop function
  const stop = async () => {
    try {

      logger.system("Stopping server")

      if (expressServer != null) {
        expressServer.close();
      }

      for (var k of Object.keys(app.dbs)) {
        await app.dbs[k].stop();
      }

      logger.system("Server stopped")

    } catch(e) {
      console.log(e);
    }
  }

  // Expose runtime functions
  app.run = run;
  app.start = start;
  app.stop = stop;

  // Logger
  app.logger = null;

  // Responder
  app.responder = null;

  // Handlers
  app.handlers = require('./handlers');

  // Info functions
  app.info = {
    config: () => { return config.app || {}; },
    masterConfig: () => { return config; },
    expressApp: () => { return expressApp; },
    expressServer: () => { return expressServer; }
  };

  // Expose database adapters
  app.db = null;
  app.dbs = [];

  // Load the configuration
  try {
    var configResults = loadConfig(config);
    config = configResults.config;
  } catch(e) {
    throw new errors.SystemError("Unable to load configuration", e);
  }

  // Initialize logger
  try {
    var logger = app.logger = require('./logger').createLogger(config.logger || {});
  } catch(e) {
    throw new errors.SystemError("Unable to intialize logger", e);
  }

  // Output message from config load
  logger.system(configResults.msg);

  // Configure the database access
  configureDatabase(app, (config || {}).database);

  // Perform app initialization, if any
  initializeApp(app, config);

  // Configure the routers
  try {
    logger.system("Configuring routers");
    configureRouters(app, config.router || config.routers || {});
  } catch(e) {
    throw new errors.SystemError("Error configuring routers", e);
  }

  // Initialize the responder
  try {
    logger.system("Initializing responder");
    app.responder = require('./responder').createResponder(config || {});
  } catch(e) {
    throw new errors.SystemError("Unable to intialize responder", e);
  }

  return app;
}

// Expose creation function
exports = module.exports = create;

// Expose error classes
exports.errors = require('./errors');

// Expose built-in helpers
exports.helpers = {
  util: require('./helpers/util'),
  files: require('./helpers/files'),
  format_csv: require('./helpers/format_csv'),
  format_tabular: require('./helpers/format_tabular'),
  rest_client: require('./helpers/rest_client')
};

const loadConfig = (cfg) => {

  // If no config provided, use standard config file
  cfg = cfg || DEFAULT_CONFIG_FILE;

  // If object, return it
  if (typeof cfg == "object") {
    return {
      msg: "Object config",
      config: cfg
    };
  }

  // If string, may be JSON or file name
  if (typeof cfg == "string") {

    // Attempt to parse as a JSON string
    try {
      return {
        msg: "JSON config string",
        config: JSON.parse(cfg)
      };
    } catch(e) {}

    // Not a JSON string so try to parse the file name
    var f = path.parse(cfg)
    var ext = f.ext;

    // If JSON, try loading file and parsing contents - throw exception if fails
    if (ext == ".json") {
      return {
        msg: "JSON config file " + cfg,
        config: JSON.parse(fs.readFileSync(path.join(process.cwd(), cfg)))
      };
    }

    // If js, try to load with require
    if (ext == ".js") {
      return {
        msg: "Standard config file " + cfg,
        config: require(path.join(process.cwd(), cfg))
      }
    }

  }

  throw new Error("Unrecognized configuration format");
}

const configureDatabase = (app, config) => {

  var logger = app.logger;

  if (config != null) {

    if (Array.isArray(config)) {
      for (var cfg of config) {
        configureDatabase(app, cfg);
      }
      return;
    }

    try {

      logger.system("Initializing database");
      var adapter = require('./database').createAdapter(config, logger);
      var name = config.name || "";
      app.dbs[name] = adapter;
      app.db = app.db || adapter;

      logger.system("Database adapter created", name);

    } catch(e) {
      throw new errors.SystemError("Unable to configure database", e);
    }

  }
}

const configureRouters = (app, config) => {

  var logger = app.logger;
  var expressApp = app.info.expressApp();

  if (!Array.isArray(config)) {
    config = [config];
  }

  var routers = [];

  for (var cfg of config) {
    logger.system("Configuring router", cfg)
    var router = require('express').Router();
    configureRouter (app, router, cfg);
    var route_path = cfg.path || DEFAULT_PATH;
    logger.system("Using route path", route_path)
    expressApp.use(route_path, router);
    routers.push(router);
  }

  return routers;
}

const configureRouter = (app, router, config) => {
  configureMiddleware(app, router, config);
  configureRoutes(app, router, config);
  configureDefaultRouteResponse(app, router, config);
}

const configureMiddleware = (app, router, config) => {
  var logger = app.logger;

  var options = {
    cookie_parser: true,
    json_parser: true,
    form_parser: true,
    auth: false
  }

  Object.assign(options, config.middleware || {});

  // // Inject server into the req object on every call
  // router.use((req, res, next) => {
  //   req.server = server;
  //   next();
  // });

  // Parse cookies
  if (options.cookie_parser) {
    logger.system("Using cookie parser")
    router.use(require('cookie-parser')());
  }

  // Parse json strings
  if (options.json_parser) {
    logger.system("Using body parser")
    router.use(require('body-parser').json({limit:'100mb'}));
  }

  // Parse form data
  if (options.form_parser) {
    logger.system("Using form parser")
    router.use(require('body-parser').urlencoded({extended:true, type:'application/x-www-form-urlencoded', limit:'100mb'}));
  }

  // Log requests if configured
  if (((config || {}).logger || {}).request) {
    logger.system("Logging requests")

    router.use((req, res, next) => {
      logger.request(req, res);
      next();
    });
  }

  router.use((req, res, next) => {
    var app = req.app.get("app");

    req.context = {
      app: app,
      responder: app.responder,
      db: app.db,
      dbs: app.dbs,
      session: {}
    };

    next();
  });

}

const configureRoutes = (app, router, config) => {

  var logger = app.logger;

  var route_folder = config.folder || DEFAULT_ROUTES_FOLDER
  var ff = require("fs").readdirSync(route_folder)
  for (var f of ff) {
    f = path.parse(f)
    var ext = f.ext;
    f = path.resolve(path.join(route_folder, f.base));
    if (ext == ".js") {
      logger.system("Loading route file", f)
      require(f)(router, app, config)
    } else {
      logger.system("Skipping route file", f)
    }
  }
}

const configureDefaultRouteResponse = (app, router, config) => {

  // Return not found error on all unrecognized request routes 
  router.get('*', (req,res) => {
    return app.responder.notFound(req,res)
  })

  router.post('*', (req,res) => {
    return app.responder.notFound(req,res)
  })

  router.put('*', (req,res) => {
    return app.responder.notFound(req,res)
  })

  router.delete('*', (req,res) => {
    return app.responder.notFound(req,res)
  })

  router.head('*', (req,res) => {
    return app.responder.notFound(req,res)
  })
}

const initializeApp = (app, config) => {

  var f = path.resolve(DEFAULT_INIT_FILE);
  if (fs.existsSync(f)) {
    require(f)(app, config);
  }
}
