var express = require('express');
var app = express();
var moment = require("moment");
var io = require('socket.io')(app.listen(process.env.PORT || 9999));
var five = require("johnny-five");

app.use(express.static(__dirname + "/resources"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var board = new five.Board({repl: false});
var ledState, rgb_state = false;
var led, led_2, rgb_led, lcd;
var rgb_color;

board.on('ready', function () {
  led = new five.Led(4);
  led_2 = new five.Led(10);
  rgb_led = new five.Led.RGB({pins : {blue: 7, red: 12, green : 11}});
  lcd = new five.LCD({pins: [8, 9, 44, 45, 46, 47]});

  io.on('connection', function (socket) {
    socket.on('setLed', function (data) {
      setLed(socket, data);
    });

    socket.on('setLcd', function (data) {
      setLCD(socket, data);
    });

    socket.on('setRGBLed', function (data) {
      setRGBLed(socket, data);
    });

    socket.emit('ledChange', {state: ledState});
    socket.emit("rgbLEDChange", {state: rgb_state, color: rgb_color});
  });
});

function setLCD(socket, data) {
  lcd.clear().cursor(0, 0).print(data.line1).cursor(1, 0).print(data.line2);
  var r = {self: false, line1: data.line1, line2: data.line2, time: moment().format("hh:mm:ss A")};
  socket.broadcast.emit("lcdChange", r);
  r.self = true;
  socket.emit('lcdChange', r);
}

function setLed(socket, data) {
  var fadeValue = data.fade;
  ledState = data.state;
  if (fadeValue > 0) {
    if (ledState) {
      led.fadeIn(fadeValue, function () {
        led_2.fadeIn(fadeValue, function () {
          broadcastLedChange(socket, ledState);
        });
      });
    } else {
      led.fadeOut(fadeValue, function () {
        led_2.fadeOut(fadeValue, function () {
          broadcastLedChange(socket, ledState);
        });
      });
    }
  } else {
    if (ledState) {
      led.on();
      led_2.on()
    } else {
      led.off();
      led_2.off()
    }
    broadcastLedChange(socket, ledState);
  }
}

function broadcastLedChange(socket, value) {
  socket.broadcast.emit("ledChange", {state: value});
  socket.emit("ledChange", {state: value});
}

function setRGBLed(socket, data) {
  rgb_state = data.state;
  var r = {state: rgb_state};
  if (rgb_state) {
    rgb_color = data.color;
    rgb_led.color(rgb_color);
    r.color = rgb_color;
  } else {
    rgb_color = undefined;
    rgb_led.off();
  }
  socket.broadcast.emit("rgbLEDChange", r);
  socket.emit("rgbLEDChange", r);
}
