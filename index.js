// const video = document.querySelector("video");
const can = document.querySelector("canvas");
const ctx = can.getContext('2d');

const loading = document.querySelector(".loading")
const er = document.querySelector(".loading span")
const prog = document.querySelector(".loading progress")

const w = 1092;
const h = 1080;

const m = {
  prevY: 0,
  realY: 0,
  realX: 0,
  curY: 0,
}

const frameCount = 250;
const frames = new Array(frameCount);

const b = {
  top: 0.05,
  bottom: 0.535 - 0.05,
}

/*
hit 1 lift  = 28

fall  = 16
hit 1 = 23
fall  = 36 
hit 2 = 41
fall  = 55
hit 3 = 59
fall  = 76
hit 4 = 80

*/

const keyframes = [
  0, 16, 23, 36, 41, 55, 59, 76, 80, frameCount - 1
]
let curFrame = 0;
let loaded = 0;

const preload = async () => {
  let promises = [];
  for (let i = 0; i < frameCount; i++) {
    if(frames[i] != null) continue;
    promises.push(new Promise((res, rej) => {
      const img = new Image();
      img.src = `frames/frames${('000' + (i + 1)).slice(-4)}.jpg`;
      frames[i] = img;
      img.onload = () => {
        loaded++;
        prog.value = loaded;
        prog.max = frameCount;
        res()
      }
      img.onerror = (e) => { 
        frames[i] = null;
        rej();
       }
    }))
  }
  await Promise.all(promises);
}

document.addEventListener("touchmove", (e) => {
  // console.log(e.changedTouches[0])
  // e.preventDefault();
  m.realX = e.changedTouches[0].pageX;
  m.realY = e.changedTouches[0].pageY;
}, true)

document.addEventListener("mousemove", (e) => {
  m.realX = e.layerX;
  m.realY = e.layerY;
})

document.addEventListener("mousedown", (e) => {
  m.clicked = true;
})

const remap = (num) => {
  return Math.max(0, Math.min(1, (num / (b.bottom - b.top)) - (b.top * 2)))
}
const lerp = (a, b, t) => {
  return b * t + a * (1 - t);
}
const checkBounds = (mx, my, x, y, w, h) => {
  return mx >= x && mx <= x+w && my >= y && my <= y + h;
}

const popupI = new Image()
popupI.src = "popup.png";

const acceptar = new Image()
acceptar.src = "acceptar.png";

let popup = true;

let f = 0;
let time = 0;
let oncer = true;
let startTimer = 0;
const d = (now) => {
  window.requestAnimationFrame(d);
  m.curY = lerp(m.curY, m.realY, 0.5);

  if (popup) {
    ctx.drawImage(frames[0], 0, 0, can.width, can.height);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, can.width, can.height);
    const popupAspect = popupI.height / popupI.width;
    const acceptarAspect = acceptar.height / acceptar.width;
    const pw = can.width * 0.9;
    const ph = pw * popupAspect;

    const px = (can.width / 2) - (pw / 2);
    const py = (can.height - ph * 1.3);

    ctx.drawImage(popupI, px, py, pw, ph);
    const ax = px + pw*0.815
    const ay = py + ph*0.77
    const aw = pw * (acceptar.width / popupI.width);
    const ah = aw * acceptarAspect;
    const ahm = ah*0.5;
    const awm = aw*0.1;
    if(checkBounds(m.realX, m.realY, ax-awm, ay-ahm, aw+awm*2, ah+ahm*2)) {
      ctx.fillStyle = "#2b2b2b";
      if(m.clicked) {
        popup = false;
      }
    } else {
      ctx.fillStyle = "#303030";
    }
    m.clicked = false;
    ctx.fillRect(ax-awm, ay-ahm, aw+awm*2, ah+ahm*2);
    ctx.drawImage(acceptar, ax, ay, aw, ah)
    return;
  }

  if (curFrame == 8) {
    if (oncer) startTimer = now;
    oncer = false;
    let fra = Math.floor(keyframes[curFrame] + ((now - startTimer) / (1000 / 30)));
    if (fra >= frameCount) return;
    ctx.drawImage(frames[fra], 0, 0, can.width, can.height);
    return;
  }
  // if (Math.abs(m.prevY - m.curY) > (can.height * 0.15)) return;
  // video.currentTime = ((m.curY / window.innerHeight) * video.duration);
  let rawA = remap((m.curY / can.height));

  // if(curFrame >= keyframes.length - 2) return;

  let a = rawA;
  let oddFrame = curFrame % 2 == 0;
  if (oddFrame) {
    if (rawA <= 0 && curFrame < 8) {
      curFrame++;
      console.log("transition")
      return;
    }
    a = 1 - rawA;
  } else if (rawA >= 1 && curFrame < 8) {
    curFrame++;
    console.log("transition")
    return;
  }


  f = keyframes[curFrame] + (a * (keyframes[curFrame + 1] - keyframes[curFrame]));
  // }
  ctx.drawImage(frames[Math.floor(f)], 0, 0, can.width, can.height);
  // ctx.clearRect(0, 0, can.width, can.height);

  // ctx.fillText(rawA, 0, 10);
  // ctx.fillText(f, 0, 20);

  // ctx.fillStyle = "blue";
  // ctx.fillRect(0, can.height * b.top, 100, 1);
  // ctx.fillStyle = "red";
  // ctx.fillRect(0, can.height * b.bottom, 100, 1);

  // ctx.fillRect(m.realX, m.realY, 10, 10)

  m.prevY = m.realY

}
preload().then(() => {
  loading.className = "loading done";
  window.requestAnimationFrame(d)
}).catch(() => {
  er.innerHTML = `Failed to load.`;
})

const resize = () => {
  if(window.innerWidth < window.innerHeight) {
    can.width = window.innerWidth;
    can.height = (h / w) * can.width;
  } else {
    can.height = window.innerHeight;
    can.width = (w / h) * can.height;
  }
}
window.addEventListener("resize", resize);
resize();

window.onunload = () => {
  for(let i = 0; i < frameCount; i++) {
    frames[i] = null;
  }
}