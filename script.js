let currentLang = 'ru';

function typeText(el, langKey, speed = 10) {
    const text = el.dataset[langKey];
    el.textContent = '';
    let i = 0;
    function next() {
        if (i < text.length) {
            el.textContent += text[i];
            i++;
            setTimeout(next, speed);
        }
    }
    next();
}

function typeContact(el, langKey, speed = 15) {
    const text = el.dataset[langKey];
    const aTag = el.querySelector('a');
    if (!aTag) {
        el.textContent = '';
        let i = 0;
        function next() {
            if (i < text.length) {
                el.textContent += text[i];
                i++;
                setTimeout(next, speed);
            }
        }
        next();
        return;
    }

    const marker = '#〔🎫〕tickets';
    const markerIndex = text.indexOf(marker);
    if (markerIndex === -1) {
        el.innerHTML = '';
        let i = 0;
        function next() {
            if (i < text.length) {
                el.appendChild(document.createTextNode(text[i]));
                i++;
                setTimeout(next, speed);
            }
        }
        next();
        return;
    }

    const beforeLink = text.slice(0, markerIndex);
    const afterLink = text.slice(markerIndex + marker.length);

    el.innerHTML = '';
    let i = 0;
    function typeBefore() {
        if (i < beforeLink.length) {
            el.appendChild(document.createTextNode(beforeLink[i]));
            i++;
            setTimeout(typeBefore, speed);
        } else {
            el.innerHTML += aTag.outerHTML;
            typeAfter();
        }
    }

    let j = 0;
    function typeAfter() {
        if (j < afterLink.length) {
            el.appendChild(document.createTextNode(afterLink[j]));
            j++;
            setTimeout(typeAfter, speed);
        }
    }

    typeBefore();
}

function setLanguage(lang) {
    currentLang = lang;

    const fadeElements = [...document.querySelectorAll('.fade-text')];
    const skillElements = [...document.querySelectorAll('.skill')];
    const contactElements = [...document.querySelectorAll('.contact-chip p')];
    const linkElements = [...document.querySelectorAll('.links a')];

    [...fadeElements, ...skillElements, ...linkElements].forEach(el => el.classList.add('text-hide'));
    contactElements.forEach(el => el.classList.add('text-hide'));

    setTimeout(() => {
        fadeElements.forEach((el,i)=>{
            el.textContent = el.dataset[lang];
            setTimeout(()=>el.classList.remove('text-hide'), i*30);
        });

        skillElements.forEach((el,i)=>{
            setTimeout(()=>{
                el.classList.remove('text-hide');
                typeText(el, lang, 10);
            }, i*80);
        });

        contactElements.forEach((el,i)=>{
            setTimeout(()=>{
                el.classList.remove('text-hide');
                typeContact(el, lang, 15);
            }, i*120);
        });

        linkElements.forEach((el,i)=>{
            el.textContent = el.dataset[lang];
            setTimeout(()=>el.classList.remove('text-hide'), i*30);
        });

    }, 300);
}

document.querySelector('h1').textContent = 'Novogrey';

setLanguage('ru');

const c=document.getElementById('bg'),ctx=c.getContext('2d');
function resize(){c.width=innerWidth;c.height=innerHeight;}
resize(); addEventListener('resize',resize);
const lines=Array.from({length:40},()=>({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.4}));
function draw(){ctx.clearRect(0,0,c.width,c.height);ctx.strokeStyle='rgba(255,255,255,0.15)';lines.forEach(l=>{l.x+=l.vx;l.y+=l.vy;if(l.x<0||l.x>c.width)l.vx*=-1;if(l.y<0||l.y>c.height)l.vy*=-1;ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(l.x+l.vx*40,l.y+l.vy*40);ctx.stroke();});requestAnimationFrame(draw);}
draw();
