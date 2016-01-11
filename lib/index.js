
/*
 * express-lane
 * https://github.com/devmode/express-lane
 *
 * Copyright (c) 2015 Sean M. Duncan
 * Licensed under the MIT license.
 */

(function() {
  var Builder, Router, compact, flatten, isArray, isFunction, querystring, ref, reject, select,
    slice = [].slice,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('lodash'), compact = ref.compact, flatten = ref.flatten, select = ref.select, reject = ref.reject, isArray = ref.isArray, isFunction = ref.isFunction;

  querystring = require('querystring');

  Builder = (function() {
    function Builder(router1, configurator) {
      this.router = router1;
      this.configurator = configurator;
      this.middleware = [];
    }

    Builder.prototype.add = function() {
      var binding, i, j, len, middleware, verb, verbs;
      verbs = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), middleware = arguments[i++];
      if (!verbs.length) {
        verbs = ['all'];
      }
      binding = {};
      for (j = 0, len = verbs.length; j < len; j++) {
        verb = verbs[j];
        binding[verb] = middleware;
      }
      return this.middleware.push(binding);
    };

    Builder.prototype.build = function() {
      this.configurator.apply(this);
      return (function(_this) {
        return function() {
          var handler, i, middleware, name, path, ref1;
          name = arguments[0], path = arguments[1], middleware = 4 <= arguments.length ? slice.call(arguments, 2, i = arguments.length - 1) : (i = 2, []), handler = arguments[i++];
          return (ref1 = _this.router).route.apply(ref1, [name, path].concat(slice.call(_this.middleware.concat(middleware)), [handler]));
        };
      })(this);
    };

    return Builder;

  })();

  Router = (function() {
    function Router(app1) {
      this.app = app1;
      this.middleware = bind(this.middleware, this);
      this.uri_for = bind(this.uri_for, this);
      this.custom = bind(this.custom, this);
      this.route = bind(this.route, this);
      this.routes = {};
    }

    Router.prototype.route = function() {
      var binding, bindings, handler, i, index, it, j, k, l, len, len1, len2, methods, middleware, name, path, results, stack, supported, unsupported, unsupported_method, verb;
      name = arguments[0], path = arguments[1], bindings = 4 <= arguments.length ? slice.call(arguments, 2, i = arguments.length - 1) : (i = 2, []), handler = arguments[i++];
      this.routes[name] = path;
      methods = ['get', 'post', 'put', 'patch', 'delete', 'all', 'options'];
      supported = select(methods, function(verb) {
        return handler[verb] != null;
      });
      unsupported = reject(methods, function(verb) {
        return handler[verb] != null;
      });
      for (index = j = 0, len = bindings.length; j < len; index = ++j) {
        it = bindings[index];
        if (isFunction(it || isArray(it))) {
          bindings[index] = {
            all: it
          };
        }
      }
      for (k = 0, len1 = supported.length; k < len1; k++) {
        verb = supported[k];
        middleware = compact(flatten((function() {
          var l, len2, ref1, results;
          results = [];
          for (l = 0, len2 = bindings.length; l < len2; l++) {
            binding = bindings[l];
            results.push((ref1 = binding[verb]) != null ? ref1 : binding.all);
          }
          return results;
        })(), true));
        stack = compact(flatten([middleware, handler.middleware, handler[verb]], true));
        this.app[verb](path, flatten([
          select(stack, function(it) {
            return it.length < 4;
          }), select(stack, function(it) {
            return it.length > 3;
          })
        ], true));
      }
      if (indexOf.call(supported, 'get') >= 0) {
        supported.push('head');
      }
      if (indexOf.call(supported, 'options') < 0) {
        this.app.options(path, function(req, res, next) {
          res.set('allow', ((function() {
            var l, len2, results;
            results = [];
            for (l = 0, len2 = supported.length; l < len2; l++) {
              verb = supported[l];
              results.push(verb.toUpperCase());
            }
            return results;
          })()).join(', '));
          return res.send(200);
        });
      }
      results = [];
      for (l = 0, len2 = unsupported.length; l < len2; l++) {
        verb = unsupported[l];
        unsupported_method = function(req, res, next) {
          res.set('allow', ((function() {
            var len3, m, results1;
            results1 = [];
            for (m = 0, len3 = supported.length; m < len3; m++) {
              verb = supported[m];
              results1.push(verb.toUpperCase());
            }
            return results1;
          })()).join(', '));
          return res.sendStatus(405);
        };
        results.push(this.app[verb](path, unsupported_method));
      }
      return results;
    };

    Router.prototype.custom = function() {
      var custom, type;
      type = arguments[0], custom = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (custom.length === 1 && isFunction(custom[0]) && custom[0].length === 0) {
        return this[type] = new Builder(this, custom[0]).build();
      } else {
        return this[type] = (function(_this) {
          return function() {
            var handler, i, middleware, name, path;
            name = arguments[0], path = arguments[1], middleware = 4 <= arguments.length ? slice.call(arguments, 2, i = arguments.length - 1) : (i = 2, []), handler = arguments[i++];
            return _this.route.apply(_this, [name, path].concat(slice.call(custom.concat(middleware)), [handler]));
          };
        })(this);
      }
    };

    Router.prototype.uri_for = function(name, params, req, full) {
      var i, len, query, ref1, ref2, route_param, route_params, url, value;
      if (params == null) {
        params = {};
      }
      if (req == null) {
        req = void 0;
      }
      if (full == null) {
        full = false;
      }
      url = this.routes[name];
      if (!url) {
        throw Error("Route: " + name + " not found.");
      }
      route_params = (ref1 = url.match(/:\w+\??/g)) != null ? ref1 : [];
      for (i = 0, len = route_params.length; i < len; i++) {
        route_param = route_params[i];
        name = route_param.slice(1);
        if (name.match(/\?$/)) {
          name = name.slice(0, -1);
        }
        value = (ref2 = params[name]) != null ? ref2 : '';
        delete params[name];
        url = url.replace(route_param, value);
      }
      query = querystring.unescape(querystring.stringify(params));
      if (url.length > 1) {
        url = url.replace(/\/$/, '');
      }
      if (query.length) {
        url += "?" + query;
      }
      if (full) {
        url = req.protocol + "://" + (req.get('HOST')) + url;
      }
      return url;
    };

    Router.prototype.middleware = function() {
      var uri_for;
      uri_for = this.uri_for;
      return function(req, res, next) {
        var name, router, value;
        router = {
          path_for: (function(_this) {
            return function(name, params) {
              return uri_for(name, params);
            };
          })(this),
          uri_for: (function(_this) {
            return function(name, params) {
              return uri_for(name, params, req, true);
            };
          })(this),
          redirect_to: (function(_this) {
            return function(name, params, full) {
              if (full == null) {
                full = false;
              }
              return res.redirect(uri_for(name, params, req, full));
            };
          })(this)
        };
        for (name in router) {
          value = router[name];
          res[name] = value;
        }
        res.locals.path_for = router.path_for;
        res.locals.uri_for = router.uri_for;
        return next();
      };
    };

    return Router;

  })();

  module.exports = function(app) {
    return new Router(app);
  };

}).call(this);
