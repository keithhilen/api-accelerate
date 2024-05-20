'use strict'

// rest_client.js

const Promise = require("bluebird");

const fs = require("fs");
const axios = require("axios");

const createRestClient = (config) => {

  const prepare = (params) => {

    var config = {
      method: params.method,
      url: params.path,
      baseURL: params.base,
      headers: params.headers,
      params: params.query,
      data: params.data
    }

    if (Array.isArray(config.url)) {
      var u = "";
      for (var item of config.url) {
        u = require("path").join(u, item);
      }
      config.url = u;
    }

    Object.assign(config, params.options);
    return config;
  }

  const prepareGet = (params) => {

    return prepare({
      method: "get",
      base: params.base,
      path: params.path,
      query: params.query,
      headers: params.headers,
      options: params.options
    });
  }

  const prepareDelete = (params) => {

    return prepare({
      method: "delete",
      base: params.base,
      path: params.path,
      query: params.query,
      headers: params.headers,
      options: params.options
    });
  }

  const preparePut = (params) => {

    return prepare({
      method: "put",
      base: params.base,
      path: params.path,
      query: params.query,
      data: params.data,
      headers: params.headers,
      options: params.options
    });
  }

  const preparePost = (params) => {

    return prepare({
      method: "post",
      base: params.base,
      path: params.path,
      query: params.query,
      data: params.data,
      headers: params.headers,
      options: params.options
    });
  }

  const preparePostMulti = (params) => {
    var defaults = {
      method: 'post',
      options: {
        maxContentLength: Infinity, 
        maxBodyLength: Infinity
      }
    };

    params = Object.assign(Object.assign({}, params), defaults);
    return prepareMulti(params);
  }

  const preparePutMulti = (params) => {

    var defaults = {
      method: 'put',
      options: {
        maxContentLength: Infinity, 
        maxBodyLength: Infinity
      }
    };

    params = Object.assign(Object.assign({}, params), defaults);
    return prepareMulti(params);
  }

  const prepareMulti = (params) => {

    var form = new (require("form-data"))();

    var files = params.files || {};
    for (var name in files) {
      form.append(name, fs.createReadStream(files[name]));
    }

    var data = params.data || {}
    for (var name in data) {
      form.append(name, data[name]);
    }

    return prepare({
      method: params.method,
      base: params.base,
      path: params.path,
      query: params.query,
      data: form,
      headers: Object.assign(params.headers, form.getHeaders()),
      options: params.options
    });
  }

  const execute = async (params) => {
    return new Promise(async (resolve, reject) => {
      try {

        var results = await axios(params);
        resolve(results);

      } catch(e) {
        return reject(e)
      }
    });
  }

  const get = async (params) => {

    return new Promise(async (resolve, reject) => {
      try {

        resolve(await axios(prepareGet(params)));

      } catch(e) {
        return reject(e)
      }
    });
  }

  const put = async (params) => {

    return new Promise(async (resolve, reject) => {
      try {

        resolve(await axios(preparePut(params)));

      } catch(e) {
        return reject(e)
      }
    });
  }

  const post = async (params) => {

    return new Promise(async (resolve, reject) => {
      try {

        resolve(await axios(preparePost(params)));

      } catch(e) {
        return reject(e)
      }
    });
  }

  const postMulti = async (params) => {

    return new Promise(async (resolve, reject) => {
      try {

        resolve(await execute(preparePostMulti(params)));

      } catch(e) {
        return reject(e)
      }
    });
  }

  const putMulti = async (params) => {

    return new Promise(async (resolve, reject) => {
      try {

        resolve(await execute(preparePutMulti(params)));

      } catch(e) {
        return reject(e)
      }
    });
  }

  const _delete = async (params) => {

    return new Promise(async (resolve, reject) => {
      try {

        resolve(await axios(prepareDelete(params)));

      } catch(e) {
        return reject(e)
      }
    });
  }

  const restClient = {
    prepare: prepare,
    prepareGet: prepareGet,
    prepareDelete: prepareDelete,
    prepareDelete: prepareDelete,
    preparePost: preparePost,
    preparePostMulti: preparePostMulti,
    preparePutMulti: preparePutMulti,
    prepareMulti: prepareMulti,
    execute: execute,
    get: get,
    put: put,
    post: post,
    postMulti: postMulti,
    putMulti: putMulti,
    delete: _delete
  }

  return restClient;
}

module.exports = {
  createRestClient: createRestClient
}
