

var b = {r: 0, g: 0, b: 0};
var w = {r: 255, g: 255, b: 255};
var r = {r: 255, g: 0, b: 0};
var g = {r: 0, g: 255, b: 0};
var b = {r: 0, g: 0, b: 255};

var img1 = [
    [w,w,w,w,w,w,w,w,w],
    [w,w,b,b,b,b,b,w,w],
    [w,b,w,w,w,w,w,b,w],
    [w,b,w,b,w,b,w,b,w],
    [w,b,w,w,w,w,w,b,w],
    [w,b,w,b,w,b,w,b,w],
    [w,b,w,b,b,b,w,b,w],
    [w,b,w,w,w,w,w,b,w],
    [w,w,b,b,b,b,b,w,w],
    [w,w,w,w,w,w,w,w,w]
];


function perspective_draw(ctx, ptopleft, ptopright, pbotright, pbotleft){
    var iwid = img1[0].length;
    var ihei = img1.length;
    
}