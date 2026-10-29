const $ = (s, r = document) => r.querySelector(s)
const esc = (s) =>
    String(s || '').replace(
        /[&<>"]/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
    )
const txt = (t) =>
    String(t || '')
        .trim()
        .split(/\n\s*\n/)
        .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
        .join('')
const LS = {
    get: (k) => {
        try {
            return localStorage.getItem(k)
        } catch (e) {
            return null
        }
    },
    set: (k, v) => {
        try {
            localStorage.setItem(k, v)
        } catch (e) {}
    },
}
const page = document.body.dataset.page,
    L = $('#list')
const pages = [
    ['index', 'Главная'],
    ['pictures', 'Рисунки'],
    ['poems', 'Стихи'],
    ['stories', 'Рассказы'],
    ['tales', 'Сказки'],
    ['moments', 'Моменты'],
    ['radio', 'Радио'],
]
document.body.insertAdjacentHTML(
    'afterbegin',
    `<nav class="nav">${pages.map(([p, t]) => `<a href="${p}.html" class="${p == page ? 'on' : ''}">${t}</a>`).join('')}</nav>`,
)

let ov
function reader(html, cls = '') {
    if (!ov) {
        ov = document.createElement('div')
        ov.className = 'ov'
        ov.onclick = (e) => {
            if (e.target === ov) closeR()
        }
        document.body.appendChild(ov)
        document.addEventListener(
            'keydown',
            (e) => e.key == 'Escape' && closeR(),
        )
    }
    ov.innerHTML = `<button class="x" aria-label="Закрыть">✕</button><div class="ov-in ${cls}">${html}</div>`
    $('.x', ov).onclick = closeR
    ov.classList.add('show')
    document.body.style.overflow = 'hidden'
    ov.scrollTop = 0
    return $('.ov-in', ov)
}
function closeR() {
    if (!ov) return
    ov.querySelectorAll('audio').forEach((a) => a.pause())
    ov.classList.remove('show')
    ov.innerHTML = ''
    document.body.style.overflow = ''
}

const pal = ['#1f4a5c', '#3d2a5c', '#24502f', '#5c3b1f', '#4a2030']
function books(list) {
    let items
    const render = () => {
        items = list
            .map((b) => ({ ...b, lock: !!b.locked && !LS.get('shefUnlocked') }))
            .sort((a, b) => a.lock - b.lock)
        L.className = 'shelf'
        L.innerHTML = items
            .map(
                (b, i) =>
                    `<button class="book${b.lock ? ' locked' : ''}" style="--c:${b.color || pal[i % pal.length]}" data-i="${i}"><span class="pg"></span><span class="cv">${b.lock ? '<em>🔒</em>' : ''}${esc(b.title)}${b.lock ? '<b>18+</b>' : ''}${b.audio ? '<small>🎧</small>' : ''}</span></button>`,
            )
            .join('')
    }
    render()
    L.onclick = (e) => {
        const k = e.target.closest('.book')
        if (!k) return
        const b = items[k.dataset.i]
        if (b.lock) return quest(() => render())
        k.classList.add('open')
        setTimeout(() => {
            k.classList.remove('open')
            reader(
                `<h2>${esc(b.title)}</h2>${b.audio ? `<div class="player">🎧 Послушать<audio controls preload="none" src="${esc(b.audio)}"></audio></div>` : ''}${txt(b.text)}`,
                'paper book-open',
            )
        }, 650)
    }
}

function quest(onUnlock) {
    const Q = SITE.quest
    let i = +LS.get('shefQ') || 0
    const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').trim()
    const step = () => {
        if (i >= Q.length) {
            LS.set('shefUnlocked', '1')
            if (onUnlock) onUnlock()
            reader(
                `<h2>🔓 Печать снята!</h2><p>Ты прошёл весь квест.</p><button class="btn" onclick="closeR()">Открыть рассказ</button>`,
                'quest',
            )
            return
        }
        const s = Q[i]
        reader(
            `<h2>Печать ${i + 1} из ${Q.length}</h2><div class="bar"><i style="width:${(i / Q.length) * 100}%"></i></div><p>${esc(s.q)}</p><input id="qa" placeholder="Твой ответ" autocomplete="off"><br><button class="btn" id="qb">Проверить</button> <button class="btn ghost" id="qh">Подсказка</button><p id="qm"></p>`,
            'quest',
        )
        const go = () => {
            if (s.a.some((a) => norm(a) == norm($('#qa').value))) {
                i++
                LS.set('shefQ', i)
                step()
            } else {
                $('#qm').textContent = 'Не то... попробуй ещё.'
                $('#qa').classList.add('bad')
                setTimeout(() => $('#qa').classList.remove('bad'), 400)
            }
        }
        $('#qb').onclick = go
        $('#qa').onkeydown = (e) => {
            if (e.key == 'Enter') go()
        }
        $('#qh').onclick = () =>
            ($('#qm').textContent = '💡 ' + (s.hint || 'Подсказки нет'))
    }
    step()
}

const R = {
    index() {
        const a = SITE.avatars
        const arrowsData = [
            { a: -90, w: 52, h: 5, hw: 14, gap: 14, pulse: 10, del: 0 },
            { a: -60, w: 28, h: 3, hw: 9, gap: 22, pulse: 7, del: 0.25 },
            { a: -30, w: 62, h: 6, hw: 16, gap: 10, pulse: 12, del: 0.5 },
            { a: 0, w: 36, h: 4, hw: 11, gap: 20, pulse: 8, del: 0.15 },
            { a: 30, w: 55, h: 5, hw: 15, gap: 12, pulse: 11, del: 0.65 },
            { a: 60, w: 30, h: 3, hw: 10, gap: 24, pulse: 7, del: 0.35 },
            { a: 90, w: 48, h: 5, hw: 13, gap: 15, pulse: 9, del: 0.8 },
            { a: 120, w: 26, h: 3, hw: 8, gap: 25, pulse: 6, del: 0.2 },
            { a: 150, w: 64, h: 6, hw: 17, gap: 10, pulse: 12, del: 0.45 },
            { a: 180, w: 40, h: 4, hw: 12, gap: 18, pulse: 9, del: 0.1 },
            { a: 210, w: 58, h: 5, hw: 15, gap: 12, pulse: 11, del: 0.7 },
            { a: 240, w: 32, h: 4, hw: 10, gap: 22, pulse: 8, del: 0.4 },
        ]
        const arrowsHtml = `<div class="arrows-ring">${arrowsData.map((d) => `<b class="arrow" style="--a:${d.a}deg;--w:${d.w}px;--h:${d.h}px;--hw:${d.hw}px;--gap:${d.gap}px;--pulse:${d.pulse}px;--del:${d.del}s"></b>`).join('')}</div>`
        $('#hero').innerHTML =
            arrowsHtml +
            `<div class="av">${a.map((s, i) => `<img src="${esc(s)}" class="${i ? '' : 'on'}" alt="Шеф">`).join('')}</div>`
        let n = 0
        const im = document.querySelectorAll('.av img')
        if (im.length > 0) {
            setInterval(() => {
                im[n].classList.remove('on')
                n = (n + 1) % im.length
                im[n].classList.add('on')
            }, 3500)
        }
        $('#heart').onclick = (e) => {
            e.target.textContent = SITE.secret
        }
    },
    pictures() {
        L.className = 'pictures'
        L.innerHTML = SITE.pictures
            .map(
                (p, i) =>
                    `<figure class="frame" data-i="${i}"><i></i><i></i><i></i><i></i><img src="${esc(p.src)}" alt="${esc(p.title)}" loading="lazy"><figcaption>${esc(p.title)}${p.subtitle ? `<br><small class="sub">${esc(p.subtitle)}</small>` : ''}</figcaption></figure>`,
            )
            .join('')
        L.onclick = (e) => {
            const f = e.target.closest('.frame')
            if (f) {
                const p = SITE.pictures[f.dataset.i]
                reader(
                    `<img class="full" src="${esc(p.src)}" alt=""><p class="cap">${esc(p.title)}${p.subtitle ? `<br><small>${esc(p.subtitle)}</small>` : ''}</p>`,
                    'pic',
                )
            }
        }
    },
    poems() {
        L.className = 'shelf'
        L.innerHTML = SITE.poems
            .map(
                (p, i) =>
                    `<button class="sheet" data-i="${i}"><span>${esc(p.title)}</span></button>`,
            )
            .join('')
        L.onclick = (e) => {
            const s = e.target.closest('.sheet')
            if (s) {
                const p = SITE.poems[s.dataset.i]
                reader(`<h2>${esc(p.title)}</h2>${txt(p.text)}`, 'paper poem')
            }
        }
    },
    stories() {
        books(SITE.stories)
    },
    tales() {
        books(SITE.tales)
    },
    moments() {
        L.className = 'shelf'
        L.innerHTML = SITE.moments
            .map(
                (m, i) =>
                    `<figure class="pol" data-i="${i}">${m.src ? `<img src="${esc(m.src)}" alt="" loading="lazy">` : ''}<figcaption>${esc(m.text)}<small>${esc(m.date)}</small></figcaption></figure>`,
            )
            .join('')
        L.onclick = (e) => {
            const f = e.target.closest('.pol')
            if (f) {
                const m = SITE.moments[f.dataset.i]
                if (m.src) {
                    reader(
                        `<img class="full" src="${esc(m.src)}" alt=""><p class="cap">${esc(m.text)} <small>${esc(m.date)}</small></p>`,
                        'pic',
                    )
                } else {
                    reader(
                        `<h2>Памятный момент</h2><p class="radio-meta">📅 ${esc(m.date)}</p><div style="font-size:20px;line-height:1.6;white-space:pre-line;color:#33260f;">${esc(m.text)}</div>`,
                        'paper',
                    )
                }
            }
        }
    },
    radio() {
        L.className = 'shelf'
        L.innerHTML = SITE.radio
            .map(
                (r, i) =>
                    `<div class="radio-card" data-i="${i}"><div class="badge">${r.audio ? '🎙️ С озвучкой' : '📻 Радиовыпуск'}</div><h4>${esc(r.title)}</h4><div class="radio-date">📅 ${esc(r.date)}</div></div>`,
            )
            .join('')
        L.onclick = (e) => {
            const c = e.target.closest('.radio-card')
            if (!c) return
            const r = SITE.radio[c.dataset.i]
            const audioHtml = r.audio
                ? `<div class="player">🎙️ Озвучка Шефа (${esc(r.audioTitle || 'Запись')})<audio controls preload="none" src="${esc(r.audio)}"><source src="${esc(r.audio)}"></audio></div>`
                : ''
            reader(
                `<h2>${esc(r.title)}</h2><p class="radio-meta">📅 <b>Дата эфира:</b> ${esc(r.date)} • <b>Студия:</b> StudioShef</p>${audioHtml}${txt(r.text)}`,
                'paper radio-text',
            )
        }
    },
}
R[page]()
