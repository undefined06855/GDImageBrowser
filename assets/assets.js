let images = {}
let plists = {}
let descriptions = {}

let fileNames = [
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
    "WorldSheet"
]

let suffixes = {
    hd: "-hd",
    sd: "",
    uhd: "-uhd"
}

let filetypes = {
    plist: ".json", // the plist is converted to json!
    image: ".png"
}

for (let name of fileNames)
{
    images[name] = {
        hd: new Image(),
        sd: new Image(),
        uhd: new Image(),
    }
}

for (let name of fileNames)
{
    plists[name] = {
        hd: {},
        sd: {},
        uhd: {},
    }
}
