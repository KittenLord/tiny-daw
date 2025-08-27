function v_xy(x, y) {
    return { x: x, y: y }
}

function v_0() {
    return v_xy(0, 0)
}

function v_str(v) {
    return `${v.x} ${v.y}`
}

function v_strc(v) {
    return `${v.x}, ${v.y}`
}

function v_add(a, b) {
    return v_xy(a.x + b.x, a.y + b.y)
}

function v_neg(a) {
    return v_xy(-a.x, -a.y)
}

function v_sub(a, b) {
    return v_add(a, v_neg(b))
}

function v_flipY(v) {
    return v_xy(v.x, -v.y)
}

function v_sincos(m, a) {
    return v_xy(m * Math.cos(a), m * Math.sin(a))
}



let _keyboardOctaves = "zsxdcvgbhnjmq2w3er5t6y7u"



const KEY_C = 0

const KEY_CS = 1
const KEY_DB = 1

const KEY_D = 2

const KEY_DS = 3
const KEY_EB = 3

const KEY_E = 4

const KEY_F = 5

const KEY_FS = 6
const KEY_GB = 6

const KEY_G = 7

const KEY_GS = 8
const KEY_AB = 8

const KEY_A = 9

const KEY_AS = 10
const KEY_BB = 10

const KEY_B = 11



const OCTAVE_0 = 12 * 0
const OCTAVE_1 = 12 * 1
const OCTAVE_2 = 12 * 2
const OCTAVE_3 = 12 * 3
const OCTAVE_4 = 12 * 4
const OCTAVE_5 = 12 * 5
const OCTAVE_6 = 12 * 6
const OCTAVE_7 = 12 * 7
const OCTAVE_8 = 12 * 8



const INT_MIN2 = 1

const INT_MAJ2 = 2

const INT_AUG2 = 3
const INT_MIN3 = 3

const INT_MAJ3 = 4

const INT_PFT4 = 5

const INT_AUG4 = 6
const INT_TRTN = 6
const INT_DIM5 = 6

const INT_PFT5 = 7

const INT_AUG5 = 8
const INT_MIN6 = 8

const INT_MAJ6 = 9

const INT_MIN7 = 10

const INT_MAJ7 = 11

const INT_PFT8 = 12



const TRIAD_DIM = 0
const TRIAD_MIN = 1
const TRIAD_MAJ = 2
const TRIAD_AUG = 3

function keyToTriad(key, triad) {
    let m1 = (triad === TRIAD_DIM || triad === TRIAD_MIN)
        ? INT_MIN3 : INT_MAJ3
    let m2 = (triad === TRIAD_MIN || triad === TRIAD_AUG)
        ? INT_MAJ3 : INT_MIN3

    return [ key, key + m1, key + m1 + m2 ]
}



const audioContext = new AudioContext()

let _keyAudios = undefined
function playKey(key) {
    if(!_keyAudios) {
        _keyAudios = []

        // TODO: something something look into promises maybe?
        for(let i = KEY_A + OCTAVE_0; i < KEY_A + OCTAVE_0 + 88; i++) {
            let index = i
            fetch(`/share/music/piano-keys/Piano.ff.${getFullKeyName(i)}.wav.mp3`)
                .then(response => response.arrayBuffer())
                .then(buffer => audioContext.decodeAudioData(buffer))
                .then(data => {
                    _keyAudios[i] = data
                });
        }
    }

    const source = audioContext.createBufferSource()
    source.buffer = _keyAudios[key]
    source.connect(audioContext.destination)
    source.start(audioContext.currentTime)

    return source
}

function playKeysSimultaneously(keys) {
    keys.map(key => playKey(key))
}

function playKeysArpeggiate(keys, delay) {
    for(let i = 0; i < keys.length; i++) {
        setTimeout(() => {
            playKey(keys[i])
        }, i * delay)
    }
}



const KEY_COLOR_WHITE = "#fff6e0"
const KEY_COLOR_BLACK = "#241a02"


function normalizeKey(key) { return key % 12 }
function keyOctave(key) { return Math.floor(key / 12) }


let _blackKeys = [1, 3, 6, 8, 10]
function keyIsBlack(key) { return _blackKeys.includes(normalizeKey(key)) }
function keyIsWhite(key) { return !keyIsBlack(key) }

let _keyNames = [ "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B" ]
function getKeyName(key) { return _keyNames[normalizeKey(key)] }
function getFullKeyName(key) { return `${getKeyName(key)}${keyOctave(key)}` }



