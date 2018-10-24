var config = {};

config.cache_file = 'cache.json';
config.max_cycles_per_hour = 6;
config.range = 2;

config.mqtt = {}
config.mqtt.topic = 'devices/thermostat';
config.mqtt.host = 'mqtt://hostnameOrIP';

module.exports = config;
