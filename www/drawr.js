
function Drawr(canvas_id, debug_id){
    this.stage = document.getElementById(canvas_id);
    this.debug_div = debug_id && document.getElementById(debug_id) || 0;
    this.ctx = this.stage.getContext("2d");
	/*this.ctx['imageSmoothingEnabled'] = false;
	this.ctx['mozImageSmoothingEnabled'] = false;
	this.ctx['oImageSmoothingEnabled'] = false;
	this.ctx['webkitImageSmoothingEnabled'] = false;
	this.ctx['msImageSmoothingEnabled'] = false;*/
    this.ctx.fillStyle = "black";
    
    this.stage.width = window.innerWidth;
    this.stage.height = window.innerHeight;
    
    //this.drawr_client = drawr_client;
    
    this.drawr_map = new DrawrMap();
    
    this.setup_fps();
    this.setup_mouse();
    this.map_depth = 0;
    
    this.debug_log = [{msg: "Starting...", time: now(), date: new Date()}];
    this.debug_string = "";
    this.update_lock = false;
    
    this.loadNearbyChunks();
    
    var self = this;
    this.game_loop = setInterval(function(){
        self.update();
    }, this.frame_time);
}

Drawr.prototype.setup_fps = function(){
    this.frame_time = 33; // 30 fps
    this.total_frame_count = 0;

    this.fps_counter = 0;
    this.fps = 0;
    this.fpsLastUpdate = now();
}

Drawr.prototype.getWidth = function(){
    return this.stage.width;
}
Drawr.prototype.getHeight = function(){
    return this.stage.height;
}

Drawr.prototype.debug = function(msg_string){
    this.debug_log.unshift({msg: msg_string, time: now(), date: new Date()});
    this.updateDebugString();
}
Drawr.prototype.updateDebugString = function(){
    // Cache the debug string, update it only every second
    if(this.debug_div){
        this.debug_string = ""
        for(var i=0; i<this.debug_log.length; ++i){
            if(now() - this.debug_log[i].time < 30000){
                var s = "[" + padl(this.debug_log[i].date.getHours(),2) + 
                        ":" + padl(this.debug_log[i].date.getMinutes(),2) +
                        ":" + padl(this.debug_log[i].date.getSeconds(),2) + "] ";
                s += this.debug_log[i].msg + "<br/>";
                this.debug_string += s;
            }
        }
    }
}
Drawr.prototype.writeDebug = function(){
    if(this.debug_div){
        this.debug_div.innerHTML += this.debug_string;
    }
}

Drawr.prototype.refresh = function(){
    this.drawr_map.refresh(Math.max(this.getWidth(), this.getHeight()));
}

Drawr.prototype.loadNearbyChunks = function(){
    this.drawr_map.loadNearbyChunks(Math.max(this.getWidth(), this.getHeight()));
}

Drawr.prototype.freeFarChunks = function(){
    this.drawr_map.freeFarChunks(Math.max(this.getWidth(), this.getHeight()));
}



                var dumb_points = [];
                for(var i=0;i<3;++i){
                    var x = (Math.floor(3*Math.random())-1)*40;
                    var y = (Math.floor(3*Math.random())-1)*40;
                    var z = i + 20; //Math.floor(3*Math.random()) + 20;
                    dumb_points.push(point(x,y,z));
                }
                function dumb(n){return Math.max(-1*40, Math.min(1*40, n));}
                function ugh(p){
                    var delx = (Math.floor(3*Math.random()) - 1)*40;//(Math.floor(3*Math.random()) - 1)*40;
                    var dely = (Math.floor(3*Math.random()) - 1)*40;//(Math.floor(3*Math.random()) - 1)*40;
                    return {x: dumb(p.x+delx), y: dumb(p.y+dely), z: p.z};
                }
                
Drawr.prototype.update = function(){
    if(this.update_lock) return; // only allow 1 instance of update to run at a time
    this.update_lock = true;
    
    this.total_frame_count++;
    this.fps_counter++;
    var nowTime = now();
    if(this.debug_div) this.debug_div.innerHTML = this.fps.toFixed(1) + " fps<br/>";
    if(nowTime - this.fpsLastUpdate > 1000){
        this.fps = this.fps_counter;
        this.fpsLastUpdate = nowTime;
        this.fps_counter = 0;
        
        this.updateDebugString(); // update this every second while we're at it
        /////////this.freeFarChunks();
        
        ////////
        dumb_points = dumb_points.map(ugh);
    }
    this.writeDebug();
    
    this.ctx.fillStyle = "rgb(255,255,255)";
    this.ctx.fillRect(0,0,this.getWidth(),this.getHeight());
    
    
    
    var colors = ["red", "blue", "black", "green", "purple", "orange", "gray", "yellow"];
    draw_cubes(this.ctx, dumb_points, 40, colors);
    
    
    
    var ok_points = [];
    for(var i=0;i<3;++i){
        var x = 6*40;
        var y = -3*40;
        var derp = Math.cos(this.total_frame_count*5 / 180 * 3.14159) + 2;
        //var z = (i*derp)*40 + 20; 
        var z = xyUnitsToZ((i*derp)*40) + 20;
        ok_points.push(point(x,y,z));
    }
    draw_cubes(this.ctx, ok_points, 40, colors);
    //for(var i=0;i<3;++i){
    //    draw_cube_wireframe(this.ctx, ok_points[i].x, ok_points[i].y, ok_points[i].z, 40);
    //}
    
    
    
    var x = 200 * Math.cos(this.total_frame_count / 180 * 3.14159);
    var y = 200 * Math.sin(this.total_frame_count / 180 * 3.14159);
    var z = 20; //20 * Math.sin(this.total_frame_count * 5 / 180 * 3.14159) + 21;
    
    draw_cube(this.ctx, x, y, z, 30);
    draw_cube(this.ctx, x+50, y, z, 40);
    
    //this.drawr_map.draw(this.ctx);

    this.update_lock = false;
}


