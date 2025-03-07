class PlistVector {
    /**
     * @param {string} string 
     */
    constructor(string) {
        // string should be formatted like {x,y}
        let split = string.split(",")
        this.x = Number(split[0].replace("{", ""))
        this.y = Number(split[1].replace("}", ""))
    }

    toString(isSize=false) {
        if (isSize) return `${this.x}x${this.y}`
        else return `${this.x}, ${this.y}`
    }

    static createString(x, y) {
        return `{${x},${y}}`
    }
}

class PlistRect {
    /**
     * @param {string} string 
     */
    constructor(string) {
        // string should be formatted like {{x,y},{w,h}}
        let split = string.split(",")
        this.x = Number(split[0].replace("{{", ""))
        this.y = Number(split[1].replace("}", ""))
        this.w = Number(split[2].replace("{", ""))
        this.h = Number(split[3].replace("}}", ""))
    }

    toString() {
        return `${this.w}x${this.h} @ ${this.x}, ${this.y}`
    }

    static createString(x, y, w, h) {
        return `{{${x},${y}},{${w},${h}}}`
    }
}

class PlistDict {
    /**
     * @param {string} key 
     * @param {HTMLElement} plistDictElement 
     * @param {number} format
     */
    constructor(key, plistDictElement, format) {
        this.key = key

        if (format == 3) {
            // post 2.0
            //this.aliases = plistDictElement.children[1].innerHTML
            this.spriteOffset = new PlistVector(plistDictElement.children[3].innerHTML)
            this.spriteSize = new PlistVector(plistDictElement.children[5].innerHTML)
            this.spriteSourceSize = new PlistVector(plistDictElement.children[7].innerHTML)
            this.textureRect = new PlistRect(plistDictElement.children[9].innerHTML)
            this.textureRotated = plistDictElement.children[11].tagName == "true"
        } else {
            // pre 2.0 i think?
            this.spriteOffset = new PlistVector(plistDictElement.children[3].innerHTML)
            this.spriteSize = new PlistVector("{0,0}")
            this.spriteSourceSize = new PlistVector(plistDictElement.children[9].innerHTML)
            this.textureRect = new PlistRect(plistDictElement.children[1].innerHTML)
            this.textureRotated = plistDictElement.children[5].tagName == "true"
        }
    }
}