function instrumentUnpressKey(instrument, keyn) {
    let key = instrument.keys[keyn]
    key.count -= 1
    if(key.count === 0) {
        key.unpressAction(instrument, key)
        key.state = undefined
    }
}

function instrumentPressKey(instrument, keyn) {
    let key = instrument.keys[keyn]
    key.count += 1
    if(key.count === 1) {
        key.state = key.pressAction(instrument, key)
    }
}



function doHoldActionClick(press, unpress) {
    return (e) => {
        let result = press(e)

        // TODO: not sure how to make this reliably work
        document.addEventListener("mouseup", () => {
            unpress(e, result)
        }, { once: true })
    }
}

function doHoldActionKey(input, press, unpress) {
    return (e) => {
        let result = press(e)

        let keyupListener = (e) => {
            if(e.key !== input) return

            document.removeEventListener("keyup", keyupListener)
            unpress(e, result)
        }

        document.addEventListener("keyup", keyupListener)
    }
}



function generateKey(origin, size, color, padding) {
    let key = document.createElementNS("http://www.w3.org/2000/svg", "path");

    let a = v_str(v_add(origin, v_xy(padding.x, -padding.y)))
    let b = v_str(v_add(origin, v_xy(padding.x, -(size.y - padding.y))))
    let c = v_str(v_add(origin, v_xy((size.x - padding.x), -(size.y - padding.y))))
    let d = v_str(v_add(origin, v_xy((size.x - padding.x), -padding.y)))

    key.setAttributeNS(null, "d", `M ${a} L ${b} L ${c} L ${d} z`);
    key.setAttributeNS(null, "fill", color);

    return key
}


function generatePianoKeys(instrument, svg, startKey, keyCount, whiteSize, blackSize, padding) {
    let index = 0

    let lastWhitePos = v_xy(0, 100)
    let posIncrement = whiteSize.x

    let p = v_xy(padding, 0)

    let blackKeys = []

    let currentKey = startKey
    while(keyCount > 0) {
        let key = undefined
        if(keyIsWhite(currentKey)) {
            key = generateKey(lastWhitePos, whiteSize, KEY_COLOR_WHITE, p)
            svg.appendChild(key)

            lastWhitePos = v_add(lastWhitePos, v_xy(whiteSize.x, 0))
        }
        else {
            let pos = v_sub(lastWhitePos, v_xy(blackSize.x / 2, whiteSize.y - blackSize.y))
            key = generateKey(pos, blackSize, KEY_COLOR_BLACK, v_0())
            blackKeys.push(key)
        }


        key.index = index
        key.onmousedown = doHoldActionClick(
            e => instrumentPressKey(instrument, e.target.index),
            e => instrumentUnpressKey(instrument, e.target.index))


        keyCount -= 1
        currentKey += 1
        index += 1
    }

    blackKeys.map(key => {
        svg.appendChild(key)
    })
}

