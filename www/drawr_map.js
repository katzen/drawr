

function DrawrMap(drawr_client, offline_mode){
    this.drawr_client = drawr_client;
    this.offline_mode = offline_mode || 1;
    
	this.chunk_block_size = 256;
	this.per_pixel_scaling = 2; // pixel is 2x2
	this.chunk_onscreen_size = this.chunk_block_size * this.per_pixel_scaling;
	
    // hash of chunks - not array because we need negative and positive locations, and to be able to skip some
    this.chunks = {}; // keyed by xth chunk, value is a hash keyed by yth chunk
    this.chunks_loaded = [];
    
    this.offsetX = 0; // offset in client pixels of top left of chunk (0,0)
    this.offsetY = 0;
}

DrawrMap.prototype.setOfflineMode = function(offline_mode){
    this.offline_mode = offline_mode;
}

DrawrMap.prototype.getIngameOffsetX = function(){
	return Math.floor(this.offsetX/this.per_pixel_scaling);
}

DrawrMap.prototype.setIngameOffsetX = function(offsetX){
	this.offsetX = offsetX * this.per_pixel_scaling;
}

DrawrMap.prototype.getIngameOffsetY = function(){
	return Math.floor(this.offsetY/this.per_pixel_scaling);
}

DrawrMap.prototype.setIngameOffsetY = function(offsetY){
	this.offsetY = offsetY * this.per_pixel_scaling;
}

DrawrMap.prototype.moveX = function(dist){
    this.offsetX += dist;
}

DrawrMap.prototype.moveY = function(dist){
    this.offsetY += dist;
}

DrawrMap.prototype.loadChunk = function(chunk_numx, chunk_numy){
    // This function ensures that there's a DrawrChunk in this chunk location, then
    // it starts loading the chunk image from the server.
    // The actual chunk from the server MIGHT NOT BE LOADED YET AFTER THIS FUNCIONT RETURNS!!
    
    if(!this.chunks.hasOwnProperty(chunk_numx)){
        this.chunks[chunk_numx] = {};
    }
    if(!this.isChunkLoaded(chunk_numx, chunk_numy)){
        this.chunks[chunk_numx][chunk_numy] = new DrawrChunk(this, this.offline_mode);
    }
    this.chunks[chunk_numx][chunk_numy].load(chunk_numx, chunk_numy);
    
    this.chunks_loaded.push({x: chunk_numx, y: chunk_numy}); // this array isn't used i think, not necessary. will see.
}

DrawrMap.prototype.setChunk = function(chunk_numx, chunk_numy, bin_img){
    var base64url = "data:image/png;base64," + btoa(bin_img);
    if(!this.chunks.hasOwnProperty(chunk_numx)){
        this.chunks[chunk_numx] = {};
    }
    if(!this.isChunkLoaded(chunk_numx, chunk_numy)){
        this.chunks[chunk_numx][chunk_numy] = new DrawrChunk(this, this.offline_mode);
    }
    this.chunks[chunk_numx][chunk_numy].setImageUrl(base64url);
}

DrawrMap.prototype.unloadChunk = function(chunk_numx, chunk_numy){
    if(this.isChunkLoaded(chunk_numx, chunk_numy)){
        this.chunks[chunk_numx][chunk_numy] = 0;
    }
}

DrawrMap.prototype.isChunkLoaded = function(chunk_numx, chunk_numy){
    if(this.chunks.hasOwnProperty(chunk_numx) &&
       this.chunks[chunk_numx].hasOwnProperty(chunk_numy) &&
       this.chunks[chunk_numx][chunk_numy]){
        return true;
    }else{
        return false;
    }
}

DrawrMap.prototype.foreachChunk = function(block){
    for(var numx in this.chunks){
        if(this.chunks.hasOwnProperty(numx)){
            for(var numy in this.chunks[numx]){
                if(this.chunks[numx].hasOwnProperty(numy)){
                    if(this.isChunkLoaded(numx,numy)){
                        block(numx,numy);
                    }
                }
            }
        }
    }
}

