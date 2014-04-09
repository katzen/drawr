

var z_scale = 30; // I have no idea why, but it looks right

function position_from_3d(p, width, height){
    // convert 3d point to 2d point on screen
    
    if(p.z <= 0) DEBUG_MODE_GLOBAL && console.log("tried to draw behind screen");
    var px = p.x/(p.z/z_scale);
    var py = p.y/(p.z/z_scale);
    
    var dx = width/2;
    var dy = height/2;
    
    return {x: px + dx, y: py + dy};
}

function draw_cube_wireframe(ctx, x, y, z, size){
    
    var s = size/2;
    var sForZ = s/(z_scale/2); // why do i need this? who knows
    var p = function(x,y,z){ return {x:x, y:y, z:z}; };
    var corners_close = [ // closest (minimum z) plane, from top left, clockwise
        p(x-s, y-s, z-sForZ),
        p(x+s, y-s, z-sForZ),
        p(x+s, y+s, z-sForZ),
        p(x-s, y+s, z-sForZ)
    ];
    var corners_far = [ // farthest plane
        p(x-s, y-s, z+sForZ),
        p(x+s, y-s, z+sForZ),
        p(x+s, y+s, z+sForZ),
        p(x-s, y+s, z+sForZ)
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

function draw_cube(ctx, x, y, z, size){
    var polys = get_cube_polygons(ctx, x, y, z, size);
    
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;
    
    var pos = function(p){ return position_from_3d(p, width, height); };
    
    // sort by distance from camera
    var sorter = function(a,b){ return hypot(poly_center_point(b)) - hypot(poly_center_point(a)); };
    polys.sort(sorter);
    
    for(var i=0; i<6; ++i){
        DEBUG_MODE_GLOBAL && console.log(poly_center_point(polys[i]));
    }
    
    var colorses = ["red", "blue", "black", "green", "purple", "orange"];
    for(var i=0; i<polys.length; ++i){
        var poly2d = polys[i].map(pos);
        fillPolygon(ctx, colorses[i], poly2d);
    }
    for(var i=0; i<polys.length; ++i){
        var centerp = pos(poly_center_point(polys[i]));
        fillCircle(ctx, "red", centerp.x, centerp.y, 3);
    }
}