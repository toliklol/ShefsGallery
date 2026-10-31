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

/* Звуковые эффекты через Web Audio API */
const Sound = {
    ctx: null,
    muted: LS.get('shef_muted') === '1',
    init() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AC = window.AudioContext || window.webkitAudioContext
            this.ctx = new AC()
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume()
        }
    },
    toggle() {
        this.muted = !this.muted
        LS.set('shef_muted', this.muted ? '1' : '0')
        this.updateBtn()
        if (!this.muted) this.click()
    },
    updateBtn() {
        const btn = $('#sound-btn')
        if (btn) {
            btn.textContent = this.muted ? '🔇' : '🔊'
            btn.title = this.muted
                ? 'Включить звуки интерфейса'
                : 'Выключить звуки интерфейса'
        }
    },
    play(freq, type = 'sine', duration = 0.08, gainVal = 0.08) {
        if (this.muted) return
        try {
            this.init()
            if (!this.ctx) return
            const osc = this.ctx.createOscillator()
            const gain = this.ctx.createGain()
            osc.type = type
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                this.ctx.currentTime + duration,
            )
            osc.connect(gain)
            gain.connect(this.ctx.destination)
            osc.start()
            osc.stop(this.ctx.currentTime + duration)
        } catch (e) {}
    },
    click() {
        this.play(600, 'triangle', 0.04, 0.05)
    },
    paper() {
        this.play(340, 'sine', 0.09, 0.06)
    },
    swish() {
        this.play(480, 'triangle', 0.06, 0.04)
    },
    pop() {
        this.play(750, 'sine', 0.07, 0.09)
    },
    fanfare() {
        if (this.muted) return
        ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            setTimeout(() => this.play(f, 'triangle', 0.18, 0.12), i * 110)
        })
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

// Кнопка включения/выключения звуков
document.body.insertAdjacentHTML(
    'beforeend',
    `<button class="sound-toggle" id="sound-btn" aria-label="Звуки">${Sound.muted ? '🔇' : '🔊'}</button>`,
)
$('#sound-btn').onclick = (e) => {
    e.stopPropagation()
    Sound.toggle()
}

// Глобальные тихие клики по навигационным ссылкам и кнопкам
document.addEventListener('click', (e) => {
    Sound.init()
    const target = e.target.closest(
        'a, button, .frame, .sheet, .pol, .radio-card, .book',
    )
    if (target && !target.classList.contains('sound-toggle')) {
        Sound.click()
    }
})

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
    Sound.paper()
    return $('.ov-in', ov)
}
function closeR() {
    if (!ov) return
    ov.querySelectorAll('audio').forEach((a) => a.pause())
    ov.classList.remove('show')
    ov.innerHTML = ''
    document.body.style.overflow = ''
}