DrawrMap.prototype.refresh = function(viewer_radius){
    this.chunks = {};
    this.loadNearbyChunks(viewer_radius);
}

DrawrMap.prototype.loadNearbyChunks = function(viewer_radius){
    // viewer_radius is max(screen width, screen height), and is approximately 1 "screen length"
    // load all chunks within 1 screen length away from what is visible
    // load from the center out! <---- TODO!!!
    var ingameX = -this.getIngameOffsetX();
    var ingameY = -this.getIngameOffsetY();
    var ingameRadius = viewer_radius/this.per_pixel_scaling;
    
    //ingameX is topleft of screen. go 1 screen to right side of screen, then 1 more to fill out the radius
    var chunk_min_x = Math.floor((ingameX - ingameRadius) / this.chunk_block_size);
    var chunk_max_x = Math.floor((ingameX + 2*ingameRadius) / this.chunk_block_size);
    var chunk_min_y = Math.floor((ingameY - ingameRadius) / this.chunk_block_size);
    var chunk_max_y = Math.floor((ingameY + 2*ingameRadius) / this.chunk_block_size);
    
    var str = "load (" + chunk_min_x + "," + chunk_min_y + ") -> (" + chunk_max_x + "," + chunk_max_y + ") ";
    var didit = false;
    
    /*for(var i=chunk_min_x; i <= chunk_max_x; ++i){
        for(var j=chunk_min_y; j <= chunk_max_y; ++j){
            if(!this.isChunkLoaded(i, j)){
                this.loadChunk(i,j);
                str += "[" + i + "," + j + "] ";didit = true;
            }
        }
    }*/
    
    // load from the center out
    var center_x = Math.floor((chunk_max_x + chunk_min_x)/2);
    var center_y = Math.floor((chunk_max_y + chunk_min_y)/2);
    var total_layers = Math.max(chunk_max_x - center_x, chunk_max_y - center_y) + 1;
    
    var chunks_written = []; // store the chunks already written to, to avoid redundancy
    var self = this;
    var load = function(x,y){ // helper function - load chunk only if we haven't already loaded it yet in this call to loadNearbyChunks
        var chunk_written_id = x + ":" + y;
        if(chunks_written.indexOf(chunk_written_id) < 0){
            chunks_written.push(chunk_written_id);
            if(!self.isChunkLoaded(x, y)){
                self.loadChunk(x,y);
                str += "[" + x + "," + y + "] ";didit = true;
            }
        }
    };
    for(var layer=0; layer<total_layers; ++layer){
        var y_top = center_y - layer;
        var y_bot = center_y + layer;
        var x_left = center_x - layer;
        var x_right = center_x + layer;
        // load top and bottom rows of this layer, around already loaded layers
        for(var x = x_left; x <= x_right; ++x){
            load(x, y_top);
            load(x, y_bot);
        }
        // load left and right sides of this layer, around already loaded layers
        for(var y = y_top; y <= y_bot; ++y){
            load(x_left, y);
            load(x_right, y);
        }
    }
    
    didit && DEBUG_MODE_GLOBAL && console.log(str);
}

DrawrMap.prototype.freeFarChunks = function(viewer_radius){
    // viewer_radius is max(screen width, screen height), and is approximately 1 "screen length"
    // free all chunks outside 2 screen lengths away from what is visible
    var ingameX = -this.getIngameOffsetX();
    var ingameY = -this.getIngameOffsetY();
    var ingameRadius = viewer_radius/this.per_pixel_scaling;
    
    //ingameX is topleft of screen. go 1 screen to right side of screen, then 2 more to fill out the radius
    var chunk_min_x = Math.floor((ingameX - 2*ingameRadius) / this.chunk_block_size);
    var chunk_max_x = Math.floor((ingameX + 3*ingameRadius) / this.chunk_block_size);
    var chunk_min_y = Math.floor((ingameY - 2*ingameRadius) / this.chunk_block_size);
    var chunk_max_y = Math.floor((ingameY + 3*ingameRadius) / this.chunk_block_size);
    
    var str = "free (" + chunk_min_x + "," + chunk_min_y + ") -> (" + chunk_max_x + "," + chunk_max_y + ") ";
    var didit = false;
    
    var self = this;
    this.foreachChunk(function(numx, numy){
        if(numx < chunk_min_x ||
           numy < chunk_min_y ||
           numx > chunk_max_x ||
           numy > chunk_max_y){
            self.unloadChunk(numx, numy);
            str += "[" + numx + "," + numy + "] ";didit = true;
        }
    });
    
    didit && DEBUG_MODE_GLOBAL && console.log(str);
}

