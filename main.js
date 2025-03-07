// balls code

/** @type Array<PlistAndImageComboDeal> */
let loadedStuff = []

let loading = 0

/** @type PlistAndImageComboDeal */
let currentCombo = null

/** @type PlistDict */
let currentDict = null

let currentDictLocked = false

function getSelectedVersion() { return Number(document.querySelector("#version_select").value) || Version.V22074 }
function getSelectedSheet() { return document.querySelector("#sheet_select").value }
function getSelectedResolution() { return Number(document.querySelector("#quality_select").value) || Resolution.sd}

function getPath(name, resolution, version, type) {
    let versionString
    let typeString
    let resolutionString

    if (resolution == Resolution.hd) resolutionString = "-hd"
    else if (resolution == Resolution.sd) resolutionString = ""
    else if (resolution == Resolution.uhd) resolutionString = "-uhd"

    if (version == Version.V2113) versionString = "2.113"
    else if (version == Version.V2204) versionString = "2.204"
    else if (version == Version.V22074) versionString = "2.2074"

    if (type == FileType.Image) typeString = "png"
    else if (type == FileType.Plist) typeString = "plist"

    return `./assets/${versionString}/${name}${resolutionString}.${typeString}`
}

/**
 * @param {string} name 
 * @param {number} resolution 
 * @param {number} version 
 * @returns {Promise<PlistAndImageComboDeal>}
 */
async function getImageAndPlist(name, resolution, version) {
    return new Promise(async resolve => {
        // check if it's loaded
        let combo = loadedStuff.filter(value => (value.name == name && value.resolution == resolution && value.version == version))
        if (combo.length > 0) {
            // yes!
            console.log("%s at %s (%s) is loaded!", name, resolution, version)
            resolve(combo[0])
        } else {
            // no :(
            console.log("need to load %s at %s (%s)", name, resolution, version)
            
            let imagePath = getPath(name, resolution, version, FileType.Image)
            let plistPath = getPath(name, resolution, version, FileType.Plist)

            // parse the plist
            let plistResponse = await fetch(plistPath)
            let plistString = await plistResponse.text()

            let plistDOM = new DOMParser().parseFromString(plistString, "text/xml")
            let plistBody = plistDOM.querySelector("dict").querySelector("dict")

            let plist = []
            for (let i = 0; i < plistBody.children.length; i += 2) {
                plist.push(new PlistDict(plistBody.children[i].innerHTML, plistBody.children[i + 1]))
            }

            // load the image
            loading++

            let image = new Image()
            image.src = imagePath
            image.addEventListener("load", async () => {
                loading--
                loadedStuff.push(new PlistAndImageComboDeal(name, resolution, version, image, plist))
                resolve(await getImageAndPlist(name, resolution, version))
            })
        }
    })
}

async function autoGetImageAndPlist() {
    return getImageAndPlist(getSelectedSheet(), getSelectedResolution(), getSelectedVersion())
}

function populateSheetSelect() {
    let sheetSelect = document.querySelector("#sheet_select")
    let prevSelected = sheetSelect.value
    sheetSelect.innerText = ""
    let sheets = []
    if (getSelectedVersion() == Version.V2204 || getSelectedVersion() == Version.V22074) {
        sheets = [
            "DungeonSheet",
            "FireSheet_01",
            "GauntletSheet",
            "GJ_GameSheet",
            "GJ_GameSheet02",
            "GJ_GameSheet03",
            "GJ_GameSheet04",
            "GJ_GameSheetEditor",
            "GJ_GameSheetGlow",
            "GJ_LaunchSheet",
            "GJ_ParticleSheet",
            "GJ_PathSheet",
            "GJ_ShopSheet",
            "GJ_ShopSheet01",
            "GJ_ShopSheet02",
            "GJ_ShopSheet03",
            "PixelSheet_01",
            "SecretSheet",
            "TowerSheet",
            "TreasureRoomSheet",
            "WorldSheet",
        ]
    } else if (getSelectedVersion() == Version.V2113) {
        sheets = [
            "DungeonSheet",
            "FireSheet_01",
            "GauntletSheet",
            "GJ_GameSheet",
            "GJ_GameSheet02",
            "GJ_GameSheet03",
            "GJ_GameSheet04",
            "GJ_GameSheetGlow",
            "GJ_LaunchSheet",
            "GJ_ShopSheet",
            "SecretSheet",
            "WorldSheet",
        ]
    }

    for (let sheet of sheets) {
        let element = document.createElement("option")
        element.innerText = sheet
        element.value = sheet
        sheetSelect.appendChild(element)
    }

    if (sheets.includes(prevSelected))
        sheetSelect.value = prevSelected
}

