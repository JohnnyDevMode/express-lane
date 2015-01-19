###
 * express-lane
 * https://github.com/devmode/express-lane
 *
 * Copyright (c) 2014 DevMode, Inc.
 * Licensed under the MIT license.
###

{compact, flatten} = require 'underscore'
querystring = require 'querystring'

class Router

  constructor: (@app) ->
    @routes = {}

  route: (name, path, middleware..., handler) =>
    @routes[name] = path
    handler_middleware = handler.middleware ? []
    for verb in [ 'get', 'post', 'put', 'patch', 'delete', 'all', 'head', 'options' ]
      @app[verb](path, compact(flatten([ middleware, handler.middleware, handler[verb] ]))) if handler[verb]?

  custom: (type, custom...) =>
    route = @route
    @[type] = (name, path, middleware..., handler) ->
      route name, path, custom.concat(middleware)..., handler

  uri_for: (name, params={}, req=undefined, full=false) =>
    url = @routes[name]
    throw Error("Route: #{name} not found.") unless url
    route_params = url.match(/:\w+\??/g) ? []
    for route_param in route_params
      name = route_param[1..]
      name = name[0...-1] if name.match /\?$/
      value = params[name] ? ''
      delete params[name]
      url = url.replace route_param, value
    query = querystring.unescape querystring.stringify(params)
    url = url.replace /\/$/, '' if url.length > 1
    url += "?#{query}" if query.length
    url = "#{req.protocol}://#{req.get 'HOST'}#{url}" if full
    url

  middleware: () =>
    uri_for = @uri_for
    (req, res, next) ->
      router =
        path_for: (name, params) =>
          uri_for name, params
        uri_for: (name, params) =>
          uri_for name, params, req, true
        redirect_to: (name, params, full=false) =>
          res.redirect uri_for name, params, req, full
      res[name] = value for name, value of router
      res.locals.path_for = router.path_for
      res.locals.uri_for = router.uri_for
      next()

module.exports = (app) ->
  new Router app
