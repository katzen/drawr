
function login_popup(){
    var cover = document.createElement("div");
    cover.setAttribute("id", "login_cover");
    cover.style.position = "absolute";
    cover.style.background = "#FFF";
    cover.style.opacity = "0.4";
    cover.style.top = "0";
    cover.style.bottom = "0";
    cover.style.left = "0";
    cover.style.right = "0";
    document.body.appendChild(cover);
    
    
}

function login_offline_mode(){
    $("white_login_screen").style.display = "none";
    $("login_cover").style.display = "none";
    $("howtouse_cover").style.display = "none";
}

function login_server(server){
    $("white_login_screen").style.display = "none";
    $("login_cover").style.display = "none";
    $("howtouse_cover").style.display = "none";
    
    $("server_url").value = server;
    drawr_client.stop();
    drawr_client.server = server;
    drawr_client.start();
    
    drawr.drawr_map.setOfflineMode(0);
    drawr.refresh();
}