let count = 0; let expcount = 0; let tonef = 0;
var startingamp = [0.01, 0.01, 0.01, 0.01]; 
var amp = startingamp;  //Need help with multiplication here
var frequencies = [250, 1000]; //, 1000, 2000, 3000, 4000, 6000, 8000];
var frequenciesbracket = [250, 8000, 1000, 2000]; 
let tonedur = 2; let butpressHigh = 0; let butpressLow = 0;


$.when( $.ready ).then(() => {
    $("#startId").click(() => {
        $("#startId").prop('disabled', true);
        $("#startId").css({'opacity': '.4','cursor': 'not-allowed' });
        $("#ansButtons button").prop('disabled', false);
        $("#ansButtons button").css({'opacity': '1','cursor': 'pointer' });
 
        switch (expcount) {
        case 0: 
            $("#startingInstr").html("<p id='Instructions'>In 10 seconds, the <strong> Playing </strong> button\
            will turn on and you will hear a tone. <br>\
            If it is softer than your tinnitus or you can't hear it, make it louder by clicking the louder button. <br>\
            If it is louder than your tinnitus, make it softer by clicking the softer button.<br>\
            Keep doing this until you find a sound level that is equally loud as your tinnitus <br>\
            Then, click the <strong> I am happy </strong> button to play the next sound and repeat the process.</p>");
            
            $("#finishButton button").prop('disabled', false);
            $("#finishButton button").css({'opacity': '1','cursor': 'pointer' });

        break;
        case 1:
            $("#startingInstr").html("<p id='Instructions'>This is the pitch matching portion of the experiment. <br>\
            You will hear a sound when the <strong> Playing </strong> button is active. <br>\
            Sometimes this sound will have a high pitch and sometimes it will have a low pitch. <br>\
            If your tinnitus is higher than the sound, press the <strong> higher </strong> button. <br>\
            If your tinnitus is lower than the sound, press the <strong> lower </strong> button.<br>\.</p>");
            $("#down").html('lower'); $("#up").html('higher');  
            break;
        }; 
            
        
        $("#startId").html('Playing');  //help!
        const timeout = 1;
        if (count < frequencies.length) {
            setTimeout(() => {
                tonef = frequencies[count];
                playSound();
                //$("#startId").show('slow');
                $("#startId").css({'opacity': '1','background-color' : 'orange'}); // Turning on the button while playing
                $("#ansButtons button").prop('disabled', true);
            }, timeout * 1000);
            
            setTimeout(() => {
                $("#startId").css({'opacity': '.4'});
                $("#ansButtons button").prop('disabled', false);
            }, 3000);
        };
    });

     //playSound();
    $("button.answer").click((event) => {
        //$("button.answer").prop('disabled', true);
        const ansSofter = event.target.id === "down" ? true : false;
        const ansLouder = event.target.id === "up" ? true : false;
        console.log(count)
        if (ansSofter) {
            switch (expcount) {
                case 0:
                    amp[count] = 0.56 * amp[count]; // if true, make sound 5 dB softer.  
                    //tonef = frequencies[count];
                    break;
                case 1:   
                    butpressLow++; butpressHigh = 0; count++
                    tonef = frequenciesbracket[count];
                    break;
            };

        };  
        if (ansLouder) {
            switch (expcount) {
                case 0 :
                    amp[count] = 1.78 * amp[count]; // if true, make sound 5 dB louder. 
                    break;
                case 1 :
                    butpressHigh++; butpressLow = 0; count++
                    tonef = frequenciesbracket[count];
                    break;
            };

        };   
        if ((butpressHigh === 2) || (butpressLow === 2)){
            $("#startingInstr").html("<p id='Instructions'>Thank you!  The levels have been set! <br>\
            Take a short break, and push start to do the pitch rating phase of the study. </p>");
            $("#ansButtons button").prop('disabled', true);
            $("#ansButtons button").css({'opacity': '.4'});
            $("#startId").html('Start'); 
            $("#startId").prop('disabled', false);
            $("#startId").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
            // $("#finish").prop('disabled', true);
            // $("#finish").css({'opacity': '0'});       
        } else {
            $("#startId").css({'opacity': '1'}); // Turning on the button while playing
            $("#ansButtons button").prop('disabled', true);
            setTimeout(() => {
                $("#startId").css({'opacity': '.4'});
                $("#ansButtons button").prop('disabled', false);
            }, tonedur * 1000);
            playSound();
            $("#startId").css({'opacity': '1','background-color' : 'orange'}); // Turning on the button while playing

        };
     
        console.log(expcount,count,tonef,butpressLow,butpressHigh)
        
    });

    $("#finish").click(() => {
        switch (expcount) {
            //if (expcount === 0){   
            case 0: //This is the level matching section
                //if (confirm("Confirm your response")){
                    if (count === (frequencies.length - 1)) {
                        $("#startingInstr").html("<p id='Instructions'>Thank you!  The levels have been set! <br>\
                        Take a short break, and push start to do the pitch matching phase of the study. </p>");
                        $("#ansButtons button").prop('disabled', true);
                        $("#ansButtons button").css({'opacity': '.4'});
                        $("#startId").html('Start'); 
                        $("#startId").prop('disabled', false);
                        $("#startId").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
                        $("#finish").prop('disabled', true);
                        $("#finish").css({'opacity': '0'});
                        expcount++; count = 0;  
                        
                    } else {
                        count++; amp[count] = startingamp[count];
                        tonef = frequencies[count];
                        playSound();
                        $("#startId").css({'opacity': '1','background-color' : 'orange'}); // Turning on the button while playing
                        setTimeout(() => {
                            $("#startId").css({'opacity': '.4'});
                        }, tonedur * 1000);
                        console.log(count)
                    };
                //};
            break;
        };
        
    });

});

function playSound() {
       
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var audioCtx = new AudioContext();
        var tone = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();
        tone.frequency.value = tonef;
        tone.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        //console.log(count)
        gainNode.gain.exponentialRampToValueAtTime(amp[count],audioCtx.currentTime + 0.04);
        tone.start(0);
        tone.stop(audioCtx.currentTime + tonedur);
 
};