function generateCircleOfFifths(instrument, svg, origin, radii) {
    let sectorAngle = (2 * Math.PI) / 12
    let initialAngle = -(Math.PI / 2) - (sectorAngle / 2)
    let angle = initialAngle

    let layerPadding = 0.5
    let sectorPadding = 0.5

    // TODO: figure out the labels for 6-7#/b
    let circleLabels = [
        [ "B",          "F&sharp;",   "C&sharp;", "G&sharp;", "D&sharp;", "A&sharp;/B&flat;",
          "F/E&sharp;", "C/B&sharp;", "G",        "D",        "A",        "E" ],

        [ "A",                "E",                "B", "F&sharp;", "C&sharp;", "G&sharp;/A&flat;",
          "E&flat;/D&sharp;", "B&flat;/A&sharp;", "F", "C",        "G",        "D" ],

        [ "C",                "G",                "D",       "A",       "E",       "B/C&flat;",
          "G&flat;/F&sharp;", "D&flat;/C&sharp;", "A&flat;", "E&flat;", "B&flat;", "F" ],
    ]

    let startKeys = [ KEY_B + OCTAVE_3, KEY_A + OCTAVE_3, KEY_C + OCTAVE_3 ]
    let triads = [ TRIAD_DIM, TRIAD_MIN, TRIAD_MAJ ]

    let regularSizes = [ 0.3, 0.35, 0.5 ]
    let smallSizes = [ 0.2, 0.2, 0.35 ]

    for(let currentRadius = 0; currentRadius < 3; currentRadius++) {
        let currentKey = startKeys[currentRadius]

        let r0 = radii[currentRadius] + layerPadding
        let r1 = radii[currentRadius + 1] - layerPadding
        let rm = (r0 + r1) / 2

        let dinner = Math.atan(sectorPadding / r0)
        let douter = Math.atan(sectorPadding / r1)

        for(let i = 0; i < 12; i++) {
            let sector = document.createElementNS("http://www.w3.org/2000/svg", "path");
            
            let nextAngle = angle + sectorAngle
            let midAngle = angle + (sectorAngle / 2)

            let bl = v_add(origin, v_sincos(r0, angle + dinner))
            let br = v_add(origin, v_sincos(r0, nextAngle - dinner))
            let tl = v_add(origin, v_sincos(r1, angle + douter))
            let tr = v_add(origin, v_sincos(r1, nextAngle - douter))

            let svgValue
                = `M ${v_str(bl)} L ${v_str(tl)} A ${r1} ${r1} 1 0 1 ${v_str(tr)}`
                + `L ${v_str(br)} A ${r0} ${r0} 1 0 0 ${v_str(bl)} z`

            sector.setAttributeNS(null, "d", svgValue);
            sector.setAttributeNS(null, "fill", "#bbbbbb");

            sector.key = currentKey
            sector.triad = triads[currentRadius]
            sector.onmousedown = doHoldActionClick(
                e => keyToTriad(e.target.key, e.target.triad).map(key => instrumentPressKey(instrument, key - KEY_A - OCTAVE_0)),
                e => keyToTriad(e.target.key, e.target.triad).map(key => instrumentUnpressKey(instrument, key - KEY_A - OCTAVE_0))
            )

            currentKey = normalizeKey(currentKey + INT_PFT5) + OCTAVE_3
            svg.appendChild(sector)

            angle = nextAngle

            let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            let pos = v_add(origin, v_sincos(rm, midAngle))
            text.setAttribute("text-anchor", "middle")
            text.setAttribute("dominant-baseline", "central")
            text.setAttribute("fill", "#ff0000")
            text.setAttribute("x", pos.x)
            text.setAttribute("y", pos.y)
            text.innerHTML = circleLabels[currentRadius][i]
            text.style["user-select"] = "none"
            text.style["pointer-events"] = "none"

            let fontSize = (i >= 5 && i <= 7) ? smallSizes[currentRadius] : regularSizes[currentRadius]
            text.style["font-size"] = `${fontSize}em`

            svg.appendChild(text)
        }
    }
}


{
    let pianoSvg = document.getElementsByClassName("piano-keys")[0].children[0];
    let pianoGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pianoGroup.style["transition"] = "all 0.2s"
    pianoGroup.position = v_0()
    pianoSvg.appendChild(pianoGroup)

    let pianoKeyStart = KEY_A + OCTAVE_0
    let pianoKeyCount = 88

    let instrument = {}
    instrument.keys = []
    for(let i = 0; i < pianoKeyCount; i++) {
        let keyn = i + pianoKeyStart
        instrument.keys[i] = {
            count: 0,
            index: i,
            pressAction: (instrument, key) => {
                return playKey(keyn)
            },
            unpressAction: (instrument, key) => {
                // TODO: fadeout
                key.state.stop()
            }
        }
    }

    generatePianoKeys(instrument, pianoGroup, pianoKeyStart, pianoKeyCount, v_xy(10, 40), v_xy(7, 28), 0.5)


    let scrollIncrement = v_xy(5, 0)

    onkeydown = (e) => {
        let input = e.key

        if(false){}
        else if(input === "ArrowLeft") {
            pianoGroup.position = v_add(pianoGroup.position, scrollIncrement)
            pianoGroup.setAttribute("transform", `translate(${v_strc(pianoGroup.position)})`)
        }
        else if(input === "ArrowRight") {
            pianoGroup.position = v_sub(pianoGroup.position, scrollIncrement)
            pianoGroup.setAttribute("transform", `translate(${v_strc(pianoGroup.position)})`)
        }
        else if(input.length === 1 && _keyboardOctaves.includes(input) && !e.repeat) {
            let key = _keyboardOctaves.indexOf(input) + KEY_C + OCTAVE_2
            let index = key - (KEY_A + OCTAVE_0)

            doHoldActionKey(input,
                e => instrumentPressKey(instrument, index),
                e => instrumentUnpressKey(instrument, index))
            (e)
        }
    }



    
    let circleSvg = document.getElementsByClassName("circle")[0].children[0];

    generateCircleOfFifths(instrument, circleSvg, v_xy(50, 50), [15, 25, 35, 50])
}
