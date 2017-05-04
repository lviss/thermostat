var config = require('./config');
var temperature_sensor = require('ds18x20');
var gpio = require('rpi-gpio');

var state = {
  max_cycles_per_hour: config.max_cycles_per_hour, 
  range: config.range,
  desired_temperature: 70, // initial temperature 
  mode: 'off', // choices below
  cycle_history: [],
  last_temperature: null,
  modes: [
    'cool',
    'heat',
    'fan',
    'off'
  ],
  relay_pin_config: {
    heat: 11,
    cool: 12,
    fan : 13
  },
  relays: {
    heat: false,
    cool: false,
    fan : false
  },
  get_actual_temperature: function() {
    var sensor_ids = temperature_sensor.list();
    return parseFloat((temperature_sensor.get(sensor_ids[0]) * 9 / 5 + 32).toFixed(1));
  },
  have_reached_maximum_cycles: function(state) {
    var one_hour = 60 * 60 * 1000; /* ms */
    return this.cycle_history.length >= this.max_cycles_per_hour && (new Date) - this.cycle_history[this.max_cycles_per_hour - 1].timestamp < one_hour;
  },
  set_gpio: function(heat, cool, fan) {
    gpio.write(this.relay_pin_config.heat, heat);
    gpio.write(this.relay_pin_config.cool, cool);
    gpio.write(this.relay_pin_config.fan, fan);
    this.relays.heat = heat;
    this.relays.cool = cool;
    this.relays.fan = fan;

    this.cycle_history.unshift({ relays: this.relays, timestamp: new Date });
    if (this.cycle_history.length > this.max_cycles_per_hour) {
      this.cycle_history.pop();
    }

    this.emit();
  }

};

module.exports = state;
