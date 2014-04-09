 

Drawr.prototype.setup_mouse = function(){
    this.mousex = this.mousey = 0;
    this.mouselastx = this.mouselasty = 0;
    this.mousedown = 0;
    this.screenmove_callback = function(){};
    
    var self = this; // weird interaction with listeners and object methods
    
    this.addEventListener("mapmove", function(){ self.loadNearbyChunks();} ); // custom event listener
    
    // network events
    //this.drawr_client.addEventListener("onupdate", function(x,y){ self.drawr_map.loadChunk(x,y); });
    //this.drawr_client.addEventListener("onchunk", function(x,y,bin){ self.drawr_map.setChunk(x,y,bin); });
    
    var movefunc = function(e){ self.mousemoveEvent(e); };
    var downfunc = function(e){ self.mousedownEvent(e); };
    var upfunc = function(e){ self.mouseupEvent(e); };
    this.stage.addEventListener("mousemove",movefunc,false);
    this.stage.addEventListener("touchmove",movefunc,false);
    this.stage.addEventListener("mousedown",downfunc,false);
    this.stage.addEventListener("touchstart",downfunc,false);
    this.stage.addEventListener("mouseup",upfunc,false);
    this.stage.addEventListener("touchend",upfunc,false);
    
    this.KEY_LEFT = 37;
    this.KEY_UP = 38;
    this.KEY_RIGHT = 39;
    this.KEY_DOWN = 40;
    this.keyspressed = {};
    
    var keydownfunc = function(e){ self.keyDownEvent(e); };
    var keyupfunc = function(e){ self.keyUpEvent(e); };
    window.addEventListener("keydown", keydownfunc, false);
    window.addEventListener("keyup", keyupfunc, false);
    setInterval(function(e){ self.handleKeys(); }, this.frame_time);
    
    var default_onresize = window.onresize || function(){};
    window.onresize = function(){ self.screenResizeEvent(); default_onresize(); }
    
    // mousewheel
    var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel" //FF doesn't recognize mousewheel as of FF3.x
     
    if(document.attachEvent){
        document.attachEvent("on" + mousewheelevt, function(e){ self.mousewheelEvent(e); });
    }else if(document.addEventListener){
        document.addEventListener(mousewheelevt, function(e){ self.mousewheelEvent(e); }, false);
    }
}

Drawr.prototype.addEventListener = function(event, callback){
    if(event == "mapmove"){
        var previous_callback = this.screenmove_callback;
        this.screenmove_callback = function(){ callback(); previous_callback(); }
    }else if(event == "addpoint"){
        var previous_callback = this.addpoint_callback;
        this.addpoint_callback = function(){ callback(); previous_callback(); }
    }
}


Drawr.prototype.screenResizeEvent = function(){
    this.stage.width = window.innerWidth;
    this.stage.height = window.innerHeight;
}

Drawr.prototype.changePixelScale = function(pixel_scale){   // ??
	//store ingameoffsets before scaling and reset to those stored offsets
    var dmap = this.drawr_map;
    var old_pixel_scale = dmap.per_pixel_scaling;
    
    // differences between top-left of window and center in ingame coordinates
    var deltaX = Math.floor(this.getWidth()/2 / old_pixel_scale);
    var deltaY = Math.floor(this.getHeight()/2 / old_pixel_scale);
	var center_offsetX = dmap.getIngameOffsetX() - deltaX;
	var center_offsetY = dmap.getIngameOffsetY() - deltaY;
	
	dmap.per_pixel_scaling = pixel_scale;
	dmap.chunk_onscreen_size = dmap.chunk_block_size * dmap.per_pixel_scaling;
    
    // new deltas in ingame coordinates after resize
    var zoomDeltaX = Math.floor(this.getWidth()/2 / dmap.per_pixel_scaling);
    var zoomDeltaY = Math.floor(this.getHeight()/2 / dmap.per_pixel_scaling);
	
	dmap.setIngameOffsetX(center_offsetX + zoomDeltaX);
	dmap.setIngameOffsetY(center_offsetY + zoomDeltaY);
}



Drawr.prototype.isMoveKeyPressed = function(){ // hold this button and drag with mouse to move screen
    var moveKeyCode = 77; // m
    for(var keyCode in this.keyspressed){
        if(keyCode == moveKeyCode) return this.keyspressed[keyCode];
    }
    return 0;
}

