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

function mod(a, b) {
    return ((a % b) + b) % b
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



const MODE_IONIAN = 0
const MODE_DORIAN = 1
const MODE_PHRYGIAN = 2
const MODE_LYDIAN = 3
const MODE_MIXOLYDIAN = 4
const MODE_AEOLIAN = 5
const MODE_LOCRIAN = 6

let _modeNames = [ "Major", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Minor", "Locrian" ]
function getModeName(mode) {
    return _modeNames[mode]
}

let _modeShortNames = [ "Maj", "Dor", "Phr", "Lyd", "Mix", "Min", "Loc" ]
function getModeShortName(mode) {
    return _modeShortNames[mode]
}


let _upperRoman = [ "I", "II", "III", "IV", "V", "VI", "VII" ]
let _lowerRoman = [ "i", "ii", "iii", "iv", "v", "vi", "vii" ]

function getRomanLabel(degree, major) {
    if(major) return _upperRoman[degree]
    else      return _lowerRoman[degree]
}



const TRIAD_DIM = 0
const TRIAD_MIN = 1
const TRIAD_MAJ = 2
const TRIAD_AUG = 3



function mkChord(note, type) {
    return {
        root: note,
        type: type,
    }
}



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

function generateCircleSector(origin, startAngle, endAngle, startRadius, endRadius, padInner, padOuter) {
    let sector = document.createElementNS("http://www.w3.org/2000/svg", "path");

    let bl = v_add(origin, v_sincos(startRadius, startAngle + padInner))
    let br = v_add(origin, v_sincos(startRadius, endAngle - padInner))
    let tl = v_add(origin, v_sincos(endRadius, startAngle + padOuter))
    let tr = v_add(origin, v_sincos(endRadius, endAngle - padOuter))

    let svgValue
        = `M ${v_str(bl)} L ${v_str(tl)} A ${endRadius} ${endRadius} 1 0 1 ${v_str(tr)}`
        + `L ${v_str(br)} A ${startRadius} ${startRadius} 1 0 0 ${v_str(bl)} z`

    sector.setAttributeNS(null, "d", svgValue);
    sector.setAttributeNS(null, "fill", "#bbbbbb");

    return sector
}

function generateCircleOfFifths(instrument, svg, origin, radii) {
    let layers = [ [], [], [] ]

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

        let padInner = Math.atan(sectorPadding / r0)
        let padOuter = Math.atan(sectorPadding / r1)

        for(let i = 0; i < 12; i++, angle += sectorAngle, currentKey += INT_PFT5) {
            let sector = generateCircleSector(origin, angle, angle + sectorAngle, r0, r1, padInner, padOuter)

            sector.chord = mkChord(normalizeKey(currentKey), triads[currentRadius])
            sector.index = i

            svg.appendChild(sector)

            let midAngle = angle + (sectorAngle / 2)
            let pos = v_add(origin, v_sincos(rm, midAngle))

            let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("text-anchor", "middle")
            text.setAttribute("dominant-baseline", "central")
            text.setAttribute("fill", "#444444")
            text.setAttribute("x", pos.x)
            text.setAttribute("y", pos.y)
            text.innerHTML = circleLabels[currentRadius][i]
            text.style["user-select"] = "none"
            text.style["pointer-events"] = "none"

            let fontSize = (i >= 5 && i <= 7) ? smallSizes[currentRadius] : regularSizes[currentRadius]
            text.style["font-size"] = `${fontSize}em`

            svg.appendChild(text)
            layers[currentRadius].push(sector)
        }
    }

    return {
        selectedTonality: 0, // NOTE: Index of C major on outer layer
        layers: layers,
    }
}


function generatePicker(instrument, svg, origin, radii) {
    let sectorAngle = (2 * Math.PI) / 30
    let initialAngle = -(Math.PI / 2) - (sectorAngle + sectorAngle / 2)

    let layerPadding = 0.5
    let sectorPadding = 0.5

    let padInner = Math.atan(sectorPadding / radii[2])
    let padOuter = Math.atan(sectorPadding / radii[3])

    let radiiInner = radii.map(r => r + layerPadding)
    let radiiOuter = radii.map(r => r - layerPadding)

    let padsInner = radiiInner.map(r => Math.atan(sectorPadding / r))
    let padsOuter = radiiOuter.map(r => Math.atan(sectorPadding / r))

    let angleDelta = 0.01
    let sectorAngles = [
        sectorAngle - angleDelta,
        sectorAngle + 2*angleDelta,
        sectorAngle - angleDelta
    ]

    let sectors = []

    for(let currentRadius = 2; currentRadius >= 1; currentRadius--) {
        let angle = initialAngle
        for(let i = 0; i < 3; i++) {
            let r0 = radiiInner[currentRadius]
            let r1 = radiiOuter[currentRadius + 1]
            
            let sector = generateCircleSector(origin,
                angle, angle + sectorAngles[i],
                r0, r1,
                padsInner[currentRadius], padsOuter[currentRadius + 1])

            sector.layer = currentRadius
            sector.offset = i - 1

            svg.appendChild(sector)
            sectors.push(sector)

            let midAngle = angle + (sectorAngles[i] / 2)
            let pos = v_add(origin, v_sincos((r0 + r1) / 2, midAngle))
            sector.textPos = pos

            angle += sectorAngles[i]
        }
    }

    let sector = generateCircleSector(origin,
        initialAngle + sectorAngles[0], initialAngle + sectorAngles[0] + sectorAngles[1],
        radiiInner[0], radiiOuter[1],
        padsInner[0], padsOuter[1])

    sector.layer = 0
    sector.offset = 0

    svg.appendChild(sector)
    sectors.push(sector)
    let midAngle = initialAngle + sectorAngles[0] + (sectorAngles[1] / 2)
    let pos = v_add(origin, v_sincos((radiiInner[0] + radiiOuter[1]) / 2, midAngle))
    sector.textPos = pos

    // let labels = [ "Lyd", "Maj", "Mix", "Dor", "Min", "Phr", "Loc" ]
    let labels = [ "IV", "I", "V", "ii", "vi", "iii", "vii&deg;" ]
    let modes = [ MODE_LYDIAN, MODE_IONIAN, MODE_MIXOLYDIAN,
                  MODE_DORIAN, MODE_AEOLIAN, MODE_PHRYGIAN,
                  MODE_LOCRIAN ]
    
    sectors.map((sector, i) => {
        sector.mode = modes[i]

        let pos = sector.textPos
        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("text-anchor", "middle")
        text.setAttribute("dominant-baseline", "central")
        text.setAttribute("fill", "#444444")
        text.setAttribute("x", pos.x)
        text.setAttribute("y", pos.y)
        text.innerHTML = labels[i]
        text.style["user-select"] = "none"
        text.style["pointer-events"] = "none"
        text.style["font-size"] = `0.35em`

        sector.text = text

        svg.appendChild(text)
    })

    return {
        sectors: sectors,
    }
}

function disableCircle(circle) {
    circle.layers.map(layer => layer.map(sector => {
        sector.onclick = e => {}
        sector.onmousedown = e => {}
        sector.setAttributeNS(null, "fill", "#666666");
    }))
}

function disablePicker(picker) {
    picker.sectors.map(sector => {
        sector.onclick = e => {}
        sector.onmousedown = e => {}
        sector.setAttributeNS(null, "fill", "#666666");
    })
}

function onPickMode(e, circle, picker, sector) {
    let offset = sector.offset
    let pickedMode = sector.mode

    disablePicker(picker)

    let activeLayer = e.target.layer

    circle.layers[activeLayer].map(sector => {
        sector.setAttributeNS(null, "fill", "#bbbbbb");
        sector.onclick = e => onPickRoot(e, circle, picker, sector, offset, pickedMode)
    })
}

function setupPickerFunctionLabels(picker, mode) {
    picker.sectors.map(sector => {
        let degree = mod(sector.mode - mode, 7)
        let label = getRomanLabel(degree, sector.layer === 2)
        if(sector.layer === 0) label += "&deg;"
        sector.text.innerHTML = label
    })
}

function circleHighlightTonality(circle, color) {
    for(let l = 1; l <= 2; l++) {
        for(let i = -1; i <= 1; i++) {
            let sector = circle.layers[l][mod(circle.selectedTonality + i, 12)]
            sector.setAttributeNS(null, "fill", color);
        }
    }

    circle.layers[0][circle.selectedTonality].setAttributeNS(null, "fill", color);
}

function onPickRoot(e, circle, picker, sector, offset, pickedMode) {
    let root = e.target.chord.root

    picker.displayText.innerText = `Tonality: ${getKeyName(root)} ${getModeName(pickedMode)}`

    picker.sectors.map(sector => {
        sector.setAttributeNS(null, "fill", "#bbbbbb");
    })
    setupPickerPlayer(circle, picker)
    setupPickerFunctionLabels(picker, pickedMode)

    circle.layers.map(layer => layer.map(sector => {
        sector.onclick = e => {}
        sector.setAttributeNS(null, "fill", "#bbbbbb");
    }))
    setupCirclePlayer(circle)

    circle.selectedTonality = mod(e.target.index - offset, 12)

    circleHighlightTonality(circle, "#dddddd")
    sector.setAttributeNS(null, "fill", "#ffffff");
}

function setupCirclePlayer(circle) {
    circle.layers.map(layer => layer.map(sector => {
        sector.onmousedown = doHoldActionClick(
            e => {
                let instrument = circle.instrument
                keyToTriad(e.target.chord.root + OCTAVE_3, e.target.chord.type).map(key => instrumentPressKey(instrument, key - KEY_A - OCTAVE_0))
            },
            e => {
                let instrument = circle.instrument
                keyToTriad(e.target.chord.root + OCTAVE_3, e.target.chord.type).map(key => instrumentUnpressKey(instrument, key - KEY_A - OCTAVE_0))
            }
        )
    }))
}

function setupPickerPlayer(circle, picker) {
    picker.sectors.map((sector, i) => {
        sector.onmousedown = doHoldActionClick(
            e => {
                let instrument = circle.instrument
                let chord = circle.layers[e.target.layer][mod(circle.selectedTonality + e.target.offset, 12)].chord
                keyToTriad(chord.root + OCTAVE_3, chord.type).map(key => instrumentPressKey(instrument, key - KEY_A - OCTAVE_0))
            },
            e => {
                let instrument = circle.instrument
                let chord = circle.layers[e.target.layer][mod(circle.selectedTonality + e.target.offset, 12)].chord
                keyToTriad(chord.root + OCTAVE_3, chord.type).map(key => instrumentUnpressKey(instrument, key - KEY_A - OCTAVE_0))
            })
    })
}

{
    let pianoSvg = document.getElementsByClassName("piano")[0].getElementsByClassName("piano-keys")[0];
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
                e => instrumentUnpressKey(instrument, index)
            )(e)
        }
    }



    
    let circleSvg = document.getElementsByClassName("tonality")[0].getElementsByClassName("tonality-circle")[0];

    let pickerSvg = document.getElementsByClassName("tonality")[0].getElementsByClassName("tonality-settings-picker")[0];
    let selectTonalityButton = document.getElementsByClassName("tonality")[0].getElementsByClassName("tonality-settings-select")[0];
    let displayTonalityText = document.getElementsByClassName("tonality")[0].getElementsByClassName("tonality-settings-display")[0];

    let circle = generateCircleOfFifths(instrument, circleSvg, v_xy(50, 50), [15, 25, 35, 50])
    let picker = generatePicker(instrument, pickerSvg, v_xy(31, 100), [64, 76, 88, 100])
    picker.displayText = displayTonalityText

    circle.instrument = instrument

    setupCirclePlayer(circle)
    setupPickerPlayer(circle, picker)


    selectTonalityButton.onclick = e => {
        disableCircle(circle)

        picker.sectors.map((sector, i) => {
            sector.onmousedown = e => {}

            sector.text.innerHTML = getModeShortName(sector.mode)
            sector.onclick = e => onPickMode(e, circle, picker, sector)
        })
    }
}
