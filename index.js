var restify = require('restify')
var storage = require('node-persist')
var engine = require('scrape-engine')
var fs = require('fs')

var self = this
this.storage = storage
this.engine = engine()

storage.init({
  logging: true,
  dir: __dirname + '/store'
})

var entryTemp = {}

function getSA (req, res, next) {
  storage.getItem(req.params.artist, function (err, value) {
    // Run this code once the value has been
    // loaded from the offline store.
    console.log('getSA.value: ' + value)
    console.log('req.params.artist: ' + req.params.artist)
    var comparision = value !== undefined && req.params.artist === value.artist
    console.log(comparision)
    if (value !== undefined && req.params.artist === value.artist) {
      res.send(200, value)
    } else {
      if (req.params.artist) {
        self.engine.getSimilarArtist(req.params.artist, function (err, list) {
          if (err) {
            console.log('Error: ' + err)
            res.status(500)
            res.json({
              type: false,
              data: 'Error occured: 500'
            })
            return next()
          }

          console.log('list: ' + list[0].content)
          var entry = {}
          entry.artist = req.params.artist
          entry.result = list
          self.storage.setItem(entry.artist, entry, function (err, value) {
            if (err) {
              console.log('Error: ' + err)
              res.status(500)
              res.json({
                type: false,
                data: 'Error occured: 500'
              })
              return next()
            }
            res.send(200, entry)
          })
        })
      } else {
        console.log('Error: ' + err)
        res.status(500)
        res.json({
          type: false,
          data: 'Error occured: 500'
        })
      }
    }
    return next()
  })
}

function getST (req, res, next) {
  storage.getItem(req.params.titel, function (err, value) {
    // Run this code once the value has been
    // loaded from the offline store.
    console.log('getST.value: ' + value)
    console.log('req.params.titel: ' + req.params.titel)
    var comparision = value !== undefined && req.params.titel === value.titel
    console.log(comparision)
    if (value !== undefined && req.params.titel === value.titel) {
      res.send(200, value)
    } else {
      if (req.params.titel) {
        self.engine.getSimilarTitel(req.params.titel, function (err, list) {
          if (err) {
            console.log('Error: ' + err)
            res.status(500)
            res.json({
              type: false,
              data: 'Error occured: 500'
            })
            return next()
          }

          console.log('list: ' + list[0].content)
          var entry = {}
          entry.titel = req.params.titel
          entry.result = list
          self.storage.setItem(entry.titel, entry, function (err, value) {
            if (err) {
              console.log('Error: ' + err)
              res.status(500)
              res.json({
                type: false,
                data: 'Error occured: 500'
              })
              return next()
            }
            res.send(200, entry)
          })
        })
      } else {
        console.log('Error: ' + err)
        res.status(500)
        res.json({
          type: false,
          data: 'Error occured: 500'
        })
      }
    }
    return next()
  })
}

function getCover (req, res, next) {
  storage.getItem('Cover:' + req.params.album, function (err, value) {
    // Run this code once the value has been
    // loaded from the offline store.
    if (err) {
      console.log('Error: ' + err)
      res.status(500)
      res.json({
        type: false,
        data: 'Error occured: 500'
      })
      return next()
    }

    var comparision = value !== undefined && req.params.album === value.album
    console.log(comparision)
    if (value !== undefined && (req.params.album) === value.album) {
      res.send(200, value)
    } else {
      if (req.params.album) {
        self.engine.getCoverURL(req.params.artist, req.params.album, function (err, list) {
          if (err) {
            console.log('Error: ' + err)
            res.status(500)
            res.json({
              type: false,
              data: 'Error occured: 500'
            })
            return next()
          }

          console.log('list: ' + list[0].content)
          var entry = {}
          entry.album = req.params.album
          entry.result = list
          self.storage.setItem('Cover:' + entry.album, entry, function (err, value) {
            if (err) {
              console.log('Error: ' + err)
              res.status(500)
              res.json({
                type: false,
                data: 'Error occured: 500'
              })
              return next()
            }
            res.send(200, entry)
          })
        })
      } else {
        console.log('Error: ' + err)
        res.status(500)
        res.json({
          type: false,
          data: 'Error occured: 500'
        })
      }
    }
    return next()
  })
}

function getCoverFile (req, res, next) {
  var filename = './' + req.params.artist + '_' + req.params.album
  fs.readFile(filename, function (err, data) {
    if (data !== undefined) {
      res.send(200, data)
    } else {
      self.engine.getCover(req.params.artist, req.params.album, function (err, file) {
        if (err) {
          console.log('Error: ' + err)
          res.status(500)
          res.json({
            type: false,
            data: 'Error occured: 500'
          })
          return next()
        }

        console.log(file)
        fs.writeFile(filename, file, function (err) {
          if (err) {
            console.log('Error: ' + err)
            res.status(500)
            res.json({
              type: false,
              data: 'Error occured: 500'
            })
            return next()
          }
          console.log('The file got saved!')
          res.send(200, file)
        })
      })
    }
    return next()
  })
}

var server = restify.createServer()
server.use(restify.queryParser())
server.use(restify.bodyParser())

// Artist
// server.post('/similarArtist', setSA)
server.get('/similarArtist/:artist', getSA)

// Track
server.post('/similarTrack', function create (req, res, next) {
  entryTemp = req.body
  res.send(201, entryTemp)
  return next()
})
server.get('/similarTrack/:titel', getST)

// Cover
server.post('/Cover', function create (req, res, next) {
  entryTemp = req.body
  res.send(201, entryTemp)
  return next()
})
server.get('/Cover/:artist/:album', getCoverFile)

server.listen(8080, '127.0.0.1', function () {
  console.log('%s listening at %s', server.name, server.url)
})
