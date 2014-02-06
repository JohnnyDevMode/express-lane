# Express Lane

> An express routing extension that provides named, resourceful and reversible routes

## Getting Started

Install Express Lane:

```shell
npm install express-lane --save
```

## Examples

Express Lane was writtern to improve the experience of writing RESTFul Express apps written in CoffeeScript.  As such, the examples will demonstrate its usage in this context.  However, Express Lane's API should translate well to pure JavaScript.

### Configure The Middleware

```coffee
express = require 'express'
express_lane = require('express-lane')

app = express()
router = express_lane(app)

# configure a custom route type for page requests
router.custom 'page',
  express.cookieParser(config.session.secret)
  session.middleware(app)
  flash()
  helpers(app)

# configure a custom router type for API calls
router.custom 'api'

app.configure () ->
  app.use express.static(public_dir)
  # ...
  app.use router.middleware()
  app.use express.router
  # ...

# map the routes ...

app.listen(process.env.PORT || 3000)
```

### Map The Routes

The basic API for registering routes then becomes:

```coffee
router.route 'route-name', '/route/path', middleware..., handler
```

Or:

```coffee
router.custom_type 'route-name', '/route/path', middleware..., handler
```

For Example, Given an App Configures as Above:

```coffee
authenticated = (roles...) ->
  (req, res, next) ->
    unless req.session.account?
      req.flash 'continue', req.path
      return res.redirect_to 'signin' # redirect to named route
    unless not roles.length or req.session.account.role in roles
      return next status: 403
    next()

handlers = require 'handlers'

router.page 'signin', '/signin', handlers.signin

router.page 'admin', '/admin', authenticated('admin'), handlers.admin.clients

router.page 'admin-accounts', '/admin/accounts', authenticated('admin'), handlers.admin.accounts

router.page 'admin-account', '/admin/accounts/:id', authenticated('admin'), handlers.admin.account

router.api 'resources', '/resources', handlers.api.resources

router.api 'resource', '/resoruces/:id', handlers.api.resource

```

### Implement the Handler

An Express Lane handler is a simple object literal with Express middleware functions bound to its supported HTTP verbs.

For example (handlers/admin/accounts.coffee):

```coffee
module.exports =

  get: (req, res, next) ->
    # render the accounts

  post: (req, res, next) ->
    # validate the form data
    # add an account
    res.redirect_to 'admin-account', id: account.id

```

Or (With Verb-Specific Middleware):

```coffee
module.exports =
  
  get: (req, res, next) ->
    # render the accounts

  post: [
    (req, res, next) ->
      # form validation middlware called only on POST
    (req, res, next) ->
      # add an account
      res.redirect_to 'admin-account', id: account.id
  ]

```

Or (handlers/admin/account.coffee):

```coffee
module.exports =

  get: (req, res, next) ->
    # find the account by req.params.id
    # render the account

  patch: (req, res, next) ->
    # find the account by req.params.id
    # validate the form data
    # update the account
    # render the account

  delete: (req, res, next) ->
    # find the account by req.params.id
    # delete the account
    # render the account

```

Or (With Handler-Specific and Verb Specific Middleware):

```coffee
module.exports =

  middleware: (req, res, next) ->
    # account lookup middlware called for all verbs in this handler
    # find the account by req.params.id
    # return 404 if account not found
    # add account to res.locals
    next()

  get: (req, res, next) ->
    # render the account

  patch: [
    (req, res, next) ->
      # form validation middlware called only on PATCH
    (req, res, next) ->
      # update the account
      # render the account
  ]

  delete: (req, res, next) ->
    # delete the account
    # render the account

```

### Reverse Routing

It is very common for apps to need to generate relative paths and fully qualified URIs for redirects, links, etc.  Since all express lane routes are named it is easy to look them up and generate paths to resources.  Express Lane enhances the Express respons object with three helpful reverse routing functions to this effect.

path_for:

```coffee
# look up the absolute path for a specific account
res.path_for 'admin-account', id: account.id
```

uri_for:

```coffee
# look up the fully qualified url for a specific account
res.uri_for 'admin-account', id: account.id
```

redirect_to:

```coffee
# redirect to the absolute path of a specific account
res.redirect_to 'admin-account', id: account.id
```

or:

```coffee
# redirect to the fully qualified url of a specific account
res.redirect_to 'admin-account', id: account.id, true
```


### View Helpers

The path_for and uri_for functions are also added to res.locals so they can be used within template engines such as Jade.

```jade
block content
  table.table.table-hover
    thead
      tr
        th Nickname
        th Email
    tbody
      - for account in accounts
        - var edit_url = uri_for('admin-account', { id: account.id });
        tr.clickable(data-path=edit_url)
          td= account.nickname
          td= account.email
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality.

## Release History
_(Nothing yet)_
