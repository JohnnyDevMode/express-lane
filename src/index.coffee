{compact, flatten} = require 'underscore'
querystring = require 'querystring'

class Router

  constructor: (@app) ->
    @routes = {}

  route: (name, path, middleware..., handler) =>
    @routes[name] = path
    handler_middleware = handler.middleware ? []
    for verb in [ 'get', 'post', 'put', 'delete', 'all', 'head', 'options' ]
      @app[verb](path, compact(flatten([ middleware, handler.middleware, handler[verb] ]))) if handler[verb]?

  uri_for: (name, params, req=undefined, full=false) =>
    url = @routes[name]
    throw Error("Route: #{name} not found.") unless url
    route_params = url.match(/:\w+/g) ? []
    for route_param in route_params
      name = route_param[1..]
      value = params[name]
      delete params[name]
      url = url.replace route_param, value
    query = querystring.stringify params
    url += "?#{query}" if query.length 
    url = "#{req.protocol}://#{req.get 'HOST'}#{url}" if full
    url

  reverse_routing: () =>
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
      res.locals 
        path_for: router.path_for
        uri_for: router.uri_for
      next()

  custom: (type, custom...) =>
    route = @route
    @[type] = (name, path, middleware..., handler) ->
      route name, path, custom.concat(middleware)..., handler

module.exports = Router
