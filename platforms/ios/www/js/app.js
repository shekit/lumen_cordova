var fsr = {
    service: "fff4",
    data: "fff5",
};

var led = {
    service: "fff0",
    data: "fff1",
};

//create local copy of data from server
var lumen_state = {
    "first_visit" : true,
    "twitter" : false,
    "mail" : false,
    "preset" : 1
}

var user_id = "fff0";

// ASCII only
function stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}


(function () {
 
    var lumen_id = null;
    var stop_ble_search;
    var net_connectivity = false;

    var connected_via_ble = false; //**

    var start_notify_animation; //**
    var notify_animation_num = 0; //**
    var notify_animation_images = ["empty_shoe.png","vibe_shoe.png","vibe_shoe2.png"]; //**
    
    var start_led_animation; //**
    var led_animation_num = 0; //**
    var led_animation_images = ["preset4.png", "preset3.png", "preset1.png", "preset2.png"]; //**


    var socket = io("http://128.122.6.175:3000");


    // check if server is running and send user id to server to know if this is your first visit
    socket.on('connect', function(o){
        net_connectivity = true;
        socket.emit('user_id',user_id);
        console.log("connection successful");
        console.log("net_connectivity: "+net_connectivity);
    });

    // if server is not running set net connectivity to false so you dont render the notification page
    socket.on('connect_error', function(o){
        net_connectivity = false;
        if(connected_via_ble == false){//**
            dont_know_if_first_time();//**
        }
        console.log("connection error");
        console.log("net_connectivity: "+net_connectivity);
    });


// check to see if this is the first visit or returning visit
    socket.on('first_visit', function(msg){ //**
        if(msg == 'yes' && connected_via_ble == false){                         //**
            console.log('Welcome to your first visit');  //**
            render_tutorial_get_started_lumen();  //**
        } else if(msg == 'no' && connected_via_ble == false){                       //**
            console.log('Welcome bak this is not your first visit'); //**
            render_find_lumen(); //**
        } //**
    }) //**

    


    //create local copy of data from server

    socket.on('lumen_state', function(msg){
        console.log("received data copy from server");
        lumen_state = msg;
    });

    //received tweet threshold
    socket.on('tweets', function(msg){
        ble.write(lumen_id, led.service, led.data, stringToBytes('t'));
    });

    //received email threshold
    socket.on('mails', function(msg){
        ble.write(lumen_id, led.service, led.data, stringToBytes('y'));
    });


    //if server goes down while searching for lumens, assume its a returning user
    function dont_know_if_first_time(){
        render_find_lumen();
    }
    

    // time out ble search if no lumen found
    var searchLumenTimer = function(){
        stop_ble_search = setTimeout(function(){

            ble.stopScan(function(){
                console.log("Stopped scan - no devices found");
            }, function() {
                console.log("couldn't stop");
            });
                                    
            render_not_found_lumen();

        }, 5000);
 
    }
 
    var clearSearchLumenTimer = function(){
        clearTimeout(stop_ble_search);
    }

    var searchLumenTutorialTimer = function(){
        stop_ble_search = setTimeout(function(){

            ble.stopScan(function(){
                console.log("Stopped scan - no devices found");
            }, function() {
                console.log("couldn't stop");
            });
                                    
            render_tutorial_not_found_lumen();

        }, 5000);
 
    }
 
    var clearSearchLumenTutorialTimer = function(){
        clearTimeout(stop_ble_search);
    }

    var notifyAnimation = function(){
        start_notify_animation = setInterval(function(){
            if(notify_animation_num >= notify_animation_images.length){
                notify_animation_num = 0;
            }
            var frame = notify_animation_images[notify_animation_num];
            var img_url = "url('./assets/images/"+ frame +"')";
            $(".notify_shoe").css('background-image', img_url);
            notify_animation_num++;
        }, 500);
    }

    //**
    var clearNotifyAnimation = function(){
        clearInterval(start_notify_animation);
    }

    //**
    var ledAnimation = function(){
        start_led_animation = setInterval(function(){
            if(led_animation_num >= led_animation_images.length){
                led_animation_num = 0;
            }
            var frame = led_animation_images[led_animation_num];
            var img_url = "url('./assets/images/"+ frame +"')";
            $(".led_shoe").css('background-image', img_url);
            led_animation_num++;
        }, 1000);
    }

    //**
    var clearLedAnimation = function(){
        clearInterval(start_led_animation);
    }

    var tutorialFindLumenTimer = function(){
        setTimeout(function(){
            ble.startScan([],onFoundLumenTutorial,onError);
            searchLumenTutorialTimer();
        }, 2000);
    }
 
    /* --------------------------------- TEMPLATES -------------------------------- */
    
    Handlebars.registerPartial({
        'empty_header':'<header class="bar bar-nav">'+
                            
                        '</header>',
        'back_header' : '<header class="bar bar-nav">'+
                            '<a href="javascript:void(0);" class="icon icon-left-nav pull-left back_to_home"></a>'+
                            '<h1 class="title">{{title}}</h1>'+
                        '</header>',
        'home_header' : '<header class="bar bar-nav">'+
                            '<a href="javascript:void(0);" class="icon icon-gear pull-right settings"></a>'+
                            '<h1 class="title">{{title}}</h1>'+
                        '</header>'
    });

    var tutorial_get_started_lumen_template = Handlebars.compile($("#tutorial_get_started_lumen_template").html());//**
    var tutorial_find_lumen_template = Handlebars.compile($("#tutorial_find_lumen_template").html());
    var tutorial_found_lumen_template = Handlebars.compile($("#tutorial_found_lumen_template").html());
    var tutorial_not_found_lumen_template = Handlebars.compile($("#tutorial_not_found_lumen_template").html());
    var tutorial_setup_lumen_template = Handlebars.compile($("#tutorial_setup_lumen_template").html());
    var tutorial_customize_lumen_template = Handlebars.compile($("#tutorial_customize_lumen_template").html());
    var tutorial_setup_notification_lumen_template = Handlebars.compile($("#tutorial_setup_notification_lumen_template").html());
    var tutorial_notification_lumen_template = Handlebars.compile($("#tutorial_notification_lumen_template").html());
    var tutorial_done_lumen_template = Handlebars.compile($("#tutorial_done_lumen_template").html());
    var tutorial_no_internet_lumen_template = Handlebars.compile($("#tutorial_no_internet_lumen_template").html());
    var tutorial_paired_lumen_error_template = Handlebars.compile($("#tutorial_paired_lumen_error_template").html());

    var find_lumen_template = Handlebars.compile($("#find_lumen_template").html());
    var found_lumen_template = Handlebars.compile($("#found_lumen_template").html());
    var not_found_lumen_template = Handlebars.compile($("#not_found_lumen_template").html());
    var home_lumen_template = Handlebars.compile($("#home_lumen_template").html());
    var settings_lumen_template = Handlebars.compile($("#settings_lumen_template").html());
    var tutorial_lumen_template = Handlebars.compile($("#tutorial_lumen_template").html());
    var paired_lumen_error_template = Handlebars.compile($("#paired_lumen_error_template").html());
    var customize_lumen_template = Handlebars.compile($("#customize_lumen_template").html());
    var notify_lumen_template = Handlebars.compile($("#notify_lumen_template").html());
    var no_internet_template = Handlebars.compile($("#no_internet_template").html());

    

    /* --------------------------------- RENDER TEMPLATES -------------------------------- */

    function render_tutorial_get_started_lumen() {
        connected_via_ble = true;
        $("#wrapper").html(tutorial_get_started_lumen_template());  
    }

    //**
    function render_tutorial_find_lumen(){
        $("#wrapper").html(tutorial_find_lumen_template());
        tutorialFindLumenTimer(); 
    }

    //**
    function render_tutorial_found_lumen(device){
        $("#wrapper").html(tutorial_found_lumen_template(device));
        
    }

    function render_tutorial_not_found_lumen(){
        $("#wrapper").html(tutorial_not_found_lumen_template());
    }

    //**
    function render_tutorial_setup_lumen(){
        $("#wrapper").html(tutorial_setup_lumen_template());
        ledAnimation();
    }

    //**
    function render_tutorial_customize_lumen(){
        $("#wrapper").html(tutorial_customize_lumen_template());
        clearLedAnimation();
    }

    //**
    function render_tutorial_setup_notification_lumen(){
        $("#wrapper").html(tutorial_setup_notification_lumen_template());
        notifyAnimation();
    }

    //**
    function render_tutorial_notification_lumen(){
        $("#wrapper").html(tutorial_notification_lumen_template());
        clearNotifyAnimation();
    }

    //**
    function render_tutorial_done_lumen(){
        $("#wrapper").html(tutorial_done_lumen_template());
    }

    //**
    function render_tutorial_no_internet_lumen(){
        $("#wrapper").html(tutorial_no_internet_lumen_template());
    }

    function render_tutorial_paired_lumen_error(){
        $("#wrapper").html(tutorial_paired_lumen_error_template());
    }

    function render_find_lumen() {
        connected_via_ble = true;
        $("#wrapper").html(find_lumen_template());
        ble.startScan([],onFoundLumen,onError);
        searchLumenTimer();
    }
 
    function render_found_lumen(device){
        $("#wrapper").html(found_lumen_template(device));
    }
 
    function render_not_found_lumen(){
        $("#wrapper").html(not_found_lumen_template());
    }
 
    function render_home_lumen(){
        $("#wrapper").html(home_lumen_template());
    }

    function render_settings_lumen(){
        $("#wrapper").html(settings_lumen_template());
    }  

    function render_tutorial_lumen(){
        $("#wrapper").html(tutorial_lumen_template());
    } 

    function render_paired_lumen_error(){
        $("#wrapper").html(paired_lumen_error_template());
    }

    function render_customize_lumen(){
        $("#wrapper").html(customize_lumen_template());

        // set initial page state based on prev selections
        var preset = lumen_state.preset;
        var img_url = "url('./assets/images/preset"+preset +".png')";
        $("#preset_"+preset).find("span").addClass("icon-check");
        $(".customize_lumen").css("background-image",img_url);
        
    }

    function render_notify_lumen(){
        
        $("#wrapper").html(notify_lumen_template());

        //set switch states based on what was previously set
        //so that the state stays when you close and reopen the app
        if(lumen_state.twitter){
            
            $(".twit_btn").removeClass("off");//**
            $(".twit_btn").addClass("on"); //**
            $(".twit_btn").html("On"); //**
        }

        if(lumen_state.mail){
            $(".email_btn").removeClass("off"); //**
            $(".email_btn").addClass("on"); //**
            $(".email_btn").html("On"); //**
        }

        //set image of shoe based on the shoe design selected
        var preset = lumen_state.preset;
        var img_url = "url('./assets/images/preset"+preset +".png')";

        $(".notify_lumen").css("background-image",img_url);
    }

    function render_no_internet(){
        $("#wrapper").html(no_internet_template());
    }


    /* --------------------------------- EVENT LISTENERS -------------------------------- */

    

    document.addEventListener('deviceready', function(){
        
        // ios7 status bar issue fix
        StatusBar.overlaysWebView(false);
        StatusBar.backgroundColorByHexString('#ffffff');
        StatusBar.styleDefault();

        // remove 300ms delay on touch events
        FastClick.attach(document.body);

        // override default HTML alert to look native
        if(navigator.notification) {
            window.alert = function(message) {
                navigator.notification.alert(
                    message,  //the message
                    null,     // callback
                    "Lumen",  // title
                    'OK'      // button name
                );
            };
        }

        //socket.emit('me','hi from phonegap');

        //render the first view to search for ble
        //render_find_lumen();

    },false );

    // tutorial events
    $(document).on('click', '#tutorial_get_started', function(e){
        render_tutorial_find_lumen();
    });

    $(document).on('touchstart', '#tutorial_connect', function(e){
        e.preventDefault();

        if($(e.target).attr('data-device-id')){
            console.log("setting lumen to device id");
            var device_id = e.target.dataset.deviceId;
            lumen_id=device_id;
        } else {
            console.log("has no data attr");
        }
        $(".loading_tutorial").css('display','block');
        console.log(lumen_id);
        ble.connect(lumen_id, pairedLumenTutorialSuccess, pairedLumenTutorialError);     
    });

    $(document).on('click', '#tutorial_customize', function(e){
        render_tutorial_customize_lumen();
    });

    $(document).on('click', '#tutorial_customize_done', function(e){
        if(net_connectivity){
            render_tutorial_setup_notification_lumen();
        } else {
            render_tutorial_no_internet_lumen();
        }  
    });

    $(document).on('click', '#tutorial_notification', function(e){
        render_tutorial_notification_lumen();
    });

    $(document).on('click', '#tutorial_notification_done', function(e){
        render_tutorial_done_lumen();
    });

    $(document).on('click', '#tutorial_done', function(e){
        render_home_lumen();
    });
    

    // non tutorial events
    $(document).on('touchstart', '.connect', function(e){
        e.preventDefault();

        if($(e.target).attr('data-device-id')){
            console.log("setting lumen to device id");
            var device_id = e.target.dataset.deviceId;
            lumen_id=device_id;
        } else {
            console.log("has no data attr");
        }
        $(".loading").css('display','block');
        console.log(lumen_id);
        ble.connect(lumen_id, pairedLumenSuccess, pairedLumenError);     
    });


    $(document).on('touchstart', '.reconnect_tutorial', function(e){
        render_tutorial_find_lumen();
    });

    $(document).on('touchstart', '.reconnect', function(e){
        render_find_lumen();
    });

    $(document).on('touchstart', '#find_tutorial', function(e){
        render_tutorial_find_lumen();
    });

    $(document).on('touchstart', '#find', function(e){
        e.preventDefault();
        render_find_lumen();
    });

    $(document).on('touchstart', '.preset', function(e){
        e.preventDefault;

        var sendChar = $(e.target).parents("li").data("sendChar");
        ble.write(lumen_id, led.service, led.data, stringToBytes(sendChar));
        console.log(sendChar);
        var presetVal = parseInt($(e.target).parents("li").data("presetVal"));
        console.log(presetVal);
        lumen_state.preset = presetVal;

        //if(net_connectivity){
            socket.emit('preset',presetVal);
        //}

        //set bg image
        var img_url = "url('./assets/images/preset"+presetVal +".png')";
        $(".customize_lumen").css("background-image",img_url);


        $("span.icon").removeClass("icon-check");
        $(e.target).parents("li").find("span").addClass("icon-check");
        
    });

    $(document).on('touchstart', '#customize', function(e){
        e.preventDefault();
        render_customize_lumen();
    });

    $(document).on('touchstart', '#notification', function(e){
        e.preventDefault();
        if(net_connectivity){
            render_notify_lumen();
        } else {
            render_no_internet();
        }
    });

    $(document).on('touchstart', '.settings', function(e){
        e.preventDefault();
        render_settings_lumen();
    });

    $(document).on('touchstart', '.tutorial', function(e){
        e.preventDefault();
        ble.write(lumen_id, led.service, led.data, stringToBytes("o"));
    });

    $(document).on('touchstart', '.back_to_home', function(e){
        e.preventDefault();
        render_home_lumen();
    });

    $(document).on('touchstart', '.twit_btn', function(e){
        var icon = $(e.target)
        //var btn = $(e.target);
        if(icon.hasClass('on')){
            icon.removeClass('on');
            icon.addClass('off');
            icon.html('Off');
            //add to other version
            lumen_state.twitter = false;
            var img_url = "url('./assets/images/preset"+lumen_state.preset +".png')";
            $(".notify_lumen").css("background-image",img_url);
            // stop add to other version
            console.log("turn twitter off");
            socket.emit('connect_to_twitter', 'no');

        } else if(icon.hasClass('off')){
            icon.removeClass('off');
            icon.addClass('on');
            icon.html('On');
            //add to other version
            lumen_state.twitter = true;
            $(".notify_lumen").css("background-image","url('./assets/images/twitter.png')");
            // stop add to other version
            console.log("turn twitter on");
            socket.emit('connect_to_twitter', 'yes');

        }
    });

    $(document).on('touchstart', '.email_btn', function(e){
        var icon = $(e.target)
        //var btn = $(e.target);
        if(icon.hasClass('on')){
            icon.removeClass('on');
            icon.addClass('off');
            icon.html('Off');
            //add to other version
            lumen_state.mail = false;
            var img_url = "url('./assets/images/preset"+lumen_state.preset +".png')";
            $(".notify_lumen").css("background-image",img_url);
            // stop add to other version
            console.log("turn email off");
            socket.emit('connect_to_mail', 'no');

        } else if(icon.hasClass('off')){
            icon.removeClass('off');
            icon.addClass('on');
            icon.html('On');
            //add to other version
            lumen_state.mail = true;
            $(".notify_lumen").css("background-image","url('./assets/images/email.png')");
            // stop add to other version
            console.log("turn email on");
            socket.emit('connect_to_mail', 'yes');

        }
    });




 
 /* --------------------------------- BLE EVENTS -------------------------------- */

    var onFoundLumen = function(device){
        // throws an error and stops app if somehow an undefined device is found
        // get error: TypeError: 'undefined' is not an object (evaluating 'device.name.match')
            if(device.name.match(/lumen/i) && typeof(device) == 'object'){
     
                // stop scan if lumen is found
                ble.stopScan(function(){
                    console.log("Stopped scan - lumen found");
                }, function() {
                    console.log("couldn't stop scan");
                });
     
                // clear timer interval since lumen is found
                clearSearchLumenTimer();
     
                render_found_lumen(device);
     
            } else {
                console.log("found a device i dont care about");
            }
        
    };

    var onFoundLumenTutorial = function(device){
        // throws an error and stops app if somehow an undefined device is found
        // get error: TypeError: 'undefined' is not an object (evaluating 'device.name.match')
            if(device.name.match(/lumen/i) && typeof(device) == 'object'){
     
                // stop scan if lumen is found
                ble.stopScan(function(){
                    console.log("Stopped scan - lumen found");
                }, function() {
                    console.log("couldn't stop scan");
                });
     
                // clear timer interval since lumen is found
                clearSearchLumenTutorialTimer();
     
                render_tutorial_found_lumen(device);
     
            } else {
                console.log("found a device i dont care about");
            }
        
    };
 
    var pairedLumenSuccess = function(device){
        console.log("paired up");
        render_home_lumen();
        ble.startNotification(device.id, fsr.service, fsr.data, receiveFsrValue, onError); 

    }
 
    var pairedLumenError = function(){
        console.log("pairing error");
        render_paired_lumen_error();   
    }

    var pairedLumenTutorialSuccess = function(device){
        console.log("paired up");
        render_tutorial_setup_lumen();
        ble.startNotification(device.id, fsr.service, fsr.data, receiveFsrValue, onError); 
    }

    var pairedLumenTutorialError = function(){
        console.log("pairing error");
        render_tutorial_paired_lumen_error();
    }

    var receiveFsrValue = function(buffer) {
        var data = new Uint8Array(buffer);
        var data_val = data[0];
        if(data_val == 0){
            $('.inactivity_div').css('background-image','url("./assets/images/fade_shoe.png")');
        } else {
            $('.inactivity_div').css('background-image','url("./assets/images/color_shoe.png")');
        }
        //$("#fsr_val").html(data[0]);
    }

    var onError = function(msg){
        alert("ERROR: "+msg);
    }

}());