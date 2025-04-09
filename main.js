// balls code

/** @type {Array<PlistAndImageComboDeal>} */
let loadedStuff = []

let loading = 0

/** @type {PlistAndImageComboDeal} */
let currentCombo = null

/** @type {PlistDict} */
let currentDict = null

let currentDictLocked = false

let currentAnimationName = ""

function getSelectedVersion() { return Number(document.querySelector("#version-select").value) ?? Version.V22074 }
function getSelectedSheet() { return document.querySelector("#sheet-select").value }
function getSelectedResolution() { return Number(document.querySelector("#quality-select").value) ?? Resolution.uhd }

function getPath(name, resolution, version, type) {
    let versionString
    let typeString
    let resolutionString

    if (resolution == Resolution.hd) resolutionString = "-hd"
    else if (resolution == Resolution.sd) resolutionString = ""
    else if (resolution == Resolution.uhd) resolutionString = "-uhd"

    if (version == Version.V2113) versionString = "2.113"
    else if (version == Version.V2204) versionString = "2.204"
    else if (version == Version.V22073) versionString = "2.2073"
    else if (version == Version.V22074) versionString = "2.2074"
    else if (version == Version.VLitePinkMoreGames) versionString = "1.2litepinkmoregames"

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
        let combo = loadedStuff.find(value => (value.name == name && value.resolution == resolution && value.version == version))
        if (combo) {
            // yes!
            console.log("%s at %s (%s) is loaded!", name, resolution, version)
            resolve(combo)
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

            // only integer tag is the format, naive approach but works
            let format = plistDOM.querySelector("integer").innerHTML

            let plist = []
            for (let i = 0; i < plistBody.children.length; i += 2) {
                plist.push(new PlistDict(plistBody.children[i].innerHTML, plistBody.children[i + 1], format))
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
    let sheetSelect = document.querySelector("#sheet-select")
    let prevSelected = sheetSelect.value
    sheetSelect.innerText = ""

    let sheets = []
    let noUhd = false
    let isLegacy = false
    let notes = ""

    let version = getSelectedVersion()
    if (
        version == Version.V2204
        || version == Version.V22073
        || version == Version.V22074
    ) {
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
    } else if (version == Version.V2113) {
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
    } else if (version == Version.VLitePinkMoreGames) {
        sheets = [
            "GJ_GameSheet",
            "GJ_LaunchSheet"
        ]
        noUhd = true
        isLegacy = true
        notes = `A GD Lite version that was only released for 14 days - it had a pink More Games button that did nothing when pressed, see it in the middle of GJ_GameSheet! See <a href="https://twitter.com/Misabr0penguin/status/1623083029554950145" target="_blank">this twitter post.</a>`
    }

    if (version == Version.V22073) {
        notes = "Pretty sure this is identical to 2.2074 but it was on my laptop so might as well archive it."
    }

    for (let sheet of sheets) {
        let element = document.createElement("option")
        element.innerText = sheet
        element.value = sheet
        sheetSelect.appendChild(element)
    }

    if (sheets.includes(prevSelected))
        sheetSelect.value = prevSelected

    let versionNotesElement = document.querySelector("#version-notes")
    versionNotesElement.innerHTML = notes

    // remove or add uhd for old sheets
    let definitionSelector = document.querySelector("#quality-select")
    if (definitionSelector.children.length == 2 && noUhd == false) {
        let uhdOption = document.createElement("option")
        uhdOption.innerText = "UHD"
        uhdOption.value = Resolution.uhd
        uhdOption.selected = true // any truthy value
        definitionSelector.appendChild(uhdOption)
    } else if (definitionSelector.children.length == 3 && noUhd) {
        let uhdOption = Array.from(definitionSelector.querySelectorAll("option")).find(el => el.value == Resolution.uhd)
        definitionSelector.removeChild(uhdOption)

        let hdOption = Array.from(definitionSelector.querySelectorAll("option")).find(el => el.value == Resolution.hd)
        hdOption.selected = true // any truthy
    }

    // remove or add size for legacy sheets
    let size = document.querySelector("#size")
    if (isLegacy) {
        size.classList.add("legacy-doesnt-exist")
    } else {
        size.classList.remove("legacy-doesnt-exist")
    }
}

function updateCanvasSize() {
    let canvas = document.querySelector("#canvas")
    let canvasWrap = document.querySelector("#canvas-wrapper")
    let rect = canvasWrap.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    updatePreview()
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
            updateInfoAndPreview()

            return true
        }
    }
}

