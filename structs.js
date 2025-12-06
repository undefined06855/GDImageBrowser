/** @enum */
const Resolution = {
    sd: 0,
    hd: 1,
    uhd: 2
}

/** @enum */
const Version = {
    VLitePinkMoreGames: -1,
    V2113: 0,
    V2204: 1,
    V22073: 2,
    V22074: 3,
    VGeode4100: 4
}

/** @enum */
const FileType = {
    Plist: 0,
    Image: 1
}

// this is a great name and you cannot convince me otherwise
class PlistAndImageComboDeal {
    /**
     * @param {string} name 
     * @param {number} resolution 
     * @param {number} version 
     * @param {HTMLImageElement} imageElement 
     * @param {Array<PlistDict>} plistDictArray 
     */
    constructor(name, resolution, version, imageElement, plistDictArray) {
        this.name = name
        this.resolution = resolution
        this.version = version
        this.image = imageElement
        this.plist = plistDictArray
    }
}
