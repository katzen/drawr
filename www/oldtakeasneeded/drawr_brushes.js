function DrawrBrushes(onload_continuation){
    this.brushes = [];
	
	this.named_colors = [
		{r: 0, g: 0, b: 0}, 		//black
		{r: 255, g: 255, b: 0}, 	//yellow
		{r: 255, g: 128, b: 0},		//orange
		{r: 255, g: 0, b: 0},		//red
		{r: 128, g: 64, b: 0},		//brown
		{r: 255, g: 0, b: 255},		//fuschia
		{r: 0, g: 0, b: 255},		//blue
		{r: 0, g: 255, b: 0},		//bright green
		{r: 128, g: 128, b: 128},	//grey
		{r: 255, g: 255, b: 255},	//white
	];
	this.brush_names = ["circle","square","cat","cat32","kappa","custom"]; //"dota"];
    this.brush_types = ["brush","brush","stamp","stamp","stamp"]; //"stamp"];
	this.brush_variations = [this.named_colors.length, this.named_colors.length, 4, 1, 1, 0]; //102];
	
	this.selected_brush = 0;
    this.brush_size = 1;
	this.size_variations = [1, 4, 8, 16, 32];
    
    this.count_to_load = 0;
    this.count_loaded = 0;
    
	//load brushes and stamps
	for(var i=0; i<this.brush_names.length; ++i){
		name = this.brush_names[i];
		for (var j = 0; j<this.brush_variations[i]; ++j){
			var type = this.brush_types[i];
			if (type == "brush"){
				var sized_images = [];
				var temp_img = new Image();
				var brush_obj = {
					img: temp_img,
					name: name,
                    sizes: [],
					sized_images: [],
					color: this.named_colors[j],
					type: type,
					loaded: 1 - this.size_variations.length
				}
				for (var k = 0; k<this.size_variations.length;++k){
					var temp_img = new Image();
                    this.count_to_load++; // new image to load
					var size = this.size_variations[k];
					temp_img.src = "brushes/"+name+"/"+size+".png"; //brushes/circle/0/16.png
					sized_images.push(temp_img);
                    brush_obj.sizes.push(size);
					
					var self_ref = this;
                    
                    // create a closure for the continuation -- pass the context
                    (function(i,j,k,size,brush_obj,temp_img){
                        temp_img.onload = function(){
                            var c = brush_obj.color;
                            brush_obj.sized_images[k] = DrawrBrushes.setImageColor(temp_img, size, c.r, c.g, c.b);
                            brush_obj.loaded += 1;
                            self_ref.count_loaded++;
                            if (self_ref.count_loaded == self_ref.count_to_load){
                                onload_continuation();
                            }
                        };
                    })(i,j,k,size,brush_obj,temp_img);
				}
				brush_obj.sized_images = sized_images;
				this.brushes.push(brush_obj);
			}
			else if (type == "stamp"){
				var temp_img = new Image();
                this.count_to_load++; // new image to load
				temp_img.src = "brushes/" + name + "/" + j + ".png";
				var brush_name = name + j;
				
				var brush_obj = {
					img: temp_img, 
					name: brush_name, 
                    path: "brushes/" + name + "/" + j + ".png",
					sized_images: null,
					color: {r: 255, g: 255, b: 255},
					type: type, 
					loaded: 0
				};
				
				var self_ref = this;
				temp_img.onload = function(){
					brush_obj.loaded = 1;
                    self_ref.count_loaded++;
                    if (self_ref.count_loaded == self_ref.count_to_load){
                        onload_continuation();
                    }
				};
				this.brushes.push(brush_obj);
			}
		}
	}
}

DrawrBrushes.prototype.getDefaultPath = function(){
    return "brushes/"+this.brush_names[0]+"/"+this.brush_size+".png"
}

DrawrBrushes.prototype.getBrushes = function(){
    return this.brushes;
}

DrawrBrushes.prototype.getBrushNames = function(){
	return this.brush_names;
}

DrawrBrushes.prototype.selectBrush = function(brush){
    if(brush + '' == (1*brush) + ''){ // if brush by number
        this.selected_brush = 1*brush;
    }else{
        for(var i=0; i<this.brushes.length; ++i){
            if(this.brushes[i].name == brush){
                this.selected_brush = i;
                return this.selected_brush;
            }
        }
        this.selected_brush = 0;
        return this.selected_brush;
    }
}

DrawrBrushes.prototype.getBrush = function(){
    return this.brushes[this.selected_brush];
}

DrawrBrushes.prototype.getBrushSize = function(){
	return this.brush_size;
}

DrawrBrushes.prototype.setBrushSize = function(size){
	this.brush_size = size;
}

DrawrBrushes.brushToPath = function(brush, size){
    if(brush.type == "brush"){
        return "brushes/"+brush.name+"/"+size+".png";
    }else{
        return brush.path;
    }
}

DrawrBrushes.setImageColor = function(img, size, r, g, b){
    var ctemp = document.createElement('canvas');
    ctemp.width = size;
    ctemp.height = size;
    var ctxtemp = ctemp.getContext("2d");
    
    ctxtemp.drawImage(img, 0, 0);
    var img_data = ctxtemp.getImageData(0, 0, ctemp.width, ctemp.height);
    for (var i = 0; i < img_data.data.length; i+= 4){
        img_data.data[i] = r;
        img_data.data[i+1] = g;
        img_data.data[i+2] = b;
    }
    ctxtemp.putImageData(img_data,0,0);
    
    var imgnew = new Image();
    imgnew.src = ctemp.toDataURL("image/png");
    return imgnew;
}

DrawrBrushes.setBrushColor = function(brush, r, g, b){
    if(r && g && b){
        if(r < 0 || g < 0 || b < 0 || r > 255 || g > 255 || b > 255) return 0;
        brush.color.r = r;
        brush.color.g = g;
        brush.color.b = b;
    }else{
        brush.color.r = r.r;
        brush.color.g = r.g;
        brush.color.b = r.b;
    }
    
    for(var k=0; k<brush.sizes.length; ++k){
        var img = DrawrBrushes.setImageColor(brush.sized_images[k], brush.sizes[k], brush.color.r, brush.color.g, brush.color.b);
        brush.sized_images[k] = img;
    }
}

DrawrBrushes.draw = function(ctx, x, y, brush, size){
    //console.trace();
	var s = Math.floor(size/2);
	if (brush.type == "brush"){
        var index = brush.sizes.indexOf(size);
		
        if(index >= 0){
            var brush_img = brush.sized_images[index];
            ctx.drawImage(brush_img, x-s, y-s, size, size);
        }
	}else if (brush.type == "stamp"){
		var brush_img = brush.img;
		
		ctx.drawImage(brush_img, x-s, y-s, size, size);
	}
}