function updateInfoAndPreview() {
    document.querySelector("#name").innerHTML = currentDict.key
    document.querySelector("#offset").innerHTML = currentDict.spriteOffset
    document.querySelector("#size").innerHTML = currentDict.spriteSize.toString(true)
    document.querySelector("#ssize").innerHTML =  currentDict.spriteSourceSize.toString(true)
    document.querySelector("#rect").innerHTML = currentDict.textureRect
    document.querySelector("#rot").innerHTML = (currentDict.textureRotated ? "True" : "False")

    updatePreview()
}

function updatePreview(useAltCanvas = false) {
    /** @type {HTMLCanvasElement} */
    let canvas
    if (useAltCanvas) {
        canvas = document.querySelector("#preview2")
        canvas.style.display = "block"
    } else {
        canvas = document.querySelector("#preview")
        document.querySelector("#preview2").style.display = "none"
    }

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

    if (document.querySelector("#include-offset").checked) {
        if (currentDict.textureRotated) {
            canvas.style.transform += ` translate(${currentDict.spriteOffset.x}px, ${currentDict.spriteOffset.y}px)`
        } else {
            canvas.style.transform += ` translate(${currentDict.spriteOffset.y}px, ${currentDict.spriteOffset.x}px)`
        }
    }

    if (!useAltCanvas 
        && document.querySelector("#find-portal").checked 
        && currentDict.key.startsWith("portal_")
        && !currentDict.key.includes("extra")) {
        let otherName
        if (currentDict.key.includes("front")) otherName = currentDict.key.replace("front", "back")
        else otherName = currentDict.key.replace("back", "front")

        let other = searchCurrentCombo(otherName, true)
        if (other.result) {
            let prevDict = currentDict
            currentDict = other.result
            updatePreview(true)
            currentDict = prevDict
        } else {
            console.log("portal other side not found!")
        }
    }
}

