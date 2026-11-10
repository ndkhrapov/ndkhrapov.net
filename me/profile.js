const clock = document.getElementById("clock");
const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Irkutsk",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function tick() {
  const time = clockFormat.format(new Date());
  clock.dateTime = time;
  clock.textContent = time;
}

tick();
setInterval(tick, 1000);
