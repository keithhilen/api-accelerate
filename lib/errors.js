'use strict'

// errors.js

module.exports.Error = class BaseError extends Error {
}

module.exports.SystemError = class SystemError extends Error {
  constructor(message, info) {
    super(message);
    this.name = this.constructor.name;
    this.info = info || {}
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(message)).stack; 
    }
  }
}

module.exports.NotFoundError = class NotFoundError extends Error {
  constructor(message, id, info) {
    super(message);
    this.name = this.constructor.name;
    this.id = id
    this.info = info || {}
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(message)).stack; 
    }
  }
}

module.exports.DuplicateError = class DuplicateError extends Error {
  constructor(message, id, info) {
    super(message);
    this.name = this.constructor.name;
    this.id = id
    this.info = info || {}
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(message)).stack; 
    }
  }
}

module.exports.NotAllowedError = class NotAllowedError extends Error {
  constructor(message, info) {
    super(message);
    this.name = this.constructor.name;
    this.info = info || {}
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(message)).stack; 
    }
  }
}

module.exports.NotImplementedError = class NotImplementedError extends Error {
  constructor() {
    super();
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(message)).stack; 
    }
  }
}

global.FileError = class FileError extends Error {
  constructor(message, info) {
    super(message);
    this.name = this.constructor.name;
    this.info = info || {}
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(message)).stack; 
    }
  }
}

module.exports.HttpError = class HttpError extends Error {
  constructor(message, url, info) {
    super(message);
    this.name = this.constructor.name;
    this.url = url
    this.info = info || {}
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(message)).stack; 
    }
  }
}

module.exports.DatabaseError = class DatabaseError extends Error {
  constructor(query, values, info) {
    super();
    this.name = this.constructor.name;
    this.query = query
    this.values = values
    this.info = info || {}
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(message)).stack; 
    }
  }
}

module.exports.ImageError = class ImageError extends Error {
  constructor(message, info) {
    super(message);
    this.name = this.constructor.name;
    this.info = info || {}
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else { 
      this.stack = (new Error(message)).stack; 
    }
  }
}

