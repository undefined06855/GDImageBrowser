function waitUntilFinishLoading()
{
    if (loadedAllImages && loadedAllPlists)
    {
        document.querySelector("h5").remove()
        setup()
    }
    else requestAnimationFrame(waitUntilFinishLoading)
}

waitUntilFinishLoading()

let canvas = document.querySelector("#canvas")
let ctx = canvas.getContext("2d")
let preview = document.querySelector("#preview")
let previewCtx = preview.getContext("2d")

let dropdownSheet = document.querySelector("#sheet_select")
let dropdownQuality = document.querySelector("#quality_select")

let mouseX = 0
let mouseY = 0

let chosenQuality = "sd"
let chosenImage = "GJ_GameSheet"

let locked = false

function setup()
{
    for (let imageName in images)
    {
        let option = document.createElement("option")
        option.innerText = imageName
        option.value = imageName
        dropdownSheet.appendChild(option)
    }

    dropdownSheet.addEventListener("input", _ => {
        chosenImage = dropdownSheet.value
        formatCanvas()
    })

    dropdownSheet.value = "GJ_GameSheet"

    dropdownQuality.addEventListener("input", _ => {
        chosenQuality = dropdownQuality.value
        formatCanvas()
    })

    dropdownQuality.value = "sd"

    canvas.addEventListener("mousemove", event => {
        if (!locked)
        {
            mouseX = event.x
            mouseY = event.y
        }
    })

    canvas.addEventListener("dblclick", event => {
        mouseX = event.x
        mouseY = event.y
        locked = true

        ctx.strokeStyle = "#ff0"
    })

    canvas.addEventListener("click", event => {
        mouseX = event.x
        mouseY = event.y

        if (locked) locked = false
        ctx.strokeStyle = "#f00"
    })

    formatCanvas()
    main()
}

function formatCanvas()
{
    let image = images[chosenImage][chosenQuality]

    canvas.width = image.width
    canvas.height = image.height

    if (image.width > image.height)
    {
        canvas.style.width = "100%"
        canvas.style.height = "auto"
        ctx.lineWidth = canvas.width / 150
    }
    else
    {
        canvas.style.width = "auto"
        canvas.style.height = "100%"
        ctx.lineWidth = canvas.height / 150
    }

    canvas.style.aspectRatio = `${image.width} / ${image.height}`

    if (locked) ctx.strokeStyle = "#ff0"
    else        ctx.strokeStyle = "#f00"
}

function main()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let image = images[chosenImage][chosenQuality]
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    let rect = canvas.getBoundingClientRect()

    let multiplier = image.width / rect.width

    let mouseXRelative = (mouseX - rect.left) * multiplier
    let mouseYRelative = (mouseY - rect.top) * multiplier

    let frames = plists[chosenImage][chosenQuality].frames

    let objectSelected = null
    let objectSelectedName = null

    for (let key of Object.keys(frames))
    {
        let object = frames[key]
        let texRect = readTextureRect(object.textureRect)

        let testNormalOrientation = texRect.x <= mouseXRelative && mouseXRelative <= texRect.x + texRect.width && texRect.y <= mouseYRelative && mouseYRelative <= texRect.y + texRect.height
        let testRotatedOrientation = texRect.x <= mouseXRelative && mouseXRelative <= texRect.x + texRect.height && texRect.y <= mouseYRelative && mouseYRelative <= texRect.y + texRect.width
        
        if ((object.textureRotated && testRotatedOrientation) || (!object.textureRotated && testNormalOrientation))
        {
            objectSelected = object
            objectSelectedName = key
        }
    }

    if (objectSelected)
    {
        let texRect = readTextureRect(objectSelected.textureRect)

        if (objectSelected.textureRotated)
        {
            preview.width = texRect.height
            preview.height = texRect.width
            previewCtx.drawImage(canvas, texRect.x, texRect.y, texRect.height, texRect.width, 0, 0, texRect.height, texRect.width)
        }
        else
        {
            preview.width = texRect.width
            preview.height = texRect.height
            previewCtx.drawImage(canvas, texRect.x, texRect.y, texRect.width, texRect.height, 0, 0, texRect.width, texRect.height)
        }

        if (preview.width >= preview.height)
        {
            preview.style.width = "100%"
            preview.style.height = "auto"
        }
        else
        {
            preview.style.width = "auto"
            preview.style.height = "100%"
        }

        ctx.beginPath()
        if (objectSelected.textureRotated) ctx.roundRect(texRect.x, texRect.y, texRect.height, texRect.width, 2)
        else                               ctx.roundRect(texRect.x, texRect.y, texRect.width, texRect.height, 2)
        ctx.stroke()
        ctx.closePath()

        document.querySelector("#name").innerText = "Name: " + objectSelectedName
        document.querySelector("#desc").innerText = "Description: " + (descriptions[objectSelectedName] || "N/A")
        document.querySelector("#aliases").innerText = "Aliases: " + (objectSelected.aliases ? "None" : objectSelected.aliases)
        document.querySelector("#offset").innerText = "Offset: " + objectSelected.spriteOffset
        document.querySelector("#size").innerText = "Size: " + objectSelected.spriteSize
        document.querySelector("#ssize").innerText = "Source size: " + objectSelected.spriteSourceSize
        document.querySelector("#rect").innerText = "Rect: " + objectSelected.textureRect
        document.querySelector("#rot").innerText = "Rotated: " + capitalizeFirstLetter(objectSelected.textureRotated.toString())
    }

    requestAnimationFrame(main)
}