

var z_scale = 30; // I have no idea why, but it looks right
// 40 in x = 40/15 in z (WHY? who knows)
function xyUnitsToZ(i){
    return i/(z_scale/2);
}

function pointDist(p){
    //return hypot(p.x, p.y, p.z/z_scale);
    
    if(p.x > p.y){
        return hypot(p.x, p.z/z_scale);
    }else{
        return hypot(p.y, p.z/z_scale);
    }
}

function pointDistComp(a,b){
    // really hacky but should work for top-down-only view
    // reeeeeeeally hacky
    // i'm disgusted and amazed at the same time that this works
    //return a.z - b.z;
    if(a.z - b.z){
        return a.z - b.z;
    }else{
        return hypot(a.x, a.y) - hypot(b.x, b.y);
    }
}

function position_from_3d(p, width, height){
    // convert 3d point to 2d point on screen
    
    //var z = xyUnitsToZ(p.z) + 0;
    if(p.z <= 0) DEBUG_MODE_GLOBAL && console.log("tried to draw behind screen");
    var px = p.x/(p.z/z_scale);
    var py = p.y/(p.z/z_scale);
    //var px = p.x/z;
    //var py = p.y/z;
    
    var dx = width/2;
    var dy = height/2;
    
    return {x: px + dx, y: py + dy};
}

function draw_cube_wireframe(ctx, x, y, z, size){
    
    var s = size/2;
    //z = xyUnitsToZ(z);
    var p = function(x,y,z){ return {x:x, y:y, z:z}; };
    var corners_close = [ // closest (minimum z) plane, from top left, clockwise
        p(x-s, y-s, z-xyUnitsToZ(s)),
        p(x+s, y-s, z-xyUnitsToZ(s)),
        p(x+s, y+s, z-xyUnitsToZ(s)),
        p(x-s, y+s, z-xyUnitsToZ(s))
    ];
    var corners_far = [ // farthest plane
        p(x-s, y-s, z+xyUnitsToZ(s)),
        p(x+s, y-s, z+xyUnitsToZ(s)),
        p(x+s, y+s, z+xyUnitsToZ(s)),
        p(x-s, y+s, z+xyUnitsToZ(s))
    ];
    
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;
    
    var pos = function(p){ return position_from_3d(p, width, height); };
    var draw = function(p1, p2){ drawLine(ctx, "black", p1.x, p1.y, p2.x, p2.y, 1); };
    var last_close = 0;
    var last_far = 0;
    for(var i=0; i<4; ++i){
        var corner_close = corners_close[i];
        var corner_far = corners_far[i];
        if(DEBUG_MODE_GLOBAL) console.log(pos(corner_close));
        if(DEBUG_MODE_GLOBAL) console.log(pos(corner_far));
        draw(pos(corner_close), pos(corner_far));
        
        if(!last_close && !last_far){
            last_close = corners_close[3];
            last_far = corners_far[3];
        }
        draw(pos(last_close), pos(corner_close));
        draw(pos(last_far), pos(corner_far));
        last_close = corner_close;
        last_far = corner_far;
    }
    
}

function get_cube_polygons(ctx, x, y, z, size){
    var s = size/2;
    var sForZ = s/(z_scale/2); // why do i need this? who knows
    var p = function(x,y,z){ return {x:x, y:y, z:z}; };
    var cc = [ // closest (minimum z) plane, from top left, clockwise
        p(x-s, y-s, z-sForZ),
        p(x+s, y-s, z-sForZ),
        p(x+s, y+s, z-sForZ),
        p(x-s, y+s, z-sForZ)
    ];
    var cf = [ // farthest plane
        p(x-s, y-s, z+sForZ),
        p(x+s, y-s, z+sForZ),
        p(x+s, y+s, z+sForZ),
        p(x-s, y+s, z+sForZ)
    ];
    
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;
    
    var pos = function(p){ return position_from_3d(p, width, height); };
    
    var close_p = [];
    var far_p = [];
    var top_p = [cc[0], cc[1], cf[1], cf[0]];
    var right_p = [cc[1], cf[1], cf[2], cc[2]];
    var bottom_p = [cc[2], cc[3], cf[3], cf[2]];
    var left_p = [cc[0], cc[3], cf[3], cf[0]];
    for(var i=0; i<4; ++i){
        close_p[i] = cc[i];
        far_p[i] = cf[i];
    }
    var polys = [close_p, far_p, top_p, right_p, bottom_p, left_p];
    return polys;
}

function poly_center_point(poly){
    var sums = point(0,0,0);
    for(var i=0; i<poly.length; ++i){
        sums = addPoints(sums, poly[i]);
    }
    var s = poly.length;
    return point(sums.x/s, sums.y/s, sums.z/s);
}

function draw_cube(ctx, x, y, z, size, color){
    var polys = get_cube_polygons(ctx, x, y, z, size);
    
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;
    
    var pos = function(p){ return position_from_3d(p, width, height); };
    
    // sort by distance from camera
    var sorter = function(a,b){ return pointDistComp(poly_center_point(b), poly_center_point(a)); };
    //var sorter = function(a,b){ return pointDist(poly_center_point(b)) - pointDist(poly_center_point(a)); };
    polys.sort(sorter);
    
    var colorses = ["red", "blue", "black", "green", "purple", "orange"];
    for(var i=0; i<polys.length; ++i){
        var poly2d = polys[i].map(pos);
        if(color){
            fillPolygon(ctx, color, poly2d);
        }else{
            fillPolygon(ctx, colorses[i], poly2d);
        }
    }
    for(var i=0; i<polys.length; ++i){
        var centerp = pos(poly_center_point(polys[i]));
        //fillCircle(ctx, "red", centerp.x, centerp.y, 3);
    }
}

function draw_cubes(ctx, points, size, colors){
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;
    
    //var sorter = function(a,b){ return pointDist(b) - pointDist(a); };
    var sorter = function(a,b){ return pointDistComp(b, a); };
    points.sort(sorter);
    
    for(var i=0; i<points.length; ++i){
        if(colors){
            draw_cube(ctx, points[i].x, points[i].y, points[i].z, size, colors[i]);
        }else{
            draw_cube(ctx, points[i].x, points[i].y, points[i].z, size);
        }
    }
    for(var i=0; i<points.length; ++i){
        //draw_cube_wireframe(ctx, points[i].x, points[i].y, points[i].z, size);
    }
}