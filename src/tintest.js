const tonedur = 2; //duration of the tones to be played
var count = 0; 
var expcount = 0; //case 0 = calibration; case 1 = level matching; case 2 = pitch bracket; case 3 = pitch rating
var tonef = 0; 
var ampForPlayFunction;

var frequencies = [250, 500, 750, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
var frequenciesbracket = [250, 8000, 500, 7000, 750, 6000, 1000, 5000, 2000, 4000, 3000]; 
var rfreqs = [250, 500, 750, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 250, 500, 750, 1000, 2000, 
    3000, 4000, 5000, 6000, 7000, 8000, 250, 500, 750, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];

var step;
var amp = []; 
for (step = 0; step < frequencies.length; step++) {
  amp.push(0.01);
};
//amp=[0.4, 0.1, 0.001];
var ratingcount = [];
let rating = [];
for (step = 0; step < rfreqs.length; step++) {
  ratingcount.push(step % (rfreqs.length / 3)); //put back after testing!
  rating.push(0);
};
shuffle(rfreqs,ratingcount); //shuffled frequencies and counter for rating
var bracketcount = [0, 8, 1, 7, 2, 6, 3, 5, 4];  //counter for shuffled frequencies

let butpressHigh = 0; 
let butpressLow = 0;


$.when( $.ready ).then(() => {
    $("#startId").click(() => {
        $("#ansButtons button").prop('disabled', false);
        $("#ansButtons button").css({'opacity': '1','cursor': 'pointer' });
        $("#startId").prop('disabled', true);
        $("#startId").css({'opacity': '.1'});
  
        switch (expcount) {
            case 2:
                $("#startId").prop('disabled', true);
                $("#startId").css({'opacity': '.1'});
                $("#instruct").html('Instructions: Pitch Comparison');
                $("#startingInstr").html("<p id='Instructions'>Here, we are trying to measure the pitch\
                    of your tinnitus. <br>\
                Press <strong>lower</strong> if your tinnitus is lower than the sound. <br>\
                Press <strong>higher</strong> if your tinnitus is higher than the sound. <br></p>");
                $("#down").html('tinnitus is lower'); $("#up").html('tinnitus is higher');  
                //$("#startId").html('Playing');  //help!
                tonef = frequenciesbracket[0];
            break;

            case 3:
                $("#instruct").html('Instructions: Pitch Rating');
                $("#startingInstr").html("<li id='Instructions'>Here, we are trying to measure the pitch\
                    of your tinnitus using a different procedure.</li>\
                <li>Push <strong> Play </strong> (as many times as you want) to hear a sound.</li>\
                <li>Rate the similarity of the pitch of that sound to the pitch of your tinnitus using the slider.</li>\
                <li>Push <strong> Done </strong> button when you satisfied with your rating and a new sound will play. </li><br>\
                <li>Note: there are a total of 33 sounds in this section of the experiment.</li>");
                $("#startId").remove();
                $("#down").remove();
                $("#up").html('Play');
                $("#ratingSlider").show();
                $("#finish").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
                tonef = rfreqs[count];
             break;

        }; 

            if (expcount != 3){
                //console.log(count,amp[count]);
                if (expcount === 2){
                    ampForPlayFunction = amp[bracketcount[count]];
                } else {
                    ampForPlayFunction = amp[count];
                };
                playSound();
                if (expcount === 1){
                     $("#finish").css({'opacity': '1','cursor': 'pointer'});
                };
                setTimeout(() => {
                    $("#startId").prop('disabled', false);
                 }, tonedur * 1000);
            };
    });

    $("button.answer").click((event) => {
        //$("button.answer").prop('disabled', true);
        const ansSofter = event.target.id === "down" ? true : false;
        const ansLouder = event.target.id === "up" ? true : false;
        //console.log("button ans")
        if (ansSofter) {
            switch (expcount) {
                case 1:
                    amp[count] = 1.78 * amp[count]; // if true, make sound 5 dB louder. 
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
                    amp[count] = 0.56 * amp[count]; // if true, make sound 5 dB softer.  
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
        if ((expcount != 3) && ((butpressHigh === 2) || (butpressLow === 2) || 
            (count == frequenciesbracket.length))){
            $("#instruct").html('Instructions: Break');
            $("#startingInstr").html("<li id='Instructions'>Thank you! </li>\
            <li>Take a short break, and push start to do the pitch rating phase of the study. </li>");
            $("#ansButtons button").prop('disabled', true);
            $("#ansButtons button").css({'opacity': '.1'});
            // $("#startId").html('Start'); 
            $("#startId").prop('disabled', false);
            $("#startId").css({'opacity': '1'});
            expcount++
            count = 0;

        } else {
            if (expcount === 3){
                ampForPlayFunction = amp[ratingcount[count]];
            } else if (expcount === 2) {
                ampForPlayFunction = amp[bracketcount[count]];
            } else {
                ampForPlayFunction = amp[count];
            };
            playSound();

        };
             
    });

    $("#finish").click(() => {
        //console.log("finish",expcount)
        switch (expcount) {
            
            case 0:
                $("#instruct").html('Instructions: Level Matching');
                $("#startingInstr").html("<li id='Instructions'> Push <strong> Start </strong> to play a sound. </li>\
                <li>If your tinnitus is softer than the sound or you can't hear the sound, click the \
                    <strong> softer </strong> button. </li>\
                <li>If your tinnitus is louder than the sound, click the <strong> louder </strong> button.</li>\
                <li style='color:firebrick'><strong>Do this until your find a sound that has the same (or very close) \
                    loudness as your tinnitus.</strong></li>\
                <li>Then, click the <strong> Done </strong> button to play the next sound and do this again.</li><br>\
                <li>Note: An orange circle will flash while a sound is playing.");
                
                $("#finishButton button").prop('disabled', true);
                $("#finishButton button").css({'opacity': '.1'});
                $("#startId").prop('disabled', false);
                $("#startId").css({'opacity': '1','cursor': 'pointer' });

                tonef = frequencies[0];
                expcount++;

            break;

            case 1: //This is the level matching section
                //if (confirm("Confirm your response")){
                    if (count === (frequencies.length - 1)) {
                        $("#instruct").html('Instructions: Break');
                        $("#startingInstr").html("<li id='Instructions'>Thank you!  The levels have been set! </li>\
                        <li>Take a short break, and push start to do the pitch matching phase of the study. </li>\
                        <li>If your tinnitus pitch is higher than the sound, press the <strong> higher </strong> button. </li>\
                        <li>If your tinnitus pitch is lower than the sound, press the <strong> lower </strong> button.</li>");

                        $("#ansButtons button").prop('disabled', true);
                        $("#ansButtons button").css({'opacity': '.1'});
                        $("#startId").prop('disabled', false);
                        $("#startId").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
                        $("#finish").prop('disabled', true);
                        $("#finish").css({'opacity': '0'});
                        expcount++; count = 0;  
                        
                    } else {
                        count++; //amp[count] = startingamp[count];
                        tonef = frequencies[count];
                        ampForPlayFunction = amp[count];
                        playSound();
                        setTimeout(() => {
                            // $("#startId").css({'opacity': '.1'});
                            $("#finish").prop('disabled', false); // Turning on the button while playing
                            $("#ansButtons button").prop('disabled', false); // Turning on the button while playing
                            $("#soundIndicator").css({'opacity': '0'}); // Turning on the button while playing
         
                        }, tonedur * 1000);
                    };
                //};
            break;
            case 3:  //This is the rating section
                //if (confirm("Confirm your response")){
                    rating[count] = document.getElementById("rangeSlider").value;    
                    //console.log(rating,count)
                    count++
                    tonef = rfreqs[count];
                    ampForPlayFunction = amp[ratingcount[count]];
                    if (count === rfreqs.length) {
                        $("#instruct").html('Instructions: Done');
                        $("#startingInstr").html("<li id='Instructions'>Thank you!  You are finished with the experiment.</li>");
                        $("#up").remove();
                        $("#finish").remove();
                        $("#ratingSlider").remove();

                    } else {
                        playSound();
                        setTimeout(() => {
                            $("#finish").prop('disabled', false);
                            $("#up").prop('disabled', false);
                            $("#soundIndicator").css({'opacity': '0'}); // Turning on the button while playing
                       }, tonedur * 1000);
                    };
            break;
        };
        
    });

});

function playSound() {
       
        $("#finish").prop('disabled', true);
        $("#ansButtons button").prop('disabled', true);
        $("#startId").prop('disabled', true);
        $("#soundIndicator").show();
        $("#soundIndicator").css({'opacity': '1'}); // Turning on the button while playing

        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var audioCtx = new AudioContext();
        let tone = audioCtx.createOscillator();
        tone.type = 'sine';
        tone.frequency.value = tonef;

        let toneamp = audioCtx.createGain();
        toneamp.gain.setValueAtTime(0.000001,audioCtx.currentTime);
        toneamp.gain.exponentialRampToValueAtTime(ampForPlayFunction,audioCtx.currentTime + 0.04);
        //let modulator = audioCtx.createOscillator();
        //modulator.type = 'sine';
        //modulator.frequency.value = 1.5;

        //modulator.connect(toneamp.gain);
        tone.connect(toneamp).connect(audioCtx.destination);
        //modulator.start();
        tone.start();
        tone.stop(audioCtx.currentTime + tonedur)
        setTimeout(() => {
            $("#finish").prop('disabled', false);
            $("#ansButtons button").prop('disabled', false);
            $("#soundIndicator").css({'opacity': '0'}); // Turning on the button while playing
        }, tonedur * 1000);

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


