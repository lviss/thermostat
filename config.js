var config = {};

/* 
  this is the name of a file that will be created that will 
  save the state of the thermostat between runs. It saves
  things like the desired temperature and the mode. 
*/
config.cache_file = 'cache.json';
/*
  setting this to 6 means that the AC/Heater won't turn on
  and off more than 6 times per hour. This is intended to
  reduce the wear and tear on the HVAC system.
*/
config.max_cycles_per_hour = 6;
/*
  setting this to 2 means that the temperature will be allowed
  to vary 2 degrees in either direction of the desired
  temperature. So if you set the thermostat to 80 degrees on 
  cool, it will cool to 78 degrees and then turn off until 
  the temperature reaches 82 degrees.
*/
config.range = 2;
/*
  this setting allows you to calibrate the temperature
  sensor. If the sensor reads 80 and this is set to -5, the
  software will read the temperature as 75.
*/
config.temperature_sensor_calibration = 0;

/*
  MQTT connection information
*/
config.mqtt = {}
config.mqtt.topic = 'devices/thermostat';
config.mqtt.host = 'mqtt://hostnameOrIP';

module.exports = config;
