function readTextureRect(rect)
{
    rect = rect.substring(1, rect.length - 1)
    let rects = rect.split("},")
    rects[0] = rects[0].substring(1)
    rects[1] = rects[1].substring(1, rects[1].length - 1)
    rects[0] = rects[0].split(",")
    rects[1] = rects[1].split(",")
    return {
        x: Number(rects[0][0]),
        y: Number(rects[0][1]),
        width: Number(rects[1][0]),
        height: Number(rects[1][1])
    }
}

// https://stackoverflow.com/a/1026087
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
