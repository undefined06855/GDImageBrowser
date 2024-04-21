// This is actually, genuinely the worse codebase in the world
// please dont attempt to make a pr

/** @type Array<PlistAndImageComboDeal> */
let loadedStuff = []

let loading = 0

/** @type PlistAndImageComboDeal */
let currentCombo = null

/** @type PlistDict */
let currentDict = null

function getSelectedVersion() { return Number(document.querySelector("#version_select").value) || Version.V2113 }
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
    if (getSelectedVersion() == Version.V2204) {
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
    canvas.width = window.innerWidth * 0.7
    canvas.height = window.innerHeight

    let prevCanvas = document.querySelector("#preview")
    prevCanvas.width = window.innerWidth * 0.3
    prevCanvas.height = window.innerHeight * 0.6
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

        ctx.strokeStyle = "red"
        ctx.lineWidth = 2
        if (currentDict.textureRotated) {
            ctx.strokeRect(currentDict.textureRect.x * scale, currentDict.textureRect.y * scale, currentDict.textureRect.h * scale, currentDict.textureRect.w * scale)
        } else {
            ctx.strokeRect(currentDict.textureRect.x * scale, currentDict.textureRect.y * scale, currentDict.textureRect.w * scale, currentDict.textureRect.h * scale)
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
/** @param {MouseEvent} event  */
function tickCursor(event) {
    if (currentCombo == null) return

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
            document.querySelector("#name").innerText = "Name: " + dict.key
            document.querySelector("#offset").innerText = "Offset: " + dict.spriteOffset
            document.querySelector("#size").innerText = "Size: " + dict.spriteSize.toString(true)
            document.querySelector("#ssize").innerText = "Source size: " + dict.spriteSourceSize.toString(true)
            document.querySelector("#rect").innerText = "Rect: " + dict.textureRect
            document.querySelector("#rot").innerText = "Rotated: " + (dict.textureRotated ? "True" : "False")

            // and draw onto preview canvas
            /** @type HTMLCanvasElement */
            let canvas = document.querySelector("#preview")
            let ctx = canvas.getContext("2d")
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            if (dict.textureRotated) {
                ctx.drawImage(currentCombo.image, dict.textureRect.x, dict.textureRect.y, dict.textureRect.h, dict.textureRect.w, 0, 0, canvas.width, canvas.height)
            } else {
                ctx.drawImage(currentCombo.image, dict.textureRect.x, dict.textureRect.y, dict.textureRect.w, dict.textureRect.h, 0, 0, canvas.width, canvas.height)
            }

            return
        }
    }
}

// runs on contextmenu
function downloadPart(event) {
    // please someone make it so that when it downloads it rotates the image if currentDict.textureRotated thanks
    event.preventDefault()

    // create a canvas to put the image part onto
    const offscreenCanvas = new OffscreenCanvas(currentDict.textureRect.w, currentDict.textureRect.h)
    if (currentDict.textureRotated) {
        offscreenCanvas.width = currentDict.textureRect.h
        offscreenCanvas.height = currentDict.textureRect.w
    }
    
    const ctx = offscreenCanvas.getContext("2d")

    if (currentDict.textureRotated) {
        ctx.drawImage(
            currentCombo.image,
            currentDict.textureRect.x,
            currentDict.textureRect.y,
            currentDict.textureRect.h,
            currentDict.textureRect.w,
            0, 0,
            currentDict.textureRect.h,
            currentDict.textureRect.w
        )
    } else {
        ctx.drawImage(
            currentCombo.image,
            currentDict.textureRect.x,
            currentDict.textureRect.y,
            currentDict.textureRect.w,
            currentDict.textureRect.h,
            0, 0,
            currentDict.textureRect.w,
            currentDict.textureRect.h
        )
    }



    // turn it into a blob
    offscreenCanvas.convertToBlob()
    .then(blob => {
        // create link to download
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = currentDict.key.replace(".png", "") + (getSelectedResolution() == Resolution.hd ? "-hd" : (getSelectedResolution() == Resolution.uhd ? "-uhd" : "-sd")) + ".png"

        // then click
        link.click()
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
document.querySelector("#canvas").addEventListener("contextmenu", downloadPart)

window.addEventListener("resize", updateCanvasSize)
updateCanvasSize()
