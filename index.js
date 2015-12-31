/* eslint-disable spaced-comment */
var restify = require('restify')
var storage = require('node-persist')
var engine = require('scrape-engine')()
var fs = require('fs')
var rusha = new (require('rusha'))()
var messaging = require('secure-client-server-messaging')

/*******************************************************************
 * Initialization
 *******************************************************************/

// Initialize restify
var server = restify.createServer()
server.use(restify.queryParser())
server.use(restify.bodyParser())
server.use(restify.CORS())
server.use(restify.fullResponse())

// Setup the routes
server.post('/similarTrack', getSimilarTrack)
server.post('/Cover', getCover)

// Start the server
server.listen(8080, '127.0.0.1', function () {
  console.log('%s listening at %s', server.name, server.url)
})

/*******************************************************************
 * Controllers
 *******************************************************************/

// Get the cover for an album
function getCover (request, response, next) {
  // Get the payload while making sure it is authenticated
  var payload = getAuthenticatedPayload(request.body)
  if (!payload) {
    return errorLogger('Authentication failed', response, next)
  }

  // Generate a function that will return an encrypted response
  var responder = generateResponder(response, request.body)

  // Get the request from the payload
  var artist = payload.artist
  var album = payload.album
  var filename = './store/COVER_' + (artist + ' ' + album).replace(/[^0-9a-zA-Z_]/g, '_')

  // Check if we already have that in cache
  fs.readFile(filename, function (err, data) {
    // We already have the file in cache, send it back to the user
    if (data !== undefined) {
      responder(data.toString('utf8'))
      return next()
    }

    // We need to get the data from our engine
    engine.getCover(album, artist, function (err, file) {
      if (err) {
        return errorLogger(err, response, next)
      }

      // Attach the base64 marker
      file = 'data:image/jpeg;base64,' + file

      // We got the cover from our engine, let's save it and return
      fs.writeFile(filename, file, function (err) {
        if (err) {
          return errorLogger(err, response, next)
        }
        console.log('The file "' + filename + '" got saved!')
        responder(file)
        return next()
      })
    })
  })
}

// Get similar tracks
function getSimilarTrack (request, response, next) {
  // Get the payload while making sure it is authenticated
  var payload = getAuthenticatedPayload(request.body)
  if (!payload) {
    return errorLogger('Authentication failed', response, next)
  }

  // Generate a function that will return an encrypted response
  var responder = generateResponder(response, request.body)

  // Get the request from the payload
  var hash = 'similar-track' + rusha.digestFromString(JSON.stringify(payload))

  // Check if we already have that in cache
  storage.getItem(hash, function (err, cache) {
    // We already have the file in cache, send it back to the user
    if (cache !== undefined) {
      responder(cache)
      return next()
    }

    // We need to get the data from our engine
    engine.getSimilarTitle(payload.title, payload.album, payload.artist, payload.genre, function (err, result) {
      if (err) {
        return errorLogger(err, response, next)
      }

      // We got the data from our engine, let's save it and return
      var entry = {payload: payload, result: result}
      storage.setItem(hash, entry, function (err) {
        if (err) {
          return errorLogger(err, response, next)
        }
        responder(entry)
        return next()
      })
    })
  })
}

// Get the payload of a encrypted request
function getAuthenticatedPayload (requestBody) {
  // Make sure our storage is synchronized with what we have on disk so changes
  // on the user get reflected here even if the server doesn't get restarted
  storage.initSync({dir: __dirname + '/store'})
  var id = requestBody.id

  // Grab the user by id
  var user = storage.getItem('authenticatedUsers')[id]
  if (!id || !user) {
    return false
  }

  // Give to messaging function who handles all the cryptography logic
  return messaging.decrypt(requestBody, user.key)
}

function generateResponder (response, requestBody) {
  // Grab the user by id
  var user = storage.getItem('authenticatedUsers')[requestBody.id]

  // Return a function that will return an encrypted response
  return function (payload) {
    var encryptedPayload = messaging.encrypt(payload, user.key)
    response.send(200, encryptedPayload)
  }
}

// Send the error as a special response to the user
function errorLogger (err, response, next) {
  console.error('Error: ' + err)
  response.status(500)
  response.json({
    type: 'ERROR',
    data: 'Error occurred: ' + err
  })
  return next()
}
