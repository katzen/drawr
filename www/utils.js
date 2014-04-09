
/*** utils.js V1.0 ***/

function $(id){
    return document.getElementById(id);
}

function drawCircle(ctx,color,x,y,r){
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(x,y,r,0,2*Math.PI);
    ctx.stroke()
}
function fillCircle(ctx,color,x,y,r){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x,y,r,0,2*Math.PI);
    ctx.fill();
}

function drawLine(ctx, color, x1, y1, x2, y2, thickness, cap){
    if(DEBUG_MODE_GLOBAL) console.log("(" + x1 + "," + y1 + ") -> (" + x2 + "," + y2 + ")");
    cap = cap || "round";
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.lineCap = cap;
    ctx.stroke();
}

function fillPolygon(ctx, color, ps){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ps[0].x, ps[0].y);
    for(var i=1; i<ps.length; ++i){
        ctx.lineTo(ps[i].x, ps[i].y);
    }
    ctx.closePath();
    ctx.fill();
}

//////// point functions

function point(x,y,z){
    return {x:x, y:y, z:z};
}

function hypot(x,y,z){
    if(!(typeof x === 'number')){
        return hypot(x.x, x.y, x.z);
    }else if(!z){
        return Math.sqrt(x*x + y*y);
    }else{
        return Math.sqrt(x*x + y*y + z*z);
    }
}

function addPoints(p1, p2){
    return {x: p1.x + p2.x, y: p1.y + p2.y, z: p1.z + p2.z};
}


function mod(m, n) {
    return ((m % n) + n) % n;
}

function now(){
    return (new Date)*1;
}

function replaceColor(ctx, old_r, old_g, old_b, n_r, n_g, n_b){
    var pixels = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    for(var i=0; i<imageData.data.length; i+=4){
        if(pixels.data[i]==old_r && pixels.data[i+1]==old_g && pixels.data[i+2]==old_b){
              imageData.data[i] = n_r;
              imageData.data[i+1] = n_g;
              imageData.data[i+2] = n_b;
        }
    }
    ctx.putImageData(pixels,0,0);
}

// http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
function padl(n, width, z){
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}