function updateCanvasSize() {
    let canvas = document.querySelector("#canvas")
    let canvasWrap = document.querySelector("#canvas-wrapper")
    let rect = canvasWrap.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
}

async function updateCurrentCombo() {
    currentDict = null
    currentCombo = await autoGetImageAndPlist()
}

function draw() {
    /** @type HTMLCanvasElement */
    let canvas = document.querySelector("#canvas")
    let ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    
    // this also handles showing #loader
    if (loading > 0) {
        document.querySelector("#loader").style.display = "block"
    } else {
        document.querySelector("#loader").style.display = "none"
    }

    // everything below here requires a combo to be selected
    if (currentCombo == null) {
        requestAnimationFrame(draw)
        return
    }

    if (canvas.width / canvas.height < currentCombo.image.width / currentCombo.image.height) 
        ctx.drawImage(currentCombo.image, 0, 0, canvas.width, (canvas.width / currentCombo.image.width) * currentCombo.image.height)
    else
        ctx.drawImage(currentCombo.image, 0, 0, (canvas.height / currentCombo.image.height) * currentCombo.image.width, canvas.height)


    // draw a box where the cursor is selecting a sprite
    if (currentDict != null) {
        let scale

        if (canvas.width / canvas.height < currentCombo.image.width / currentCombo.image.height)
            scale = canvas.width / currentCombo.image.width
        else
            scale = canvas.height / currentCombo.image.height

        let width, height
        if (currentDict.textureRotated) {
            width = currentDict.textureRect.h * scale
            height = currentDict.textureRect.w * scale
        } else {
            width = currentDict.textureRect.w * scale
            height = currentDict.textureRect.h * scale
        }

        ctx.strokeStyle = "red"
        ctx.lineWidth = 2
        ctx.strokeRect(currentDict.textureRect.x * scale, currentDict.textureRect.y * scale, width, height)
        
        if (currentDictLocked) {
            // dont tell anyone i borrowed the idea from colon
            ctx.beginPath()
            ctx.rect(0, 0, canvas.width, canvas.height)
            ctx.rect(currentDict.textureRect.x * scale, currentDict.textureRect.y * scale, width, height)
            ctx.fillStyle = "#00000056"
            ctx.fill("evenodd")
        }
    }

    // draw all the textureRects lol (debug)
    // let textureScale = canvas.width / currentCombo.image.width
    // for (let dict of currentCombo.plist) {
    //     let rect = dict.textureRect
    //     ctx.strokeRect = "red"
    //     ctx.lineWidth = 2
    //     if (dict.textureRotated) ctx.strokeRect(rect.x * textureScale, rect.y * textureScale, rect.h * textureScale, rect.w * textureScale)
    //     else ctx.strokeRect(rect.x * textureScale, rect.y * textureScale, rect.w * textureScale, rect.h * textureScale)
    // }

    requestAnimationFrame(draw)
}

// runs on mousemove
/** 
 * @param {MouseEvent} event
 * @returns {boolean} whether the mouse is hovering something
 */
function tickCursor(event) {
    if (currentCombo == null) return false
    if (currentDictLocked) return false

    let rect = document.querySelector("#canvas").getBoundingClientRect()
    let mx = event.pageX - rect.left
    let my = event.pageY - rect.top

    let scale
    
    if (canvas.width / canvas.height < currentCombo.image.width / currentCombo.image.height)
        scale = canvas.width / currentCombo.image.width
    else
        scale = canvas.height / currentCombo.image.height

    // instead of multiplying everything by scale
    // i can divide the mouse cursor by scale :bigbrain:
    mx /= scale
    my /= scale

    for (let dict of currentCombo.plist) {
        if (
            // unrotated
            (!dict.textureRotated && dict.textureRect.x < mx && dict.textureRect.y < my && dict.textureRect.x + dict.textureRect.w > mx && dict.textureRect.y + dict.textureRect.h > my)
            ||
            // rotated
            (dict.textureRotated && dict.textureRect.x < mx && dict.textureRect.y < my && dict.textureRect.x + dict.textureRect.h > mx && dict.textureRect.y + dict.textureRect.w > my)
        ) {
            currentDict = dict

            // fill out info
            document.querySelector("#name").innerHTML = dict.key
            document.querySelector("#offset").innerHTML = dict.spriteOffset
            document.querySelector("#size").innerHTML = dict.spriteSize.toString(true)
            document.querySelector("#ssize").innerHTML =  dict.spriteSourceSize.toString(true)
            document.querySelector("#rect").innerHTML = dict.textureRect
            document.querySelector("#rot").innerHTML = (dict.textureRotated ? "True" : "False")

            redrawCanvas()

            return true
        }
    }
}

