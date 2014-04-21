
var CHUNK_BLOCK_SIZE = 16;
var CHUNK_BLOCK_DEPTH = 32;

function DrawrChunk(){
    this.blocks = [];
    for(var x=0; x<CHUNK_BLOCK_SIZE; ++x){
        this.blocks[x] = [];
        for(var y=0; y<CHUNK_BLOCK_SIZE; ++y){
            this.blocks[x][y] = [];
            for(var z=0; z<CHUNK_BLOCK_DEPTH; ++z){
                this.blocks[x][y][z] = 0;
            }
        }
    }
}

DrawrChunk.prototype.set = function(x, y, z, block){
    if(typeof block === "undefined") block = 1;
    if(x < 0 || y < 0 || z < 0 || x > CHUNK_BLOCK_SIZE || y > CHUNK_BLOCK_SIZE || z > CHUNK_BLOCK_DEPTH){
        return false;
    }else{
        this.blocks[x][y][z] = block;
    }
    return true;
}

DrawrChunk.prototype.get = function(x, y, z){
    if(x < 0 || y < 0 || z < 0 || x > CHUNK_BLOCK_SIZE || y > CHUNK_BLOCK_SIZE || z > CHUNK_BLOCK_DEPTH){
        return 0;
    }else{
        return this.blocks[x][y][z];
    }
}

DrawrChunk.prototype.topLayerBelowZ = function(z_layer){
    // only top layer will be visible below whatever z level the user is at
    var points = [];
    for(var x=0; x<CHUNK_BLOCK_SIZE; ++x){
        for(var y=0; y<CHUNK_BLOCK_SIZE; ++y){
            for(var z=z_layer; z<CHUNK_BLOCK_DEPTH; ++z){
                if(this.blocks[x][y][z] == 1){
                    // put the top block on this column
                    points.push(point(x,y,z));
                    // check points below it until all the blocks around it are covered
                    for(var depth=z-1; depth>=0; depth--){
                        if(!get(x-1, y-1, depth) || !get(x-1,y+1,depth) || !get(x+1,y-1,depth) || !get(x+1,y+1,depth)){
                            points.push(point(x,y,z));
                        }
                    }
                    break; // out of this z column
                }
            }
        }
    }
    return points;
}

DrawrChunk.prototype.layersAboveZ = function(z_layer, max_layers){
    var points = [];
    var start_at_z = Math.min(0, z_layers - max_layers);
    for(var x=0; x<CHUNK_BLOCK_SIZE; ++x){
        for(var y=0; y<CHUNK_BLOCK_SIZE; ++y){
            for(var z = start_at_z; z<z_layer; ++z){
                points.push(point(x,y,z));
            }
        }
    }
    return points;
}

DrawrChunk.prototype.naive_draw = function(ctx, offset_x, offset_y){
    var points = [];
    for(var x=0; x<CHUNK_BLOCK_SIZE; ++x){
        for(var y=0; y<CHUNK_BLOCK_SIZE; ++y){
            for(var z=0; z<CHUNK_BLOCK_DEPTH; ++z){
                if(this.get(x,y,z) != 0){
                    points.push(point(x*40 + offset_x, y*40 + offset_y, z*40));
                }
            }
        }
    }
    draw_cubes(ctx, points, 40, ["blue"], true);
}
