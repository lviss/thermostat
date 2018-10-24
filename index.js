var jsonfile = require('jsonfile');
var gpio = require('rpi-gpio');
var _ = require('lodash');
var state_processor = require('./state_processor');
var config = require('./config');
var state = require('./state');

// set initial relay states
gpio.setup(state.relay_pin_config.heat, gpio.DIR_OUT, function() {
  gpio.write(state.relay_pin_config.heat, state.relays.heat);
});
gpio.setup(state.relay_pin_config.cool, gpio.DIR_OUT, function() {
  gpio.write(state.relay_pin_config.cool, state.relays.cool);
});
gpio.setup(state.relay_pin_config.fan, gpio.DIR_OUT, function() {
  gpio.write(state.relay_pin_config.fan, state.relays.fan);
});

// set up mqtt client
var mqtt = require('mqtt')
var mqttclient  = mqtt.connect('mqtt://server');

mqttclient.on('connect', function() {
  mqttclient.subscribe('devices/thermostat/mode/set');
  mqttclient.subscribe('devices/thermostat/desired_temperature/inc');
  mqttclient.subscribe('devices/thermostat/desired_temperature/dec');
});

mqttclient.on('message', function (topic, message) {
  // message is Buffer
  //console.log(topic);
  //console.log(message.toString());
  if (topic == 'devices/thermostat/mode/set') {
    var mode = message.toString();
    if (state.modes.indexOf(mode) >= 0) {
      state.mode = mode;
      state.emit();
    }
  } else if (topic == 'devices/thermostat/desired_temperature/inc') {
    state.desired_temperature++;
    state.emit();
  } else if (topic == 'devices/thermostat/desired_temperature/dec') {
    state.desired_temperature--
    state.emit();
  }
});

state.emit = function() {
  mqttclient.publish('devices/thermostat/get', JSON.stringify(state), { retain: true });
};

// loop which watches the config and changes the relays accordingly
function check_state() {
  setTimeout(function() {
    state_processor.process(state);
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