function redrawCanvas() {
    /** @type HTMLCanvasElement */
    let canvas = document.querySelector("#preview")
    let ctx = canvas.getContext("2d")

    if (currentDict == null) {
        return
    }


    let sourceWidth, sourceHeight
    if (currentDict.textureRotated) {
        sourceWidth = currentDict.textureRect.h
        sourceHeight = currentDict.textureRect.w
    } else {
        sourceWidth = currentDict.textureRect.w
        sourceHeight = currentDict.textureRect.h
    }

    canvas.width = sourceWidth
    canvas.height = sourceHeight

    ctx.drawImage(
        currentCombo.image,
        currentDict.textureRect.x,
        currentDict.textureRect.y,
        sourceWidth, sourceHeight,
        0, 0,
        canvas.width, canvas.height
    )

    if (currentDict.textureRotated) {
        // translateX and sourceWidth used here which seems counter-intuitive but
        // it's been rotated so you need to use the other way around if that makes
        // sense
        // also this is a SHIT way to do it but the gdimagebrowser codebase is already
        // so fucking bad at this point it's built on top of itself too many times :sob:
        // not even following 80 column with these comments
        canvas.style.transform = `rotate(-90deg)`
    } else {
        canvas.style.transform = ""
    }

    let wrap = document.querySelector("#preview-wrapper")
    let max = wrap.getBoundingClientRect()
    let cur = canvas.getBoundingClientRect()

    // taken from object nodes LOL

    let maxRatio = max.width / max.height
    let curRatio = cur.width / cur.height

    let scale = 1
    if (maxRatio > curRatio) {
        // adjust for height
        let maxSize = max.height
        let minSize = max.height * 0.5
        if (cur.height > maxSize) {
            scale = maxSize / cur.height
        } else if (cur.height < minSize) {
            scale = minSize / cur.height
        }
    } else {
        // adjust for width
        let maxSize = max.width
        let minSize = max.width * 0.5
        if (cur.width > maxSize) {
            scale = maxSize / cur.width
        } else if (cur.width < minSize) {
            scale = minSize / cur.width
        }
    }
    canvas.style.transform += ` scale(${scale})`
    document.querySelector("#preview-scale").innerText = `(${scale.toFixed(3)}x scale)`

    if (currentDict.textureRotated) {
        canvas.style.transform += ` translateX(-${sourceWidth}px)`
    }
}

/**
 * @returns {OffscreenCanvas}
 */
function unrotatePreviewCanvas() {
    /** @type {HTMLCanvasElement} */
    let canvas = document.querySelector("#preview")
    
    let rotated = canvas.style.transform.includes("rotate")

    if (rotated) {
        let offscreen = new OffscreenCanvas(canvas.height, canvas.width)
        let ctx = offscreen.getContext("2d")
        ctx.translate(0, canvas.width)
        ctx.rotate(-90 * Math.PI / 180)
        ctx.drawImage(canvas, 0, 0)
        return offscreen
    } else {
        let offscreen = new OffscreenCanvas(canvas.width, canvas.height)
        let ctx = offscreen.getContext("2d")
        ctx.drawImage(canvas, 0, 0)
        return offscreen
    }
}

// runs on contextmenu
function downloadPart(event) {
    event.preventDefault()

    // blobbage
    unrotatePreviewCanvas().convertToBlob().then(blob => {
        // create link to download
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = currentDict.key.replace(".png", "") + (getSelectedResolution() == Resolution.hd ? "-hd" : (getSelectedResolution() == Resolution.uhd ? "-uhd" : "-sd")) + ".png"

        // then click
        link.click()
    })
}

// runs on dblclick
function copyPart(event) {
    event.preventDefault()

    // blobbage
    unrotatePreviewCanvas().convertToBlob().then(blob => {
        navigator.clipboard.write([new ClipboardItem({'image/png' : blob})]);
    })
}

// -----------------------------------------------------------------------------

populateSheetSelect()
updateCurrentCombo() // sets currentCombo
draw()

document.querySelector("#version_select").addEventListener("change", () => {populateSheetSelect(); updateCurrentCombo()})
document.querySelector("#sheet_select").addEventListener("change", () => {updateCurrentCombo()})
document.querySelector("#quality_select").addEventListener("change", () => {updateCurrentCombo()})

document.querySelector("#canvas").addEventListener("mousemove", tickCursor)
document.querySelector("#canvas").addEventListener("dblclick", downloadPart)
document.querySelector("#canvas").addEventListener("contextmenu", copyPart)
//                                                                                                      shoddy way of doing this but whatever i guess
document.querySelector("#canvas").addEventListener("click", event => { currentDictLocked = tickCursor(event) ? !currentDictLocked : false })

window.addEventListener("resize", updateCanvasSize)
updateCanvasSize()
