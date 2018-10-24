# thermostat
Headless client for a raspberry pi controlling heat/ac via MQTT & gpio

Parts list:
- [raspberry pi zero](https://www.adafruit.com/product/2885) - $5, sdcard, power cable
- [Digital Temperature Sensor](https://www.sparkfun.com/products/245 "DS18B20") - $4
- [24V AC Solid State Relay Board](http://makeatronics.blogspot.com/2013/06/24v-ac-solid-state-relay-board.html) - $22 (fully populated, else $8)

The raspberry pi doesn't let any user besides root write to GPIO so when running the site, do it as root. *cringe*

To get up and running:
 
```bash
npm install
node index.js
```

To run it with a [process manager](https://github.com/Unitech/pm2 "pm2") and start on boot:

```bash
npm install -g pm2
# -i 1 because socket.io isn't stateless, we can only have 1 instance.
pm2 start index.js -i 1 --name thermostat
pm2 startup
pm2 save
```

To run unit tests:
```bash
npm install -g mocha
npm test
```
