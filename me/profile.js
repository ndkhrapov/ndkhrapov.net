const tick=()=>document.querySelector("output").value=new Date().toLocaleTimeString("en-GB",{timeZone:"Asia/Irkutsk"})
tick()
setInterval(tick,1e3)