var socket = io();

// EMIT
function setLed(value) {
  var fade = document.getElementById("fade_range").value;
  socket.emit('setLed', {state: value, fade: fade});
}

function rgbLedOff() {
  socket.emit("setRGBLed", {state: false});
}

function sendText() {
  var text = document.getElementById('lcd1').value;
  var text2 = document.getElementById('lcd2').value;
  socket.emit("setLcd", {line1: text, line2: text2});
}

// RGB Led Color Picker
var colorPicker = new iro.ColorPicker("#color-picker-container", {});

colorPicker.on("color:change", function (color, changes) {
  // Prevent emit on picker init.
  if (changes.h && changes.s && changes.v) return;
  socket.emit("setRGBLed", {state: true, color: color.hexString});
});

// Fade Slider
var slider = document.getElementById("fade_range");
var slider_output = document.getElementById("fade_value");
slider_output.innerHTML = slider.value;
slider.oninput = function () {
  slider_output.innerHTML = this.value
};


// BIND CONTROLS
document.getElementById('b_off').onclick = function () {
  setLed(false)
};
document.getElementById('b_on').onclick = function () {
  setLed(true)
};
document.getElementById('send_lcd1').onclick = sendText;

document.getElementById("rbg_led_off").onclick = rgbLedOff;

// SOCKET LISTENERS

socket.on('ledChange', function (data) {
  var status = document.getElementById("b_status");
  if (data.state) {
    status.classList.remove("btn-danger");
    status.classList.add("btn-success");
    status.innerText = "ON";
  } else {
    status.classList.remove("btn-success");
    status.classList.add("btn-danger");
    status.innerText = "OFF";
  }
});

socket.on('rgbLEDChange', function (data) {
  document.getElementById("b_led_rgb_status").innerText = "RGB LED " + (data.state ? "ON" : "OFF");
  document.getElementById("b_led_rgb_status").style.backgroundColor = data.state ? data.color : "buttonface";
});

socket.on('lcdChange', function (data) {
  var newItem = document.createElement("div");
  newItem.classList.add("list-group-item", "flex-column", "align-items-start", "mt-1", "rounded");
  if (data.self) {
    newItem.classList.add("list-group-item-info");
  }

  newItem.insertAdjacentHTML("afterbegin",
    " <div class=\"d-flex w-100 justify-content-between\">" +
    "<p class=\"mb-1\"><strong>Line 1: </strong>" + data.line1 + "</p>" +
    "<small>" + data.time + "</small>" +
    "</div>" +
    "<div class=\"d-flex w-100 justify-content-between\">" +
    "<p class=\"mb-1\"><strong>Line 2: </strong>" + data.line2 + "</p>" +
    "</div>");

  var lcdHistory = document.getElementById("lcdHistory");
  lcdHistory.insertBefore(newItem, lcdHistory.firstChild);
});