DrawrMap.prototype.addPointRelative = function(x, y, screenOffsetX, screenOffsetY, brush){
    // x,y, offsets are true pixels per client
    var relx = x + screenOffsetX;
    var rely = y + screenOffsetY;
    this.addPoint(relx, rely, brush);
}

  
DrawrMap.prototype.addPoint = function(x,y,brush,size){
    
    // if(this.per_pixel_scaling < 1) return; // don't do this while we're in dev mode
    
    x = x - this.offsetX;
    y = y - this.offsetY;

    var gamex = Math.floor(x/this.per_pixel_scaling); // convert to ingame (big) pixels
    var gamey = Math.floor(y/this.per_pixel_scaling);
    
    var chunks_affected = this.getChunksAffected(gamex, gamey, brush, size);
    var chunks_local_coords = this.getChunkLocalCoordinates(gamex, gamey, chunks_affected, brush);
    
    var chunks_written = []; // store the chunks already written to, to avoid redundancy
    var self = this;
    
    for(var i=0; i<4; ++i){
        if(chunks_affected[i] && chunks_local_coords[i]){
            var chunk_numx = chunks_affected[i].x;
            var chunk_numy = chunks_affected[i].y;
            var chunk_written_id = chunk_numx + ":" + chunk_numy;
            if(chunks_written.indexOf(chunk_written_id) < 0){
                if(this.isChunkLoaded(chunk_numx, chunk_numy)){
                    var chunk = this.chunks[chunk_numx][chunk_numy];
                    var localx = chunks_local_coords[i].x;
                    var localy = chunks_local_coords[i].y;
                    chunk.addPoint(localx, localy, brush,size);
                    
                    /***** I FEEL LIKE THIS SHOULD BE ABSTRACTED BETTER *****/
                    /*// make new thread
                    (function(chunk_numx, chunk_numy, localx, localy, brush, size){
                        setTimeout( function(){
                            self.drawr_client.addPoint(chunk_numx, chunk_numy, localx, localy, brush, size);
                        }, 0);
                    })(chunk_numx, chunk_numy, localx, localy, brush, size);
                    */
                }else{
                    console.log("Chunk not loaded: (" + chunk_numx + ", " + chunk_numy + ")");
                }
                chunks_written.push(chunk_written_id);
            }
        }
    }
    /***** I FEEL LIKE THIS SHOULD BE ABSTRACTED BETTER *****/
    // make new thread
    (function(gamex, gamey, brush, size){
        setTimeout( function(){
            self.drawr_client.addPoint(gamex, gamey, brush, size);
        }, 0);
    })(gamex, gamey, brush, size);
}

DrawrMap.prototype.oldAddPoint = function(x,y,brush){
    // DEPRECATED - will incorrectly draw near the edge of chunks
    // find where to add to chunk
    var gamex = Math.floor(x/this.per_pixel_scaling); // convert to ingame (big) pixels
    var gamey = Math.floor(y/this.per_pixel_scaling);
    var chunk_numx = Math.floor(gamex / this.chunk_block_size); // calculate which chunk this pixel is in
    var chunk_numy = Math.floor(gamey / this.chunk_block_size);
    var chunk_localx = gamex % this.chunk_block_size; // pixel location in chunk local coordinates
    var chunk_localy = gamey % this.chunk_block_size; 
    
    if(this.isChunkLoaded(chunk_numx, chunk_numy)){
        var chunk = this.chunks[chunk_numx][chunk_numy];
        chunk.addPoint(chunk_localx, chunk_localy, brush);
    }else{
        console.log("Chunk not loaded: (" + chunk_numx + ", " + chunk_numy + ")");
    }
}

