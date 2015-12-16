/* eslint-disable spaced-comment */
var restify = require('restify')
var storage = require('node-persist')
var engine = require('scrape-engine')()
var fs = require('fs')

/*******************************************************************
 * Initialization
 *******************************************************************/

// Initialize node persist storage
storage.init({
  logging: true,
  dir: __dirname + '/store'
})

// Initialize restify
var server = restify.createServer()
server.use(restify.queryParser())
server.use(restify.bodyParser())

// Setup the routes
server.post('/similarTrack', getSimilarTrack)
server.post('/similarArtist', getSimilarArtist)
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
  // Get the request from the payload
  var payload = JSON.parse(request.body).payload
  var artist = payload.artist
  var album = payload.album
  var filename = './' + artist + '_' + album

  // Check if we already have that in cache
  fs.readFile(filename, function (err, data) {
    // We already have the file in cache, send it back to the user
    if (data !== undefined) {
      response.send(200, data)
      return next()
    }

    // We need to get the data from our engine
    engine.getCover(album, artist, function (err, file) {
      if (err) {
        return errorLogger(err, response, next)
      }

      // We got the cover from our engine, let's save it and return
      fs.writeFile(filename, file, 'binary', function (err) {
        if (err) {
          return errorLogger(err, response, next)
        }
        console.log('The file "' + filename + '" got saved!')
        response.send(200, file)
        return next()
      })
    })
  })
}

// Get similar tracks
function getSimilarTrack (request, response, next) {
  // Get the request from the payload
  var payload = JSON.parse(request.body).payload
  var title = payload.title

  if (!title) {
    return errorLogger('Title is not defined', response, next)
  }

  // Check if we already have that in cache
  storage.getItem(title, function (err, cache) {
    // We already have the file in cache, send it back to the user
    if (cache !== undefined && title === cache.titel) {
      response.send(200, cache)
      return next()
    }

    // We need to get the data from our engine
    engine.getSimilarTitel(title, function (err, result) {
      if (err) {
        return errorLogger(err, response, next)
      }

      // We got the data from our engine, let's save it and return
      var entry = {title: title, result: result}
      storage.setItem(entry.title, entry, function (err) {
        if (err) {
          return errorLogger(err, response, next)
        }
        response.send(200, entry)
        return next()
      })
    })
  })
}

// Get similar artists
function getSimilarArtist (request, response, next) {
  // Get the request from the payload
  var payload = JSON.parse(request.body).payload
  var artist = payload.artist

  if (!artist) {
    return errorLogger('Artist is not defined', response, next)
  }

  // Check if we already have that in cache
  storage.getItem(artist, function (err, cache) {
    // We already have the file in cache, send it back to the user
    if (cache !== undefined && artist === cache.artist) {
      response.send(200, cache)
      return next()
    }

    // We need to get the data from our engine
    engine.getSimilarArtist(artist, function (err, result) {
      if (err) {
        return errorLogger(err, response, next)
      }

      // We got the data from our engine, let's save it and return
      result = result.map(function (x) { return x.content })
      var entry = {artist: artist, result: result}
      storage.setItem(entry.artist, entry, function (err) {
        if (err) {
          return errorLogger(err, response, next)
        }
        response.send(200, entry)
        return next()
      })
    })
  })
}

// Log an error out to the user
function errorLogger (err, response, next) {
  console.error('Error: ' + err)
  response.status(500)
  response.json({
    type: false,
    data: 'Error occurred: ' + err
  })
  return next()
}
