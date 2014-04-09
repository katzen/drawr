

function DrawrClient(server){
    this.server = server || "localhost:27182";
    this.chunk_update_callback = function(){};
    this.chunk_sent_callback = function(){};
}

DrawrClient.prototype.start = function(){
    if("WebSocket" in window){
        this.socket = new WebSocket("ws://" + this.server);
        var self = this;
        
        this.socket.onopen = function(){
            //this.socket.send("PONY");
            //alert("SENT");
            console.log("DrawrClient: connected to " + self.server);
        };
        this.socket.onclose = function(e){
            alert("server connection closed");
        };
        this.socket.onerror = function(e){
            console.log("socket error. " + e.toString());
            // disconnect + reconnect?
        };
        
        this.socket.onmessage = function(e){
            self.handleMessage(e);
        };
        
        this.ping_timer = setInterval(function(){ self.sendPing(); }, 5000);
    }
}

DrawrClient.prototype.addEventListener = function(event, callback){
    if(event == "onupdate"){
        this.chunk_update_callback = callback;
    }else if(event == "onchunk"){
        this.chunk_sent_callback = callback;
    }
}

DrawrClient.prototype.stop = function(){
    if(this.isConnected()){
        this.socket.close();
    }
}

DrawrClient.prototype.getServer = function(){
    return this.server;
}

DrawrClient.prototype.isConnected = function(){
    return this.socket && this.socket.readyState == 1;
}

DrawrClient.prototype.sendPing = function(){
    if(this.isConnected()){
        this.socket.send("PING");
    }else{
        //console.log("PING: not connected - STOPPING");
        clearInterval(this.ping_timer);
    }
}

DrawrClient.prototype.handleMessage = function(e){
    var rec_msg = e.data;
    var msg = rec_msg.split(":");
    if(msg[0] == "UPDATE"){
        DEBUG_MODE_GLOBAL && console.log("DrawrClient recv: " + rec_msg);
        if(msg.length >= 3){
            var numx = msg[1];
            var numy = msg[2];
            this.chunk_update_callback(numx, numy);
        }
    }else if(msg[0] == "CHUNK"){
        // websockets doesn't support binary data yet -.-
        // "WebSocket connection to 'ws://127.0.0.1:27182/' failed: Could not decode a text frame as UTF-8."
        if(msg.length >= 4){
            var numx = msg[1];
            var numy = msg[2];
            var offset = msg[0].length + msg[1].length + msg[2].length + 3;
            var binary_img = msg.substr(offset);
            this.chunk_sent_callback(numx, numy, binary_img);
        }
    }else{
        DEBUG_MODE_GLOBAL && console.log("DrawrClient recv [unknown]: " + rec_msg);
    }
}

DrawrClient.prototype.setBrush = function(brush, size){
    if(this.isConnected()){
        if(!size){
            size = brush.getBrushSize();
            brush = brush.getBrush();
        }
        var path = DrawrBrushes.brushToPath(brush, size);
        var rgb = brush.color.r + ":" + brush.color.g + ":" + brush.color.b;
        this.socket.send("SETBRUSH:" + path + ":" + size + ":" + rgb);
    }else{
        //console.log("SETBRUSH: not connected");
    }
}

DrawrClient.prototype.addPoint = function(x, y, brush, size){
    if(this.isConnected()){
        if(brush){
            if(!size){
                size = brush.getBrushSize();
                brush = brush.getBrush();
            }
            var path = DrawrBrushes.brushToPath(brush, size);
            if(brush.type == "brush"){
                var rgb = brush.color.r + ":" + brush.color.g + ":" + brush.color.b;
				var message = "ADDPOINTBR:" + x + ":" + y + ":" + path + ":" + size + ":" + rgb;
				DEBUG_MODE_GLOBAL && console.log("Sending: " + message);
                this.socket.send(message);
            }else if(brush.type == "stamp"){
				var message = "ADDSTAMPBR:" + x + ":" + y + ":" + path + ":" + size;
				DEBUG_MODE_GLOBAL && console.log("Sending: " + message);
                this.socket.send(message);
            }
        }else{
            this.socket.send("ADDPOINT:" + x + ":" + y);
        }
    }else{
        //console.log("ADDPOINT: not connected");
    }
}

DrawrClient.prototype.addPointLocal = function(numx, numy, localx, localy, brush, size){
    // not yet (aka no longer) supported, because it's dumb
    if(this.isConnected()){
        if(brush){
            if(!size){
                size = brush.getBrushSize();
                brush = brush.getBrush();
            }
            var chunk = numx + ":" + numy;
            var loc = localx + ":" + localy;
            var path = DrawrBrushes.brushToPath(brush, size);
            var rgb = brush.color.r + ":" + brush.color.g + ":" + brush.color.b;
            this.socket.send("ADDPOINTLOCALBR:" + chunk + ":" + loc + ":" + path + ":" + size + ":" + rgb);
        }else{
            var chunk = numx + ":" + numy;
            var loc = localx + ":" + localy;
            this.socket.send("ADDPOINTLOCAL:" + chunk + ":" + loc);
        }
    }else{
        //console.log("SETBRUSH: not connected");
    }
}

DrawrClient.prototype.setViewPort = function(numx1, numy1, numx2, numy2){
    if(this.isConnected()){
        this.socket.send("UPDATESFOR:" + numx1 + ":" + numy1 + ":" + numx2 + ":" + numy2);
    }else{
        //console.log("SETBRUSH: not connected");
    }
}

/////////////////

function loadJSON(uri_string, handler){
    var http_request = new XMLHttpRequest();
    
    http_request.onreadystatechange = function(){
        if(http_request.readyState == 4){
            if(http_request.status == 200){
                // decodeURI because it's stored on the server as the URI encode that we sent it
                document.getElementById("debug").innerHTML = http_request.responseText;
                var jsonObj = JSON.parse(decodeURI(http_request.responseText));
                //var jsonObj = http_request.responseText; //return plaintext for now (drawobject.js handles deserialize)
                handler(jsonObj);
            }else{
                document.getElementById("debug").innerHTML = "status: " + http_request.status + "#" + loadJsonUniqueUrlId;
            }
        }
    };
    loadJsonUniqueUrlId++;
    if(uri_string.indexOf("?") >= 0){
        uri_string = uri_string.replace(/\?/, "?" + loadJsonUniqueUrlId + "&");
    }else{
        uri_string += "?" + loadJsonUniqueUrlId;
    }
    http_request.open("GET", uri_string, true);
    http_request.send();
    
    /*loadJsonUniqueUrlId++;
    if(uri_string.indexOf("?") >= 0){
        uri_string = uri_string.replace(/\?/, "?" + loadJsonUniqueUrlId + "&");
    }else{
        uri_string += "?" + loadJsonUniqueUrlId;
    }
    
    setTimeout(function(){
        var response = Android.loadJSON(uri_string);
        try{
            var jsonObj = JSON.parse(decodeURI(response));
            handler(jsonObj);
        }catch(err){
            document.getElementById("debug").innerHTML = response + "#" + loadJsonUniqueUrlId;
        }
    }, 0);*/
}