DrawrMap.prototype.getChunkLocalCoordinates = function(gamex, gamey, chunk_nums_affected, brush){
    // calculate pixel location in local coordinates of each of the 4 possible chunks.
    // getChunksAffected will always return in this order: topleft, bottomleft, topright, bottomright 
    // Preserve this order in this return
    // this function will probably explode if brush size > this.chunk_block_size. that should never happen.
    
    var chunk_general_localx = mod(gamex, this.chunk_block_size); // these are correct for the chunk where the *CENTER OF THE BRUSH* is
    var chunk_general_localy = mod(gamey, this.chunk_block_size); 
    
    var chunk_numx = Math.floor(gamex / this.chunk_block_size); // calculate which chunk the *CENTER OF THE BRUSH* is in
    var chunk_numy = Math.floor(gamey / this.chunk_block_size);
    
    var chunk_local_coords = [];
    for(var i=0; i<4; ++i){
        if(chunk_nums_affected[i]){
            var dx = chunk_numx - chunk_nums_affected[i].x;
            var dy = chunk_numy - chunk_nums_affected[i].y;
            chunk_local_coords.push({x: chunk_general_localx + dx * this.chunk_block_size,
                                     y: chunk_general_localy + dy * this.chunk_block_size }); // this is beautiful
        }else{
            chunk_local_coords.push(0);
        }
        
    }
    return chunk_local_coords;
}

DrawrMap.prototype.getChunksAffected = function(gamex, gamey, brush, size){
    // To find chunks affected: find 1 or more chunks for each 4 points of the square mask of the brush
    // getChunksAffected will always return in this order: topleft, bottomleft, topright, bottomright
    // if one of those 4 chunks isn't loaded, log it, and its location in the return array will be null
    
    var chunks_found = [];
    var brush_delta = size/2;
    // coordinates of the 4 coordinates of the brush, in the correct order
    var brush_xs = [gamex - brush_delta, gamex - brush_delta, gamex + brush_delta, gamex + brush_delta];
    var brush_ys = [gamey - brush_delta, gamey + brush_delta, gamey - brush_delta, gamey + brush_delta];
    
    for(var i=0; i<4; ++i){
        var chunk_numx = Math.floor(brush_xs[i] / this.chunk_block_size); // calculate which chunk this (ingame) pixel is in
        var chunk_numy = Math.floor(brush_ys[i] / this.chunk_block_size);
        if(this.isChunkLoaded(chunk_numx, chunk_numy)){
            chunks_found.push({x: chunk_numx, y: chunk_numy});
        }else{
            chunks_found.push(0); // preserve the order of the chunks in the return value!
            console.log("Chunk not loaded: (" + chunk_numx + ", " + chunk_numy + ")");
        }
    }
    return chunks_found;
}

DrawrMap.prototype.draw = function(ctx){
    /*ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.drawImage(this.canvas, 0, 0, this.chunk_block_size*this.per_pixel_scaling, this.chunk_block_size*this.per_pixel_scaling); //x, y, width, height
    */
    
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    
    var self = this;
    this.foreachChunk(function(chunk_numx, chunk_numy){
        var onscreenx = chunk_numx * self.chunk_onscreen_size + self.offsetX;
        var onscreeny = chunk_numy * self.chunk_onscreen_size + self.offsetY;
        var chunk_canvas = self.chunks[chunk_numx][chunk_numy].canvas;
        ctx.drawImage(chunk_canvas, onscreenx, onscreeny, self.chunk_onscreen_size, self.chunk_onscreen_size);
    });
}


// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Canvas_tutorial/Using_images
// http://www.w3schools.com/tags/canvas_drawimage.asp
// http://stackoverflow.com/questions/10525107/html5-canvas-image-scaling-issue