Drawr.prototype.handleKeys = function(){
    var dist_moved = 20;

    for(var keyCode in this.keyspressed){
        if(this.keyspressed[keyCode]){
            if(keyCode == this.KEY_LEFT){
                this.drawr_map.moveX(dist_moved);
            }else if(keyCode == this.KEY_UP){
                this.drawr_map.moveY(dist_moved);
            }else if(keyCode == this.KEY_RIGHT){
                this.drawr_map.moveX(-dist_moved);
            }else if(keyCode == this.KEY_DOWN){
                this.drawr_map.moveY(-dist_moved);
            }
        }
    }
}

Drawr.prototype.keyDownEvent = function(e){
    this.keyspressed[e.keyCode] = 1;
}

Drawr.prototype.keyUpEvent = function(e){
    this.keyspressed[e.keyCode] = 0;
}

Drawr.prototype.getMouseX = function(e){
    if(e.touches){
        var touch = e.touches[0]; //array, for multi-touches
        if(!touch) return;
        return touch.pageX - this.stage.offsetLeft;
    }else{
        if(window.event) return window.event.clientX;
        return e.pageX || e.clientX;
    }
}
Drawr.prototype.getMouseY = function(e){
    if(e.touches){
        var touch = e.touches[0]; //array, for multi-touches
        if(!touch) return;
        return touch.pageY - this.stage.offsetTop;
    }else{
        if(window.event) return window.event.clientY;
        return e.pageY || e.clientY;
    }
}


Drawr.prototype.mousemoveEvent = function(e){
    this.mouselastx = this.mousex;
    this.mouselasty = this.mousey;
    this.mousex = this.getMouseX(e);
    this.mousey = this.getMouseY(e);
    
    if(this.isMoveKeyPressed()){
        var dx = this.mousex - this.mouselastx;
        var dy = this.mousey - this.mouselasty;
        
        this.drawr_map.moveX(dx);
        this.drawr_map.moveY(dy);
    }else if(e.which == 1 || e.touches && e.touches.length <= 1){
        if(this.mousedown){
            this.drawr_map.addPoint(this.mousex, this.mousey, this.map_depth);
        }
    }else if(e.which || e.touches && e.touches.length > 1){
        var dx = this.mousex - this.mouselastx;
        var dy = this.mousey - this.mouselasty;
        
        this.drawr_map.moveX(dx);
        this.drawr_map.moveY(dy);
        // call mapmove event callback
        this.screenmove_callback();
    }
    
    e.preventDefault(); //prevent mouse drag from trying to drag webpage
    if (e.stopPropagation) e.stopPropagation();
    e.cancelBubble = true;
    return false;
}

Drawr.prototype.mousedownEvent = function(e){
    this.mouselastx = this.mousex;
    this.mouselasty = this.mousey;
    this.mousex = this.getMouseX(e) || this.mousex;
    this.mousey = this.getMouseY(e) || this.mousey;
    
    if(e.which == 1 || e.touches && e.touches.length <= 1){ //e.touches if is only 1 touch
        this.mousedown = true;
        this.drawr_map.addPoint(this.mousex, this.mousey, this.map_depth);
    }
    
    e.preventDefault(); //prevent mouse drag from trying to drag webpage
    if (e.stopPropagation) e.stopPropagation();
    e.cancelBubble = true;
    return false;
}

Drawr.prototype.mouseupEvent = function(e){
	//return false;
    // getMouseX(e) may be undefined for a "touchend" event. if so, use previous value
    this.mouselastx = this.mousex;
    this.mouselasty = this.mousey;
    this.mousex = this.getMouseX(e) || this.mousex;
    this.mousey = this.getMouseY(e) || this.mousey;
    
    if(e.which == 1 || e.touches && e.touches.length <= 1){
        this.mousedown = false;
        this.drawr_map.addPoint(this.mousex, this.mousey, this.map_depth);
    }
    
    e.preventDefault(); //prevent mouse drag from trying to drag webpage
    if (e.stopPropagation) e.stopPropagation();
    e.cancelBubble = true;
    return false;
}

Drawr.prototype.mousewheelEvent = function(e){
    var delta = e.detail ? e.detail : e.wheelDelta / (-120);
    console.log(delta);
}
