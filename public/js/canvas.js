$('document').ready(function(){

	var canvas;
    var canvasBg;    
    // Context
    var ctx;
    var ctxBg;

    // status of room
    var status = {};
    // socket object 
    var socket; 
    // Width of canvas
	var width;
	// Height of canvas
    var height;

    // Current position of mouse
	var currentX;
	var currentY;

    // Previous position of mouse
	var prevX;
	var prevY;

    // ImageData i.e Save
    var imageData;
    // for enter key to send messages in chat
    var chatEnter = false;
    var inputOptions = false;
    // room id
    var myRoom;
    // Flags
    var mouseClick = false;
	var moving = false;
    var isFullScreen = false;
    var shape = false;
    // circle on click
    var x,y;    
    var penSize = parseInt($('#pSize').text());
    var radius = penSize;
    var penColor = "#000000";
    var prevPenColor = "#000000";       
    var bgColor = "#ffffff";
    var currentTool = 'pen';
    var eraser = false;
    var text = false;
    var myString = "";
    // undo
    var undo = []; 
    // redo
    var redo = [];
    var username = 0;

    //
    // keyboard events
    //
    //
    // + increase size of pen 
    // - decrease size of pen
    //
    // 2 eraser
    // 1 pen
    // 'enter' key to enter fullscreen or escape fullScreen
    
    $(document).keypress(function(e){
       //console.log("which "+e.which+" keyCode "+e.keyCode+" window "+window.event.keyCode); 

            // + 
            if(e.which == 61 || e.keyCode == 61){
                incPenSize();
            }
            
            // -     
            if(e.which == 45 || e.keyCode == 45){
                decPenSize();
            }
            
            // 2
            if((e.which == 50 || e.keyCode == 50) && !inputOptions){
                eraserOn();
                updateCurrentTool($('p'),'eraser [2]');
            }
            
            // 1        
            if((e.which == 49 || e.keyCode == 49) && !inputOptions){
                off();
                updateCurrentTool($('p'),'pen [1]');
            }
            
            // t        
            if(e.which == 116 || e.keyCode == 116){
                textOn();
                updateCurrentTool($('p'),'text [t]');
            }
            
            // c        
            if(e.which == 99 || e.keyCode == 99){
                circleOn();
                updateCurrentTool($('p'),'Circle [c]');
            }

            // enter 
            if(e.which == 13 || e.keyCode == 13){
                if(!chatEnter){
                    if(!isFullScreen){
                        fullScreen();
                    }else{
                        endFullScreen();     
                    }
                }
            } 
        });

    //
	// Mouse on events
	//

	function onMouseDown(e){
        findxy(e); 
		drawStroke();
		mouseClick = true;
		
	}
	
	function onMouseUp(e){
		findxy(e);
		mouseClick = false;
	}
	
	function onMouseMove(e){
		moving = true;
		if(mouseClick){
			findxy(e);
			drawStroke();
		}	
		moving = false;
	}

	
	function onMouseOut(e){
		moving = false;
		mouseClick = false;
	}

	function init(){
        socket = io();
        canvas = document.getElementById('canvas'); 
		canvas.width = $(window).width()*0.5;
		canvas.height= $(window).height()*0.5;
        ctx = canvas.getContext('2d');
		canvasBg = document.getElementById('canvasBg');
		canvasBg.width = $(window).width()*0.5;
		canvasBg.height= $(window).height()*0.5;
        ctxBg = canvasBg.getContext('2d'); 
        ctxBg.fillStyle = bgColor;
        ctxBg.fillRect(0,0,canvas.width,canvas.height);
        width = canvas.width;
		height = canvas.height;
        imageData = ctx.getImageData(0,0,canvas.width,canvas.height);

        // Event listeners
		canvas.addEventListener('mousedown', onMouseDown);
		canvas.addEventListener('mouseup', onMouseUp);
		canvas.addEventListener('mousemove', onMouseMove);
		canvas.addEventListener('mouseout', onMouseOut);
/*
 *
 *  Fix the reload problem, i.e same form submission again
 *  sent ajax request and get the return value.
 *  If can't refresh value then take back to home page
 *  also if leave page then send disconnect event if possible
 *  apparently that is not happening when user presses leave this 
 *  page then the page closes without any other code working
 */ 

        window.addEventListener("beforeunload", function (e) {
            var confirmationMessage = "sure ?";
            (e || window.event).returnValue = confirmationMessage; //Gecko + IE
            return confirmationMessage;                            //Webkit, Safari, Chrome
        });
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }

    //
	// Drawing functions
	//

	function findxy(e){
	    $('canvas').css({'cursor':'crosshair'});
        if(mouseClick){
			prevX = currentX;
			prevY = currentY;
		}else{
            //for mozilla e.offsetX is undefined
            if(e.offsetX !== undefined){
                prevX = e.offsetX;
                prevY = e.offsetY;
            }else{
                prevX = e.pageX-$('#canvas').offset().left;
                prevY = e.pageY-$('#canvas').offset().top;
            }
		}
        //for mozilla e.offsetX is undefined
        if(e.offsetX !== undefined){
            currentX = e.offsetX;
            currentY = e.offsetY;
        }else{
            currentX = e.pageX-$('#canvas').offset().left;
            currentY = e.pageY-$('#canvas').offset().top;
        }
	    
    }
    
    function drawClick(currentX, currentY, penSize){ 
            ctx.beginPath();
//			ctx.fillRect(currentX-penSize/2, currentY-penSize/2, penSize,penSize);
            ctx.arc(currentX, currentY,penSize-(penSize/2),0,2*Math.PI,false);
            ctx.fill();
            ctx.closePath();
      
    }
    
    function drawDragRatio(prevRatioX,prevRatioY,currRatioX,currRatioY,penRatio){      
            ctx.beginPath(); 
            ctx.moveTo(prevRatioX*canvas.width, prevRatioY*canvas.height);
			ctx.lineTo(currRatioX*canvas.width,currRatioY*canvas.height);
			ctx.lineWidth = penRatio*(canvas.width*canvas.height);
			ctx.stroke();
			ctx.closePath();
    }

    function drawDrag(prevX,prevY,currX,currY,penSize){
            ctx.beginPath(); 
            ctx.moveTo(prevX, prevY);
			ctx.lineTo(currX,currY);
			ctx.lineWidth = penSize;
			ctx.stroke();
			ctx.closePath();
    }
   //drawing circle 
    function drawCircle(currentX,currentY,radius){
           /* var temp = ctx.lineWidth;
            ctx.lineWidth = 1;
            */
            ctx.beginPath();
            ctx.arc(currentX,currentY,radius,0,Math.PI*2);
            ctx.stroke();
           
    }
    var clearCircle = function(x, y, radius){
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.restore(); 
    };
    function drawStroke(){ 
        var change;
        colorChange(penColor);
		if(!text && !shape){
            if(!moving){ 
                    drawClick(currentX,currentY,penSize);
                    justClickEmit();
                }else{
                    drawDrag(prevX,prevY,currentX,currentY,penSize);
                    dragDrawEmit();
                }
            }else if(text && !moving){
                    var font = "Georgia";
                    ctx.font=penSize+"px "+font; 
                    myString = prompt("Enter text");
                    if(myString){
                        ctx.fillText(myString,currentX,currentY);
                        var textDetails = {
                            "font":font,
                            "penSize":penSize,
                            "currentX":currentX,
                            "currentY":currentY,
                            "string":myString,
                            "color":penColor,
                            "room":myRoom
                        };
                        socket.emit('text', textDetails);
                    } 
            }else if(shape && !moving){
                radius = penSize;
                var circleData = {};
                switch(type[0]){
                    case 'c':
                        x = currentX;
                        y = currentY;
                        drawCircle(x,y,radius); 
                        circleData = {
                            "type" : 'c',
                            "centerX" : x,
                            "centerY" : y,
                            "radius" :penSize,
                            "color":penColor,
                            "room" : myRoom 
                        };
                        socket.emit('shape', circleData);
                        break;
                }
            }else if(shape && moving){
                switch(type){
                    case 'cco': 
                        change = currentX - prevX;
                        radius += change;
                        if(radius<0){
                            radius = radius*(-1);
                        }
                        drawCircle(currentX,currentY,radius);

                        var circleData = {
                            "type" : type,
                            "centerX" : currentX,
                            "centerY" : currentY,
                            "color" : penColor,
                            "radius" : radius,
                            "room" : myRoom
                        };
                        socket.emit('shape', circleData);
                        break;
                    case 'ct':
                        change = currentX - prevX;
                        radius += change;
                        if(radius<0){
                            radius = radius*(-1);
                        }
                        drawCircle(x,y,radius);
                        
                        circleData = {
                            "type" : type,
                            "centerX" : x,
                            "centerY" : y,
                            "currentX": currentX,
                            "prevX" : prevX,
                            "color":penColor,
                            "radius" : radius,
                            "room" : myRoom
                        };
                        socket.emit('shape', circleData);
                        break;
                    case 'cd':
                        change = currentX - prevX;
                        radius += change;
                        if(radius<0){
                            radius = radius*(-1);
                        }
                        clearCircle(x,y,radius);
                        drawCircle(x,y,radius);
                        
                        circleData = {
                            "type" : type,
                            "centerX" : x,
                            "centerY" : y,
                            "radius" : radius,
                            "color":penColor,
                            "room" : myRoom
                        };
                        socket.emit('shape', circleData);
                        break;
                }
            }
    }
    //off eraser text
    function off(){
       eraserOff();
       textOff();
       circleOff();
    } 
// In eraser mode
    function eraserOn(){
        off();
        updateCurrentTool($(this));
        eraser = true;
        prevPenColor = penColor;
        penColor = bgColor; 
        penColorChange();
    }
    
    function eraserOff(){
        eraser = false;
        penColor = prevPenColor;
        penColorChange();
    }
// In text mode
    function textOn(){
        off();
        type = 't';
        updateCurrentTool($(this));
        text = true;    
    } 
// circle mode on
    function circleOn(){
        off();
        updateCurrentTool($(this));
        addToOptions('circle');
        type = 'cd';
        shape = true;
    }
// circle mode off
    function circleOff(){
        $('#toolOptions select').remove();
        shape = false;
    }
    function putText(){
        ctx.font=penSize+"px Georgia";
        myString = prompt("Enter text"); 
        ctx.fillText(myString,currentX,currentY);
    }

    function textOff(){
        myString = "";
        text = false;
    }
    
    function pen(){
        if(!eraser){
             penColor = "#"+$('#pColorInp').val();    
        }else{
            penColor = bgColor; 
        }
        if(penColor.length<=1){
            penColor = "#000000";
        }
    }
    function updateCurrentTool(btn,extra){
        // function invoked on click
        if(btn.is("button")){
            currentTool = btn.text();
        }else{
            //function invoked on key press/other uses
            if(extra){
                currentTool = extra;       
            }
        }
        $('#toolOptions p').text('tool : '+currentTool);
    }
   function addToOptions(caller){
        var optionDiv = $('#toolOptions');
        var tool;
        switch(caller){
            case "circle":
                tool = "<select id="+caller+"><option>default</option><option>cone</option><option>target</option></select>";
                optionDiv.append(tool);
                $('#'+caller).on('change',function(){
                    var selected = $(this).val();
                    switch(selected){
                        case "cone":
                            type = 'cco';
                            break;
                        case "default":
                            type = 'cd';
                            break;
                        case "target":
                            type = 'ct';
                            break;

                    }
                });
                break;
            case "square":
                tool = "<select><option>default</option><option>sqExpand</option><option>target</option></select>";
                optionDiv.append(tool);

                
                break;

        }
   } 
    function bg(){  
        if(bgColor.length<=1){
            bgColor = "#ffffff";
        }
        removeColor(bgColor);
        bgColor = "#"+$('#bgColorInp').val();    
        if(bgColor.length<=1){
            bgColor = "#ffffff";
        }
        if(eraser){
            eraserOn();
        }else{
            eraserOff();
        }
        ctxBg.fillStyle = bgColor; 
        ctxBg.fillRect(0,0,canvas.width,canvas.height);
    }
    
    
    //Remove this color from canvas
    function removeColor(color){
        var imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
        var pix = imgData.data;
        color = color.slice(1,color.length);
        var newColor = hexToRgb(color); 
        var newBgColor = $('#bgColorInp').val();
        newBgColor = hexToRgb(newBgColor);
        for(var i = 0, n = pix.length;i<n;i += 4){
            var r = pix[i],
                g = pix[i+1],
                b = pix[i+2];
            if(r==newColor.r && g==newColor.g && b==newColor.b){
                /*pix[i] = newBgColor.r;
                pix[i+1] = newBgColor.g;
                pix[i+2] = newBgColor.b;
                */
                pix[i+3] = 0;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }
    
    function hexToRgb(hex) {
        var bigint = parseInt(hex, 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        return {r:r,g:g,b:b};
    }
    
    //
    // Sockets Emit Data to server
    //
    
    function checkType(){
        if(eraser){
            return 'e'; 
        }else{
            return 'p';
        }
    }
	
    function dragDrawEmit(){
        var type = checkType();
       /* var undoData = {
                'prevX':prevX,
                'prevY':prevY,
                'currX':currentX,
                'currY':currentY,
                'penSize':penSize, 
        };
        undo.push(undoData);
        */
        var dragData = {
                'prevRatioX':prevX/canvas.width,
                'prevRatioY':prevY/canvas.height,
                'currRatioX':currentX/canvas.width,
                'currRatioY':currentY/canvas.height,
                'penColor':penColor,
                'penRatio':penSize/(canvas.width*canvas.height),
                'type' :type,
                "room":myRoom
        };
        socket.emit('dragDraw',dragData);
    }

    function justClickEmit(){
        var type = checkType();
        var clickData = {
                "x":currentX,
                "y":currentY,
                "penSize":penSize,
                "penColor":penColor,
                "type":type,
                "room":myRoom
        };
//        undo.push(clickData);
        socket.emit('justClick',  clickData);
    }

    //
    // Events (click , input)
    //
    
   
    // Click on the + button
    $('#inc').on('click', incPenSize);

    // Click on - button
    $('#dec').on('click', decPenSize);

    // Input on the color change of pen 
    $('#pColorInp').on('change', penColorChange);
   
    // Input on the color change of background 
    $('#bgColorInp').on('change', bgColorChange);

    // Click on Circle tool
    $('#circleTool').on('click',circleOn);

    // Click on text
    $('#textTool').on('click', textOn);

    // Click on eraser
    $('#eraser').on('click', eraserOn);

    // Click on button pen
    $('#pen').on('click',off);

    // Clear Canvas
    $('#clearCanvas').on('click', function(){
        ctx.clearRect(0,0,canvas.width,canvas.height); 
    });

    // Linewidth change
    $('#lineWidth').on('change',function(){
        var lineWidth = parseInt($(this).val());
        ctx.lineWidth = lineWidth; 

    });

    $('#lineWidth').on('focusin',function(){
        inputOptions = true;
    });

    $('#lineWidth').on('focusout',function(){
        inputOptions = false; 
    });
    // Full Screen
    $('#fullScreen').on('click', function(){
        if(!isFullScreen){
            fullScreen();
        }else{
            endFullScreen();
        }

    });

    //Download the canvas
    $('#downloadCanvasLink').on('click',function(){
        var name = prompt("Name of image"); 
        if(name===null){
            return false;
        }
        this.href = document.getElementById('canvas').toDataURL();
        this.download = name;
    });


/*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
 %
 %
 %  Chat Part
 %
 %
 %
 %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/


//
// Click send
//

    $('#messageForm').on('submit',function(){
        var message = $('#reply').val(); 
        if(username!==0){
            if(message.length>0){
               $('#messages').append('<li class="mySent">'+message+'<hr></li>');
                var chatData = {
                    'message':message,
                    'room':myRoom,
                    'user':username
                };
                socket.emit('messageSent',chatData);
                var height = 0;
                $('#messages li').each(function(i, value){
                    height += parseInt($(this).height());
                });

                height += ''; 
                $('#chatWindow').animate({scrollTop:height},0);
                $('#reply').val('');
            }
        }else{
            $('.error').html('<p>username not defined</p>');
        }
        chatEnter = true;
        return false;
    });
    $('#reply').focusin(function(){
        chatEnter = true;
    });
    $('#reply').focusout(function(){
        chatEnter = false;
    });
    $('#username').focusin(function(){
        chatEnter = true;
    });
    $('#sendUser').submit(function(){
        username = $('#username').val();
        if(username.length>0){
            $(this).remove();
            $('#replyWindow').css('display','inherit');
            chatEnter = false;
        }else{
            $('.error').html('<p> no username added</p>');
        }
        return false;
    });
    // Undo
/*    $('#undo').on('click',function(){ 
        eraserOn();
        colorChange(bgColor);
        for(var i=0;i<undo.length;i++){     
            drawDrag(undo[i].prevX,undo[i].prevY,undo[i].currX,undo[i].currY,undo[i].penSize+1);
        }
        for(var i=0;i<undo.length;i++){
            undo.shift();
        }

        eraserOff();
    });

    // Redo 
    $('#redo').on('click', redo);
*/
    //
    // Event Handlers
    //
    
    // Increase Pen Size 
    function incPenSize(){
        penSize +=1;
        $('#pSize').text(penSize);
        $('#pColor').css({width:penSize,height:penSize});
    }

    // Decrease Pen Size 
    function decPenSize(){
        if(penSize>0){
            penSize -=1;
        }else{
            penSize = 0;
        }
        $('#pSize').text(penSize);
        $('#pColor').css({width:penSize,height:penSize});
    }
    
    // Change Color
    function colorChange(color){
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
    }
    
    // Change the color of pen 
    function penColorChange(){
        pen();
        $('#pColor').css({background:penColor}); 
    }

    // Change the color of background
    function bgColorChange(){
        bg();
        $('#bColor').css({background:bgColor}); 
    }
    // Fullscreen for canvas
    function fullScreen(){
        collapseAll();
        $('#status').css('display','none'); 
        isFullScreen = true;
        imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
        canvas.width = $(window).width();
        canvas.height = $(window).height();
        canvasBg.width = $(window).width();
        canvasBg.height = $(window).height();
        bg();
        $('#canvas').css('left','0px');
        $('#canvasBg').css('left','0px');
        ctx.putImageData(imageData,0,0); 
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }
    // exit from full screen
    function endFullScreen(){
        expandAll();
        $('#status').css('display','inline');
        $('#canvas').css('left','15%');
        $('#canvasBg').css('left','15%');
        imageData = ctx.getImageData(0,0,$(window).width(),$(window).height());
        var ratioX = $(window).width()/width;
        var ratioY = $(window).height()/height;
        isFullScreen = false;
        //canvas back to original size
        canvas.width = width;
        canvas.height = height;
        //background back to original size
        canvasBg.width = width;
        canvasBg.height = height;
        //ctx.scale(1/ratioX,1/ratioY);
        ctx.putImageData(imageData,0,0);
        bg();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }

    function updateStatus(myStatus){
        myRoom = myStatus.room;
        status = myStatus;
        $('#status').html('<p>room : '+status.room+'</p><p> username : '+status.username+'</p><p> id : '+status.id+'</p><p>total user : '+status.users);
    }
/* 
    function undo(){
        eraserOn();
        penColor = bgColor;
        for(var i=0;i<undo.length;i++){
            drawDrag(undo[i].prevX,undo[i].prevY,undo[i].currX,undo[i].currY,undo[i].penSize);
        }
        eraserOff();
    }

    function redo(){

    }
*/
    init();
    
    //
    // socket events
    //


    // on error    
    socket.on('error', function(data){
        console.log(data);
    });

    // room sent to client 
    socket.on('myRoom', function(room){ 
        myRoom = room;
    });

    // text sent to client
    socket.on('textEmit', function(data){
        ctx.font = data.penSize+"px "+data.font;
        colorChange(data.color);
        ctx.fillText(data.string,data.currentX,data.currentY);
        colorChange(penColor); 
    });     

    // click sent to client
    socket.on('drawClick', function(data){
        colorChange(data.penColor);
        drawClick(data.x,data.y,data.penSize);
        pen(); 
        colorChange(penColor);
    });
    
    // drag to client
    socket.on('drawDrag',function(data){  
        colorChange(data.penColor);
        drawDragRatio(data.prevRatioX,data.prevRatioY,data.currRatioX,data.currRatioY,data.penRatio);        
        pen();
        colorChange(penColor);
    });

    // when shape is sent to client
    socket.on('shapeEmit', function(data){
        colorChange(data.color);
        var change;
        switch(data.type[0]){
            case 'c':
                if('c' === data.type){
                    drawCircle(data.centerX,data.centerY,data.radius);
                }else{
                    switch(data.type){
                        case 'cd': 
                                clearCircle(data.centerX,data.centerY,data.radius);
                                drawCircle(data.centerX,data.centerY,data.radius);
                           break;
                        case 'cco':
                                drawCircle(data.centerX,data.centerY,data.radius);
                          break;
                        case 'ct': 
                                drawCircle(data.centerX,data.centerY,data.radius);
                         break; 
                    }
                }
                break;
                
            }
        colorChange(penColor); 
    });     

    socket.on('messageReceived', function(data){
        $('#messages').append('<li class="otherSent">'+data.message+"<br>~ "+data.user+'<hr></li>');
        var height = 0;
        $('#messages li').each(function(i, value){
            height += parseInt($(this).height());
        });
        height += '';
       
        $('#chatWindow').animate({scrollTop:height},0);
});

    socket.on('status', function(myStatus){
       updateStatus(myStatus);
      socket.emit('join', myStatus); 
    });


});
