var state_processor = require('./state_processor');
var expect = require('chai').expect;
var sinon = require('sinon');

var generate_test_state = function() {
  return {
    max_cycles_per_hour: 6,
    range: 2,
    desired_temperature: 70,
    mode: 'off',
    cycle_history: [],
    last_temperature: null,
    modes: [
      'cool',
      'heat',
      'fan',
      'off'
    ],
    relay_pin_config: {
      heat: 1,
      cool: 2,
      fan : 3
    },
    relays: {
      heat: false,
      cool: false,
      fan : false
    },
    get_actual_temperature: function() {
      return 70;
    },
    have_reached_maximum_cycles: function(state) {
      var one_hour = 60 * 60 * 1000; /* ms */
      return this.cycle_history.length >= this.max_cycles_per_hour && (new Date) - this.cycle_history[this.max_cycles_per_hour - 1].timestamp < one_hour;
    },
    set_gpio: function(heat, cool, fan) {
      this.relays.heat = heat;
      this.relays.cool = cool;
      this.relays.fan = fan;

      this.cycle_history.unshift({ relays: this.relays, timestamp: new Date });
      if (this.cycle_history.length > this.max_cycles_per_hour) {
        this.cycle_history.pop();
      }

      this.emit();
    }
  }
};

var temp = function(temp) {
  return function() {
    return temp;
  }
};

describe("Temperature Watcher", function() {
  var state;
  beforeEach(function(done) {
    state = generate_test_state();
    state.emit = function() {};
    state.set_gpio = sinon.spy();
    done();
  });

  describe("A/C", function() {
    beforeEach(function(done) {
      state.mode = 'cool';
      done();
    });

    describe("is off", function() {

      it('turns on when too hot', function() {
        state.get_actual_temperature = temp(72); // lowest value that will turn on
        state_processor.process(state);
        sinon.assert.calledWith(state.set_gpio, false, true, true);
        state.get_actual_temperature = temp(80);
        state_processor.process(state);
        expect(state.set_gpio.secondCall.args).to.deep.equal([false, true, true]);
      });

      it('doesn\'t turn on when cold', function() {
        state.get_actual_temperature = temp(71); // highest value that won't turn on
        state_processor.process(state);
        state.get_actual_temperature = temp(60);
        state_processor.process(state);
        sinon.assert.notCalled(state.set_gpio);
      });

      it('doesn\'t turn on when cycled too often', function() {
        state.get_actual_temperature = temp(80);
        state.have_reached_maximum_cycles = function() { return true; };
        state_processor.process(state);
        sinon.assert.notCalled(state.set_gpio);
      });

      it('doesn\'t turn on when within range', function() {
        state.get_actual_temperature = temp(69);
        state_processor.process(state);
        state.get_actual_temperature = temp(70);
        state_processor.process(state);
        state.get_actual_temperature = temp(71);
        state_processor.process(state);
        sinon.assert.notCalled(state.set_gpio);
      });

    });

    describe("is on", function() {
      beforeEach(function(done) {
        state.relays.cool = true;
        done();
      });

      it('turns off when too cold', function() {
        state.get_actual_temperature = temp(60);
        state_processor.process(state);
        sinon.assert.calledWith(state.set_gpio, false, false, false);
      });

      it('doesn\'t turn off when in range', function() {
        state.get_actual_temperature = temp(69);
        state_processor.process(state);
        state.get_actual_temperature = temp(70);
        state_processor.process(state);
        state.get_actual_temperature = temp(71);
        state_processor.process(state);
        sinon.assert.notCalled(state.set_gpio);
      });

      it('doesn\'t turn off when hot', function() {
        state.get_actual_temperature = temp(72); // lowest value that won't turn off
        state_processor.process(state);
        state.get_actual_temperature = temp(80);
        state_processor.process(state);
        sinon.assert.notCalled(state.set_gpio);
      });

    });

  });

  describe("Heater", function() {
    beforeEach(function(done) {
      state.mode = 'heat';
      done();
    });

    describe("is off", function() {

      it('turns on when too cold', function() {
        state.desired_temperature = 80;
        state_processor.process(state);
        sinon.assert.calledWith(state.set_gpio, true, false, true);
      });

      it('doesn\'t turn on when within range', function() {
        state.desired_temperature = 71;
        state_processor.process(state);
        sinon.assert.notCalled(state.set_gpio);
      });

      it('doesn\'t turn on when already hot', function() {
        state.get_actual_temperature = function() { return 79; };
        state_processor.process(state);
        sinon.assert.notCalled(state.set_gpio);
      });

      it('doesn\'t turn on when cycled too often', function() {
        state.desired_temperature = 80;
        state.have_reached_maximum_cycles = function() { return true; };
        state_processor.process(state);
        sinon.assert.notCalled(state.set_gpio);
      });

    });

    describe("is on", function() {
      beforeEach(function(done) {
        state.relays.heat = true;
        done();
      });

      it('turns off when too hot', function() {
        state.get_actual_temperature = function() { return 72; };
        state_processor.process(state);
        sinon.assert.calledWith(state.set_gpio, false, false, false);
      });

      it('doesn\'t turn off when within range', function() {
        state.get_actual_temperature = function() { return 71; };
        state_processor.process(state);
        sinon.assert.notCalled(state.set_gpio);
      });

      it('doesn\'t turn off when cold', function() {
        state.get_actual_temperature = temp(71); // highest value that won't turn off
        state_processor.process(state);
        state.get_actual_temperature = temp(60);
        state_processor.process(state);
        sinon.assert.notCalled(state.set_gpio);
      });

    });

  });

  describe("Off", function() {
    beforeEach(function(done) {
      state.mode = 'off';
      done();
    });

    it('turns off if heat is on', function() {
      state.relays.heat = true;
      state_processor.process(state);
      sinon.assert.calledWith(state.set_gpio, false, false, false);
    });

    it('turns off if cool is on', function() {
      state.relays.cool = true;
      state_processor.process(state);
      sinon.assert.calledWith(state.set_gpio, false, false, false);
    });

    it('does nothing if already off', function() {
      state_processor.process(state);
      sinon.assert.notCalled(state.set_gpio);
    });

  });

});