/* Просмотр галереи с кнопками Вперёд/Назад, свайпом на мобилках и стрелками клавиатуры */
let curPicIdx = 0
function openGallery(idx) {
    curPicIdx = idx
    const renderPic = () => {
        const p = SITE.pictures[curPicIdx]
        const total = SITE.pictures.length
        const box = reader(
            `
            <button class="gallery-nav prev" id="g-prev" aria-label="Предыдущий">❮</button>
            <button class="gallery-nav next" id="g-next" aria-label="Следующий">❯</button>
            <img class="full" src="${esc(p.src)}" alt="" id="g-img">
            <p class="cap" id="g-cap">${esc(p.title)}${p.subtitle ? `<br><small>${esc(p.subtitle)}</small>` : ''}</p>
            <div class="gallery-counter">${curPicIdx + 1} из ${total} (Листайте свайпом или ← →)</div>
            `,
            'pic',
        )

        $('#g-prev', ov).onclick = (e) => {
            e.stopPropagation()
            prevPic()
        }
        $('#g-next', ov).onclick = (e) => {
            e.stopPropagation()
            nextPic()
        }

        // Поддержка свайпов на тач-устройствах
        let startX = 0
        let startY = 0
        const imgEl = $('#g-img', ov)
        if (imgEl) {
            imgEl.ontouchstart = (e) => {
                startX = e.changedTouches[0].screenX
                startY = e.changedTouches[0].screenY
            }
            imgEl.ontouchend = (e) => {
                const diffX = e.changedTouches[0].screenX - startX
                const diffY = e.changedTouches[0].screenY - startY
                if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX < 0) nextPic()
                    else prevPic()
                }
            }
        }
    }

    const nextPic = () => {
        curPicIdx = (curPicIdx + 1) % SITE.pictures.length
        Sound.swish()
        renderPic()
    }
    const prevPic = () => {
        curPicIdx =
            (curPicIdx - 1 + SITE.pictures.length) % SITE.pictures.length
        Sound.swish()
        renderPic()
    }

    renderPic()

    // Слушатель стрелочек клавиатуры
    const keyHandler = (e) => {
        if (!ov || !ov.classList.contains('show')) {
            document.removeEventListener('keydown', keyHandler)
            return
        }
        if (e.key === 'ArrowRight') nextPic()
        if (e.key === 'ArrowLeft') prevPic()
    }
    document.addEventListener('keydown', keyHandler)
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
        Sound.paper()
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
    if (i >= Q.length) i = 0
    const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').trim()
    const step = () => {
        if (i >= Q.length) {
            LS.set('shefUnlocked', '1')
            if (onUnlock) onUnlock()
            Sound.fanfare()
            reader(
                `<h2>🔓 Печать снята!</h2><p>Ты прошёл весь квест.</p><button class="btn" onclick="closeR()">Закрыть</button> <button class="btn ghost" id="qr-again">Пройти заново 🔄</button>`,
                'quest',
            )
            const replayBtn = $('#qr-again')
            if (replayBtn) {
                replayBtn.onclick = () => {
                    LS.set('shefQ', 0)
                    LS.set('shefUnlocked', '')
                    i = 0
                    step()
                }
            }
            return
        }
        const s = Q[i]
        const mediaHtml = s.img
            ? `<div class="quest-media"><img src="${esc(s.img)}" alt="Загадка" class="quest-img"></div>`
            : s.html
              ? `<div class="quest-media">${s.html}</div>`
              : ''
        const stepsNav = Q.map(
            (_, idx) =>
                `<button class="q-dot${idx === i ? ' cur' : idx < i ? ' done' : ''}" data-step="${idx}" title="Печать ${idx + 1}">${idx + 1}</button>`,
        ).join('')
        reader(
            `
            <div class="quest-head">
                <h2>Печать ${i + 1} из ${Q.length}</h2>
                <button class="quest-reset" id="q-reset-btn" title="Сбросить прогресс на начало">🔄</button>
            </div>
            <div class="quest-nav-dots">${stepsNav}</div>
            <div class="bar"><i style="width:${((i + 1) / Q.length) * 100}%"></i></div>
            <p class="quest-q">${esc(s.q)}</p>
            ${mediaHtml}
            <input id="qa" placeholder="Твой ответ" autocomplete="off"><br>
            <button class="btn" id="qb">Проверить</button> <button class="btn ghost" id="qh">Подсказка</button>
            <p id="qm"></p>
            `,
            'quest',
        )
        const dots = ov.querySelectorAll('.q-dot')
        dots.forEach((dot) => {
            dot.onclick = () => {
                i = +dot.dataset.step
                Sound.paper()
                step()
            }
        })
        const resetBtn = $('#q-reset-btn')
        if (resetBtn) {
            resetBtn.onclick = () => {
                LS.set('shefQ', 0)
                LS.set('shefUnlocked', '')
                i = 0
                Sound.paper()
                step()
            }
        }
        const go = () => {
            const val = $('#qa').value.trim()
            const isAccepted =
                i === 1 || (!s.a || s.a.length === 0)
                    ? val.length >= 3
                    : s.a.some((a) => norm(a) == norm($('#qa').value))

            if (isAccepted) {
                i++
                LS.set('shefQ', i)
                Sound.pop()
                step()
            } else {
                $('#qm').textContent =
                    (i === 1 || (!s.a || s.a.length === 0)) && val.length < 3
                        ? 'Напиши хотя бы 3 символа...'
                        : 'Не то... попробуй ещё.'
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
            `<div class="av" id="shef-av" title="Нажмите на Шефа!">${a.map((s, i) => `<img src="${esc(s)}" class="${i ? '' : 'on'}" alt="Шеф">`).join('')}</div>`

        // Автосмена аватарок
        let n = 0
        const im = document.querySelectorAll('.av img')
        if (im.length > 0) {
            setInterval(() => {
                im[n].classList.remove('on')
                n = (n + 1) % im.length
                im[n].classList.add('on')
            }, 3500)
        }

        // Кликер по Шефу с вылетающими частицами и тостами
        let shefClicks = +LS.get('shef_clicks') || 0
        const shefAv = $('#shef-av')
        if (shefAv) {
            const particles = ['🍏', '🍎', '👑', '✨', '💤', '📻', '☕', '🥟']
            const milestones = {
                10: '🍏 10 кликов: Шеф собрал первое яблоко!',
                25: '🥟 25 кликов: Шеф учуял праздничные манты!',
                50: '📻 50 кликов: В эфире экстренное включение Найт-Сити!',
                100: '👑 100 КЛИКОВ! Абсолютный фанат Шефа!',
            }

            shefAv.onclick = (e) => {
                shefClicks++
                LS.set('shef_clicks', shefClicks)
                Sound.pop()

                // Смена фото при клике
                if (im.length > 0) {
                    im[n].classList.remove('on')
                    n = (n + 1) % im.length
                    im[n].classList.add('on')
                }

                // Вылетающая частица
                const rect = shefAv.getBoundingClientRect()
                const p = document.createElement('span')
                p.className = 'click-particle'
                p.textContent =
                    particles[Math.floor(Math.random() * particles.length)]
                const dx = (Math.random() - 0.5) * 160 + 'px'
                const dy = -Math.random() * 120 - 40 + 'px'
                const dr = (Math.random() - 0.5) * 180 + 'deg'
                p.style.setProperty('--dx', dx)
                p.style.setProperty('--dy', dy)
                p.style.setProperty('--dr', dr)
                p.style.left = (e.clientX || rect.left + rect.width / 2) + 'px'
                p.style.top = (e.clientY || rect.top + rect.height / 2) + 'px'
                document.body.appendChild(p)
                setTimeout(() => p.remove(), 850)

                // Проверка майлстоунов
                if (milestones[shefClicks]) {
                    Sound.fanfare()
                    const oldToast = $('.shef-click-toast', $('#hero'))
                    if (oldToast) oldToast.remove()
                    const toast = document.createElement('div')
                    toast.className = 'shef-click-toast'
                    toast.textContent = milestones[shefClicks]
                    $('#hero').appendChild(toast)
                    setTimeout(() => toast.remove(), 2500)
                }
            }
        }

        // Цитатник Шефа
        const quoteBox = $('#quote-box')
        const quoteText = $('#quote-text')
        if (quoteBox && quoteText && SITE.quotes && SITE.quotes.length > 0) {
            let curQIdx = Math.floor(Math.random() * SITE.quotes.length)
            const showQuote = (idx) => {
                quoteText.style.opacity = '0'
                quoteText.style.transform = 'translateY(5px)'
                setTimeout(() => {
                    quoteText.textContent = `«${SITE.quotes[idx]}»`
                    quoteText.style.opacity = '1'
                    quoteText.style.transform = 'translateY(0)'
                }, 150)
            }
            showQuote(curQIdx)

            quoteBox.onclick = () => {
                curQIdx = (curQIdx + 1) % SITE.quotes.length
                Sound.paper()
                showQuote(curQIdx)
            }
        }

        $('#heart').onclick = (e) => {
            e.target.textContent = SITE.secret
            Sound.fanfare()
        }

        const qBtn = $('#quest-btn')
        if (qBtn) {
            qBtn.onclick = (e) => {
                e.preventDefault()
                Sound.paper()
                quest()
            }
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
                openGallery(+f.dataset.i)
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
                    `<figure class="pol" data-i="${i}">${m.src ? `<img src="${esc(m.src)}" alt="" loading="lazy">` : ''}<figcaption>Памятный момент<small>${esc(m.date)}</small></figcaption></figure>`,
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