let animationSpeed = Number(document.querySelector("#animate-speed").value)
function checkShouldAnimate(first) {
    if (currentDict == null) return
    if (!currentDictLocked) return
    if (!document.querySelector("#animate").checked) return

    // see if any other sprites exist that are the in the same animation
    let regex = new RegExp(/^(.+?)_(\d\d\d)\.png$/)
    let match = currentDict.key.match(regex)
    let name = match[1]
    let index = Number(match[2])

    if (first) {
        // skip this iter, dont immediately overwrite sprite, set currentAnimationName
        currentAnimationName = name
        setTimeout(() => {
            checkShouldAnimate(false)
        }, animationSpeed)
        return
    }

    if (name != currentAnimationName) return


    let potentialResetSprite = null
    let found = false
    for (let dict of currentCombo.plist) {
        let match = dict.key.match(regex)
        if (match == null) continue

        if (match[1] == name) {
            // ah ha, found another
            let newIndex = Number(match[2])

            if (newIndex == index + 1) {
                // this is the next one
                currentDict = dict
                found = true
                break
            }

            if (newIndex == 1) {
                // this could potentially be the next one to wrap around to
                potentialResetSprite = dict
            }
        }
    }

    if (!found && potentialResetSprite != null) {
        // nothing found but we have a reset sprite
        currentDict = potentialResetSprite
        found = true
    }

    if (found) {
        // update shit
        updateInfoAndPreview()
    }

    setTimeout(() => {
        checkShouldAnimate(false)
    }, animationSpeed)
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

let currentSearchTerm = ""
let currentSearchIndex = 0

function searchCurrentCombo(name, exact = false) {
    if (!currentCombo) return {
        result: undefined,
        results: 0,
        current: 0
    }

    if (name == currentSearchTerm) {
        currentSearchIndex++
    } else {
        currentSearchIndex = 0
    }
    
    currentSearchTerm = name

    let results
    if (exact) results = currentCombo.plist.filter(dict => dict.key == name)
    else results = currentCombo.plist.filter(dict => dict.key.toLowerCase().includes(name.toLowerCase()))
    
    return {
        result: results[currentSearchIndex % results.length],
        results: results.length,
        current: currentSearchIndex % results.length
    }
}

function populateSelectionFromURL() {
    let hash = new URL(window.location.href).hash
    if (hash == "") return
    
    let sheet = null
    let resolution = null
    let version = null

    let split = hash.split(/(?=[#@\-!])/)
    console.log(split)

    for (let part of split) {
        let term = part.charAt(0)
        part = part.substring(1)

        if (term == "#") {
            // sheet
            sheet = part
            continue
        }

        if (term == "-") {
            // resolution
            resolution = eval(`Resolution.${part}`) ?? Resolution.uhd
            continue
        }

        if (term == "@") {
            // version
            version = eval(`Version.V${part.replace(".", "")}`) ?? Version.V22074
            continue
        }

        if (term == "!") {
            // selected dict
            currentDict = searchCurrentCombo(part).result
            console.log(currentDict)
            if (currentDict) currentDictLocked = true
            continue
        }
    }
    
    if (version != null) document.querySelector("#version-select").value = version
    if (sheet != null) document.querySelector("#sheet-select").value = sheet
    if (resolution != null) document.querySelector("#quality-select").value = resolution
}

// -----------------------------------------------------------------------------

// allow top level await
(async () => {
    document.querySelector("#version-select").addEventListener("change", () => {populateSheetSelect(); updateCurrentCombo()})
    document.querySelector("#sheet-select").addEventListener("change", () => {updateCurrentCombo()})
    document.querySelector("#quality-select").addEventListener("change", () => {updateCurrentCombo()})

    document.querySelector("#canvas").addEventListener("mousemove", tickCursor)
    document.querySelector("#canvas").addEventListener("dblclick", downloadPart)
    document.querySelector("#canvas").addEventListener("contextmenu", copyPart)
    document.querySelector("#canvas").addEventListener("click", event => {
        // returns whether the cursor is hovering over something
        let ret = tickCursor(event)
        if (ret) {
            currentDictLocked = !currentDictLocked
            checkShouldAnimate(true)
        }
        // if not hovering over anything, unlock
        else currentDictLocked = false
    })

    document.querySelector("#animate").addEventListener("change", () => {
        checkShouldAnimate(false)
    })

    document.querySelector("#animate-speed").addEventListener("input", () => {
        animationSpeed = Number(document.querySelector("#animate-speed").value)
    })


    window.addEventListener("resize", updateCanvasSize)
    updateCanvasSize()

    let searchBar = document.querySelector("#search-bar")
    // use keyup instead of input to capture enter key as well
    searchBar.addEventListener("keyup", event => {
        let searchTerm = searchBar.value

        // unrelated key pressed
        if (!event.code.startsWith("Key") && event.code != "Enter" && event.code != "Backspace") {
            return
        }

        if (searchTerm == "") {
            currentDictLocked = false
            document.querySelector("#search-info").innerText = "Type to search..."
            return
        }

        let result = searchCurrentCombo(searchTerm)

        if (result) {
            currentDictLocked = true
            currentDict = result.result
            if (currentDict) {
                updateInfoAndPreview()
                document.querySelector("#search-info").innerText = `Result ${result.current + 1} of ${result.results}`
            } else {
                document.querySelector("#search-info").innerText = `No results!`
            }
        }
    })

    window.addEventListener("keydown", event => {
        if (event.code == "KeyF" && event.ctrlKey) {
            event.preventDefault()
            searchBar.value = ""
            document.querySelector("#search-info").innerText = "Type to search..."
            searchBar.focus()
        }

        if (event.code == "Escape") {
            if (searchBar == document.activeElement) {
                searchBar.value = ""
                searchBar.blur()
            } else {
                currentDictLocked = false
            }
        }
    })

    populateSelectionFromURL() // version + resolution before inital select populate
    populateSheetSelect()
    populateSelectionFromURL() // sheet after populating options
    await updateCurrentCombo() // currentCombo after being set
    populateSelectionFromURL() // currentDict after combo set
    if (currentDict) updateInfoAndPreview()
    draw()
})()
