var process = function(state, io) {
  var actual_temperature = state.get_actual_temperature();
  state.actual_temperature = actual_temperature;
  if (actual_temperature != state.last_temperature) {
    state.emit();
    state.last_temperature = actual_temperature;
  }
  if (state.mode == 'heat') {
    if (state.relays.heat) { // check if it is too hot and we should turn it off
      if (state.desired_temperature <= actual_temperature - state.range) {
        // turn off heater
        state.set_gpio(false, false, false);
      }
    } else { // heat is off, check if it should be turned on.
      if (state.desired_temperature >= actual_temperature + state.range) {
        if (!state.have_reached_maximum_cycles(state)) {
          // turn on heater
          state.set_gpio(true, false, true);
        }
      }
    }
  }
  if (state.mode == 'cool') {
    if (state.relays.cool) { // check if it is too cold and we should turn it off
      if (state.desired_temperature >= actual_temperature + state.range) {
        // turn off cool
        state.set_gpio(false, false, false);
      }
    } else { // cool is off, check if it should be turned on.
      if (state.desired_temperature <= actual_temperature - state.range) {
        if (!state.have_reached_maximum_cycles(state)) {
          // turn on cool
          state.set_gpio(false, true, true);
        }
      }
    }
  }
  if (state.mode == 'off') {
    if (state.relays.cool || state.relays.heat || state.relays.fan) {
        state.set_gpio(false, false, false);
    }
  }
}

module.exports = {
  process: process
}
