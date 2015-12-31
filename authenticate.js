var process = require('process')
var nacl = require('tweetnacl')
var uid = require('uid')
var storage = require('node-persist')

// Initialize node persist storage
storage.initSync({dir: __dirname + '/store'})
var authenticatedUsers = storage.getItem('authenticatedUsers') || {}

// Load arguments from command line
var command = process.argv[2]
var parameter = process.argv.slice(3, process.argv.length).join(' ')
console.log('')

// Switch based on the command
switch (command) {
  case 'add':
    addUser(parameter)
    break
  case 'list':
    listUsers()
    break
  case 'remove':
    removeUser(parameter)
    break
  default:
    showHelp()
    break
}

// If no command is set, just print the help
function showHelp () {
  console.log('Command line utility to authenticate a user for the node scraping server')
  console.log('\nUsage:\n')
  console.log('- Add a new user:\n  node authenticate.js add <description of user>\n')
  console.log('- List all authenticated users:\n  node authenticate.js list\n')
  console.log('- Remove a user:\n  node authenticate.js remove <id of user>\n')
}

// Add a new user with the given description
function addUser (description) {
  console.log('> Adding user with description "' + description + '"')

  // Generate the id and the keypair
  var id = uid(20)
  var keyPair = nacl.sign.keyPair()
  keyPair.publicKey = nacl.util.encodeBase64(keyPair.publicKey)
  keyPair.secretKey = nacl.util.encodeBase64(keyPair.secretKey)

  // Save it in the storage
  authenticatedUsers[id] = {
    description: description,
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey
  }
  storage.setItem('authenticatedUsers', authenticatedUsers)

  // Print some information about the usage
  console.log('> Unique ID: ' + id)
  console.log('> Public Key: ' + keyPair.publicKey)
  console.log('> Secret Key: ' + keyPair.secretKey)

  console.log('\nPlease share the following link over a secure channel with')
  console.log('the user you wish to authenticate. It can get added in the')
  console.log('Manage -> Servers section of the client application.\n')

  console.log(url(id, keyPair.secretKey))
  console.log('')
}

// Generate a url out of a ID and a secret key
function url (id, secret) {
  return 'peermusic://localhost:8080/#' + id + ':' + secret
}

// List all currently authenticated users
function listUsers () {
  for (var id in authenticatedUsers) {
    var user = authenticatedUsers[id]
    console.log('> Description: ' + user.description)
    console.log('> Unique ID: ' + id)
    console.log('> Public Key: ' + user.publicKey)
    console.log('> Secret Key: ' + user.secretKey)
    console.log('> Authentication URL: ' + url(id, user.secretKey))
    console.log('')
  }
}

// Remove a single user by ID
function removeUser (id) {
  if (!authenticatedUsers[id]) {
    console.log('User with ID "' + id + '" not found.' + '\n')
    return
  }

  delete authenticatedUsers[id]
  storage.setItem('authenticatedUsers', authenticatedUsers)
  console.log('Removed user with ID "' + id + '"' + '\n')
}
