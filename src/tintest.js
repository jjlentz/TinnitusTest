let count = 0; 
let expcount = 0; 
let tonef = 0; 
//const startingamp = [0.01, 0.01, 0.01, 0.01]; 
var amp = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];  //Need help with multiplication here
var frequencies = [250];//, 4000, 8000]; //, 500, 1000, 2000, 3000, 4000, 6000, 8000];
var frequenciesbracket = [250, 8000, 500, 6000, 750, 4000, 1000, 3000, 2000]; 
var rfreqs = [250, 250, 250, 500, 500, 500, 750, 750, 750, 1000, 1000, 1000, 2000, 2000, 2000,
    3000, 3000, 3000, 4000, 4000, 4000, 5000, 5000, 5000, 6000, 6000, 6000, 7000, 7000, 7000, 8000, 8000, 8000];
let ratingcount = 0;
let rating = 0;

for (let step = 0; step < rfreqs.length; step++) {
  ratingcount[step] = step;
  rating[step] = 0;
};
shuffle(rfreqs,ratingcount);
var bracketcount = [0, 8, 1, 7, 2, 6, 3, 5, 4];  //counter for shuffled frequencies
let tonedur = 2; 
let butpressHigh = 0; 
let butpressLow = 0;

expcount = 0;  //case 0 = calibration; case 1 = level matching; case 2 = pitch bracket; case 3 = pitch rating

