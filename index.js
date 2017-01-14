var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var jsonfile = require('jsonfile');
var _ = require('lodash');
var state_processor = require('./state_processor');
var config = require('./config');
var state = require('./state');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

state.emit = function() {
  io.emit('state', state);
};

io.on('connection', function(socket){
  socket.emit('state', state);
  socket.on('set state', function(new_state){
    new_state.desired_temperature = parseInt(new_state.desired_temperature);
    
    // validation
    if (!isNaN(new_state.desired_temperature) && state.modes.indexOf(new_state.mode) >= 0) {
      state.desired_temperature = new_state.desired_temperature;
      state.mode = new_state.mode;
      io.emit('state', state);
    } else {
      socket.emit('state', state);
    }
  });
});

// loop which watches the config and changes the relays accordingly
function check_state() {
  setTimeout(function() {
    state_processor.process(state, io);
    check_state(); // schedule this to happen again
  }, 5000);
};

// load initial data from cache files, then start monitoring temp/relays
jsonfile.readFile(config.cache_file, function(err, cached_state) {
  if (!err)
    _.assign(state, cached_state); // we have to merge the date because 'state' has functions that would be overwritten
  check_state();
});

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) {
      jsonfile.writeFileSync(config.cache_file, state);
      console.log('saved.');
    }
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

http.listen(3000, function(){
  console.log('listening on *:3000');
});
