let loadedImages = 0
let totalImages = Object.keys(images).length * 3
let loadedAllImages = false

let loadedPlists = 0
let totalPlists = totalImages + 1 // includes descriptions.json
let loadedAllPlists = false

for (let imageName in images)
{
    let imageObject = images[imageName]
    for (let imageType in imageObject)
    {
        let image = imageObject[imageType]
        
        image.addEventListener("load", _ => {
            loadedImages++

            document.querySelector("h5").innerText = `(Loading ${loadedImages + loadedPlists}/${totalImages + totalPlists})`

            if (loadedImages == totalImages) loadedAllImages = true
        })

        image.src = `./assets/${imageType}/${imageName}${suffixes[imageType]}${filetypes.image}`
    }
}

for (let plistName in plists)
{
    let plistObject = plists[plistName]
    for (let plistType in plistObject)
    {
        fetch(`./assets/${plistType}/${plistName}${suffixes[plistType]}${filetypes.plist}`)
        .then(r => r.json())
        .then(json => {
            loadedPlists++

            document.querySelector("h5").innerText = `(Loading ${loadedImages + loadedPlists}/${totalImages + totalPlists})`
            
            if (loadedPlists == totalPlists) loadedAllPlists = true

            plistObject[plistType] = json
        })
    }
}

fetch("./assets/custom/descriptions.json")
.then(r => r.json())
.then(json => {
    descriptions = json
    loadedPlists++
    if (loadedPlists == totalPlists) loadedAllPlists = true
})