$.when( $.ready ).then(() => {
    $("#startId").click(() => {
        $("#ansButtons button").prop('disabled', false);
        $("#ansButtons button").css({'opacity': '1','cursor': 'pointer' });
 
        switch (expcount) {
            case 0: 
                $("#startId").prop('disabled', true);
                $("#startId").css({'opacity': '.4','cursor': 'not-allowed' });
                $("#startId").html('Play');  //help!
            break;

            case 2:
                $("#startId").prop('disabled', true);
                $("#startId").css({'opacity': '.4','cursor': 'not-allowed' });
                $("#startingInstr").html("<p id='Instructions'>This is the pitch matching portion of the experiment. <br>\
                You will hear a sound when the <strong> Playing </strong> button is active. <br>\
                Sometimes this sound will have a high pitch and sometimes it will have a low pitch. <br>\
                If your tinnitus is higher than the sound, press the <strong> higher </strong> button. <br>\
                If your tinnitus is lower than the sound, press the <strong> lower </strong> button.<br>\</p>");
                $("#down").html('lower'); $("#up").html('higher');  
                $("#startId").html('Playing');  //help!
                tonef = frequenciesbracket[0];
            break;

            case 3:
                $("#startingInstr").html("<p id='Instructions'>This is the pitch rating portion of the experiment. <br>\
                You will hear a pulsing sound when the <strong> Play </strong> indicator is lit. <br>\
                Your task is to rate the similarity of the pitch of the pulsing sound to the pitch of your tinnitus. <br>\
                Using the slider, provide ratings between <strong> not at all similar </strong> and \
                <strong> identical </strong> .<br>\
                You may push the <strong> Play </strong> button as many time as you wish to hear the sound.<br>\
                Press the <strong> I am happy </strong> button when you satisfied with your rating. </p>");
                $("#ansButtons button").remove();
                $("#startId").html('Play');  
                $("#ratingSlider").show();
                $("#finish").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
                tonef = rfreqs[count];
                $("#finish").prop('disabled', false);
                //console.log("here in start 3")
            break;

        }; 

            playSound();
            $("#startId").css({'opacity': '1','background-color' : 'orange'}); // Turning on the button while playing
            $("#startId").prop('disabled', true);
            $("#ansButtons button").prop('disabled', true);

            
            setTimeout(() => {
                if (expcount != 3){
                    $("#startId").css({'opacity': '.4'});
                };
                $("#startId").prop('disabled', false);
                $("#ansButtons button").prop('disabled', false);
                if (expcount === 2){
                    $("#startId").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
                };
            }, 2000);
    });

    $("button.answer").click((event) => {
        //$("button.answer").prop('disabled', true);
        const ansSofter = event.target.id === "down" ? true : false;
        const ansLouder = event.target.id === "up" ? true : false;
        //console.log("button ans")
        if (ansSofter) {
            switch (expcount) {
                case 1:
                    amp[count] = 0.56 * amp[count]; // if true, make sound 5 dB softer.  
                    tonef = frequencies[count];
                    break;
                case 2:   
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
                case 1 :
                    amp[count] = 1.78 * amp[count]; // if true, make sound 5 dB louder. 
                    tonef = frequencies[count];
                    break;
                case 2 :
                    butpressHigh++; butpressLow = 0; count++
                    tonef = frequenciesbracket[count];
                    if ((count === 2) && (butpressHigh === 1)){
                        butpressHigh = 2;
                    }
                    break;
            };


        };   
        //console.log(expcount,butpressHigh,butpressLow,count)
        if ((butpressHigh === 2) || (butpressLow === 2) || (count == frequenciesbracket.length)){
            $("#startingInstr").html("<p id='Instructions'>Thank you! <br>\
            Take a short break, and push start to do the pitch rating phase of the study. </p>");
            $("#ansButtons button").prop('disabled', true);
            $("#ansButtons button").css({'opacity': '.4'});
            $("#startId").html('Start'); 
            $("#startId").prop('disabled', false);
            $("#startId").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
            //$("#slidecontainer").css({'opacity': '0.8'}); //Need help to get this to work
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
            //console.log("button listen")
            $("#startId").css({'opacity': '1','background-color' : 'orange'}); // Turning on the button while playing

        };
             
    });

    $("#finish").click(() => {
        //console.log("finish",expcount)
        switch (expcount) {
            
            case 0:
                $("#startingInstr").html("<p id='Instructions'>Your job is to match the levels of these\
                sounds to the level of your tinnitus. <br>\
                Once you push <strong> Start </strong>, you will hear a sound. <br>\
                If that sound is softer than your tinnitus or you can't hear it, make it louder by clicking the louder button. <br>\
                If that louder than your tinnitus, make it softer by clicking the softer button.<br>\
                Keep doing this until you find a sound level that is equally loud as your tinnitus <br>\
                Then, click the <strong> I am happy </strong> button to play the next sound and repeat the process.<br>\
                Press <strong> Start </strong> when you are ready to go </p>");
                
                $("#finishButton button").prop('disabled', false);
                $("#finishButton button").css({'opacity': '1','cursor': 'pointer' });
                $("#startId").html('Start');  //help!
                $("#startId").prop('disabled', false);
                $("#startId").css({'opacity': '1','cursor': 'pointer' });

                tonef = frequencies[0];
                expcount++;
                //console.log("finish case 0",expcount)

            break;

            case 1: //This is the level matching section
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
                        count++; //amp[count] = startingamp[count];
                        tonef = frequencies[count];
                        playSound();
                        $("#startId").css({'opacity': '1','background-color' : 'orange'}); // Turning on the button while playing
                        setTimeout(() => {
                            $("#startId").css({'opacity': '.4'});
                        }, tonedur * 1000);
                        //console.log(count)
                    };
                    //console.log("finish case 1",expcount)
                //};
            break;
            case 3:  //This is the rating section
                //if (confirm("Confirm your response")){
                    rating[count] = document.getElementById("rangeSlider").value;    
                    //console.log(rating,count)
                    count++
                    tonef = rfreqs[count];
                    playSound();
                    $("#finish").prop('disabled', true);
                        $("#startId").css({'opacity': '1','background-color' : 'orange'}); // Turning on the button while playing
                        setTimeout(() => {
                            //$("#startId").css({'opacity': '.4'});
                            $("#finish").prop('disabled', false);
                        }, tonedur * 1000);

               // };
                console.log("finish case 3",count)
            break;
        };
        
    });

});

function playSound() {
       
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var audioCtx = new AudioContext();
        let tone = audioCtx.createOscillator();
        tone.type = 'sine';
        tone.frequency.value = tonef;

        let toneamp = audioCtx.createGain();
        toneamp.gain.setValueAtTime(0,audioCtx.currentTime);
        toneamp.gain.exponentialRampToValueAtTime(amp[count],audioCtx.currentTime + 0.04);
        //let modulator = audioCtx.createOscillator();
        //modulator.type = 'sine';
        //modulator.frequency.value = 1.5;

        //modulator.connect(toneamp.gain);
        tone.connect(toneamp).connect(audioCtx.destination);
        //modulator.start();
        tone.start();
        tone.stop(audioCtx.currentTime + tonedur)
};

function shuffle(array,ratingcount) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    // swap elements array[i] and array[j]
    [array[i], array[j]] = [array[j], array[i]];
    [ratingcount[i], ratingcount[j]] = [ratingcount[j], ratingcount[i]];
  }
  return array
}


