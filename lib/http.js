/*
 * Copyright (c) 2011 Vinay Pulim <vinay@milewise.com>
 * MIT Licensed
 */

"use strict";

var url = require('url');
var req = require('request');
var zlib = require('zlib');

var VERSION = require('../package.json').version;

exports.request = function(rurl, data, callback, exheaders, exoptions) {
  var curl = url.parse(rurl);
  var secure = curl.protocol === 'https:';
  var host = curl.hostname;
  var port = parseInt(curl.port || (secure ? 443 : 80));
  var path = [curl.pathname || '/', curl.search || '', curl.hash || ''].join('');
  var method = data ? "POST" : "GET";
  var headers = {
    "User-Agent": "node-soap/" + VERSION,
    "Accept" : "text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip",
    "Accept-Charset": "utf-8",
    "Connection": "close",
    "Host" : host + (port ? ":"+port : "")
  };
  var attr;

  if (typeof data === 'string') {
    headers["Content-Length"] = Buffer.byteLength(data, 'utf8');
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  exheaders = exheaders || {};
  for (attr in exheaders) { headers[attr] = exheaders[attr]; }

  var options = {
    uri: curl,
    method: method,
    headers: headers,
    encoding: null
  };
   
  exoptions = exoptions || {};
  for (attr in exoptions) { options[attr] = exoptions[attr]; }

  var request = req(options, function (error, res, body) {
    if (error) {
      return callback(error);
    }
    if (res.headers['content-encoding'] === 'gzip') {
      zlib.gunzip(body, function (err, data) {
        body = res.body = data.toString('utf8');
        request.on('error', callback);
        callback(null, res, body);
      });
    } else {
      body = res.body = res.body.toString('utf8');
      request.on('error', callback);
      callback(null, res, body);
    }
  });
  request.end(data);
};
