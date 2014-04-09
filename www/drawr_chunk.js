
function DrawrChunk(drawr_map, offline_mode){
    this.drawr_map = drawr_map;
    this.offline_mode = offline_mode;
    
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width = drawr_map.chunk_block_size;
    this.canvas.height = this.height = drawr_map.chunk_block_size;
    this.ctx = this.canvas.getContext("2d");
    
    /*this.ctx.imageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;*/
    
    var w = this.canvas.width;
    drawLine(this.ctx, "yellow", 1, 1, w - 1, 1, 1);
    drawLine(this.ctx, "red", w-1, w-1, w-1, 1, 1);
    drawLine(this.ctx, "green", 1, 1, 1, w-1, 1);
    drawLine(this.ctx, "purple", 1, w-1, w-1, w-1, 1);
}
DrawrChunk.prototype.addPoint = function(local_x,local_y,brush,size){
	DrawrBrushes.draw(this.ctx, local_x, local_y, brush, size);
}
DrawrChunk.prototype.load = function(numx, numy){
}
