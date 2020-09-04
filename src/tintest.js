let count = 0; let expcount = 0; let tonef = 0; 
var startingamp = [0.01, 0.01, 0.01, 0.01]; 
var amp = startingamp;  //Need help with multiplication here
var frequencies = [250, 1000, 4000, 8000]; //, 500, 1000, 2000, 3000, 4000, 6000, 8000];
var frequenciesbracket = [250, 8000, 500, 6000, 1000, 4000, 2000, 3000]; 
var newcount = [0, 1, 2, 3]
let tonedur = 2; let butpressHigh = 0; let butpressLow = 0;
randomfreqs = shuffle(frequencies);

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
                $("#startId").html('Playing');  //help!
                tonef = frequencies[count];
            break;

            case 1:
                $("#startingInstr").html("<p id='Instructions'>This is the pitch matching portion of the experiment. <br>\
                You will hear a sound when the <strong> Playing </strong> button is active. <br>\
                Sometimes this sound will have a high pitch and sometimes it will have a low pitch. <br>\
                If your tinnitus is higher than the sound, press the <strong> higher </strong> button. <br>\
                If your tinnitus is lower than the sound, press the <strong> lower </strong> button.<br>\</p>");
                $("#down").html('lower'); $("#up").html('higher');  
                $("#startId").html('Playing');  //help!
            break;

            case 2:
                $("#startingInstr").html("<p id='Instructions'>This is the pitch rating portion of the experiment. <br>\
                You will hear a pulsing sound when the <strong> Playing </strong> indicator is lit. <br>\
                Your task is to rate the similarity of the pitch of the pulsing sound to the pitch of your tinnitus. <br>\
                Using the slider, provide ratings between <strong> not at all similar </strong> and \
                <strong> identical </strong> .<br>\
                Presse the <strong> I am happy </strong> button when you are finished. </p>");
                $("#ansButtons button").remove();
                $("#startId").html('Playing');  
                //$("#startId").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
                $("#finish").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
                tonef = randomfrequencies[count];
            break;

        }; 
            
        //const timeout = 1;
            setTimeout(() => {
                playSound();
                //$("#startId").show('slow');
                $("#startId").css({'opacity': '1','background-color' : 'orange'}); // Turning on the button while playing
                $("#ansButtons button").prop('disabled', true);
            }, 1000);
            
            setTimeout(() => {
                $("#startId").css({'opacity': '.4'});
                $("#ansButtons button").prop('disabled', false);
            }, 3000);
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
                    if ((count === 1) && (butpressLow === 1)){
                        butpressLow = 2;
                    }
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
                    if ((count === 2) && (butpressHigh === 1)){
                        butpressHigh = 2;
                    }
                    break;
            };

        };   
        if ((butpressHigh === 2) || (butpressLow === 2) || (count == frequenciesbracket.length)){
            $("#startingInstr").html("<p id='Instructions'>Thank you!  The levels have been set! <br>\
            Take a short break, and push start to do the pitch rating phase of the study. </p>");
            $("#ansButtons button").prop('disabled', true);
            $("#ansButtons button").css({'opacity': '.4'});
            $("#startId").html('Start'); 
            $("#startId").prop('disabled', false);
            $("#startId").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
            $("#slidecontainer").css({'opacity': '0.8'}); //Need help to get this to work
            expcount++
            count = 0;

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
             
    });

    $("#finish").click(() => {
        switch (expcount) {
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
            case 2:
                rating[count] = ratingSlider.value;
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

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    // swap elements array[i] and array[j]
    [array[i], array[j]] = [array[j], array[i]];
    [newcount[i], newcount[j]] = [newcount[j], newcount[i]];
  }
  return array
}


