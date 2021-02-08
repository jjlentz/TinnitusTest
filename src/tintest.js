const tonedur = 2; //duration of the tones to be played
var count = 0;  //general counter
var butcount = 0;  //counter for buttons in pitch comparison task
var expcount = "calibrate"; 
var tonef = 0; 
var ampForPlayFunction;

var frequencies = [250, 500, 750, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
var frequenciesbracket = [250, 8000, 500, 7000, 750, 6000, 1000, 5000, 2000, 4000, 3000]; 
var rfreqs = [250, 500, 750, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 250, 500, 750, 1000, 2000, 
    3000, 4000, 5000, 6000, 7000, 8000, 250, 500, 750, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
var bracketcount = [0, 10, 1, 9, 2, 8, 3, 7, 4, 6, 5];  //counter for shuffled frequencies


// var frequencies = [250, 500, 750, 1000];
// var frequenciesbracket = [250, 1000, 500, 750]; 
// var bracketcount = [0, 3, 1, 2];  //counter for shuffled frequencies
// var rfreqs = [250, 500, 750, 1000, 250, 500, 750, 1000, 250, 500, 750, 1000]
//These are here for debugging only

var step;
var amp = []; 
for (step = 0; step < frequencies.length; step++) {
  amp.push(0.5);
};
//amp=[0.4, 0.1, 0.001];
var ratingcount = [];
let rating = [];
for (step = 0; step < rfreqs.length; step++) {
  ratingcount.push(step % (rfreqs.length / 3)); //put back after testing!
  rating.push(0);
};
shuffle(rfreqs,ratingcount); //shuffled frequencies and counter for rating

let butpressHigh = 0; 
let butpressLow = 0;
let pid = '';
let tinnitusPitchMatch = 0
let startTime = 0;

$.when( $.ready ).then(() => {
    $('#participantForm').submit((event) => {
        event.preventDefault();
        pid = $('#participantId').val();
        $.ajax({
            type: 'POST',
            url: 'https://xcca7zh3n1.execute-api.us-east-2.amazonaws.com/Prod/start/',
            dataType: 'json',
            data: {participantId: pid, browser: navigator.userAgent}
        })
        .done((response) => {
            startTime = response.startTime;
            $('#participantForm').hide();
            $('#experimentRow').show();
        })
        .fail(() => {
            $('#participantForm').append('<div class="badParticipant">The Participant Id is not valid</div>');
        });
    });
    $("#test").click(() => {
        ampForPlayFunction = 0.5;
        tonef = 3000;
        // console.log("testing")
        playSound();
        $("#finish").prop('disabled', false);
        $("#finish").css({'opacity': '1','cursor': 'pointer' });
        const anstest = event.target.id === "down" ? true : false;

    });

    $("#startId").click(() => {
        $("#ansButtons button").prop('disabled', false);
        $("#ansButtons button").css({'opacity': '1','cursor': 'pointer' });
        $("#startId").prop('disabled', true);
        $("#startId").css({'opacity': '.1'});
  
        switch (expcount) {
            case "pitch_bracket1":  //Pitch measurement - single frequency
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

            case "pitch_bracket2":  //Pitch measurement - using audio bracketing procedure
                $("#startId").prop('disabled', true);
                $("#startId").css({'opacity': '.1'});
                $("#instruct").html('Instructions: Pitch Comparison Phase 2');
                $("#startingInstr").html("<p id='Instructions'>This is another method to measure the pitch\
                    of your tinnitus. <br>\
                You will hear two sounds. Click <strong>lower</strong> if your tinnitus better matches the lower (1st) sound. <br>\
                Click <strong>higher</strong> if your tinnitus better matches the higher (2nd) sound. <br></p>");
                $("#down").html('lower (1st) sound'); $("#up").html('higher (2nd) sound');  
                //$("#startId").html('Playing');  //help!
              //  tonef = frequenciesbracket[0];
            break;


            case "pitch_rating":  // Pitch rating part of the experiment
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

            if (expcount != "pitch_rating"){
                //console.log(count,amp[count]);
                if (expcount === "pitch_bracket1"){
                    ampForPlayFunction = amp[bracketcount[count]];
                } else {
                    ampForPlayFunction = amp[count];
                };
                playSound();
                if (expcount === "level_set"){
                     $("#finish").css({'opacity': '1','cursor': 'pointer'});
                };
                setTimeout(() => {
                    $("#startId").prop('disabled', false);
                 }, tonedur * 1000);
            };
    });

 
    $("button.answer").click(() => {
        //$("button.answer").prop('disabled', true);
        const ansSofter = event.target.id === "down" ? true : false;
        const ansLouder = event.target.id === "up" ? true : false;
        if (ansSofter) {
            switch (expcount) {
                case "level_set":
                    amp[count] = 0.56 * amp[count]; // if true, make sound 5 dB louder. 
                    tonef = frequencies[count];
                    break;
                case "pitch_bracket1":   
                    butpressLow++; butpressHigh = 0; count++
                    tonef = frequenciesbracket[count];
                    //console.log(count,tonef,butpressLow)
                    if ((count === 1) && (butpressLow === 1)){
                        butpressLow = 2;
                    }

                    break;
            };

        };  
        if (ansLouder) {
            switch (expcount) {
                case "level_set":
                    amp[count] = 1.78 * amp[count]; // if true, make sound 5 dB softer.  
                    if (amp[count] > 1) {
                        amp[count] = 1;
                    }
                    tonef = frequencies[count];
                    break;
                case "pitch_bracket1":
                    butpressHigh++; butpressLow = 0; count++
                    tonef = frequenciesbracket[count];
                    // if ((count === 2) && (butpressHigh === 1)){
                    //     butpressHigh = 2;
                    // }
                    // console.log("answer louder")
                    break;
            };
           // console.log(amp[count])

        };   
        // console.log(expcount,butpressHigh,butpressLow,count,amp[bracketcount[count]])
        if ((expcount != "pitch_rating") && ((butpressHigh === 2) || (butpressLow === 2) ||
            (count == frequenciesbracket.length))){
            $("#instruct").html('Instructions: Break');
            $("#startingInstr").html("<li id='Instructions'>Thank you! </li>\
            <li>Take a short break, and push start to do the pitch rating phase of the study. </li>");
            $("#ansButtons button").prop('disabled', true);
            $("#ansButtons button").css({'opacity': '.1'});
            $("#startId").prop('disabled', false);
            $("#startId").css({'opacity': '1'});

            //expcount++
            expcount = "pitch_rating"
            count = 0;

        } else {
            if (expcount === "pitch_rating"){
                ampForPlayFunction = amp[ratingcount[count]];
            } else if (expcount === "pitch_bracket1") {
                ampForPlayFunction = amp[bracketcount[count]];
            } else {
                ampForPlayFunction = amp[count];
            };
            playSound();
        };
        //console.log(expcount, count, amp[count], butpressHigh, butpressLow)

        if (expcount === "level_set"){
            if (amp[count] >= 1){
                $("#startingInstr").html("<li id='Instructions'>Press <strong> Done </strong> to hear the next sound. </li>");
               //<li>Press <strong> Done </strong> to hear the next sound. </li>");
                $("#ansButtons button").prop('disabled', true);
                $("#ansButtons button").css({'opacity': '.1'});
                // console.log('testing')
                //count++;
            }; 
        };     
    });

    $("#finish").click(() => {
        //console.log("finish",expcount)
 
            switch (expcount) {
            
            case "calibrate":
            $("#test").remove();
                $("#instruct").html('Instructions: Level Matching');
                $("#startingInstr").html("<li id='Instructions'> Push <strong> Start </strong> to play a sound. </li>\
                <li>If your tinnitus is softer than the sound, click the \
                    <strong> softer </strong> button. </li>\
                <li>If your tinnitus is louder than the sound or you can't hear the sound, click the <strong> louder </strong> button.</li>\
                <li style='color:firebrick'><strong>Do this until your find a sound that has the same (or very close) \
                    loudness as your tinnitus.</strong></li>\
                <li>Then, click the <strong> Done </strong> button to play the next sound and do this again.</li><br>\
                <li>Note: An orange circle will flash while a sound is playing.");
                
                $("#finishButton button").prop('disabled', true);
                $("#finishButton button").css({'opacity': '.1'});
                $("#startId").prop('disabled', false);
                $("#startId").css({'opacity': '1','cursor': 'pointer' });

                tonef = frequencies[0];
                //expcount++;
                expcount = "level_set"

            break;

            case "level_set": //This is the level matching section
                //if (confirm("Confirm your response")){
                    if (count === (frequencies.length - 1)) {
                        $("#instruct").html('Instructions: Break');
                        $("#startingInstr").html("<li id='Instructions'>Thank you!  The levels have been set! </li>\
                        <li>The next phase is a pitch matching experiement. </li> \
                        <li>If your tinnitus pitch is higher than the sound, press the <strong> higher </strong> button. </li>\
                        <li>If your tinnitus pitch is lower than the sound, press the <strong> lower </strong> button.</li>\
                        <li>Take a short break, and push start when you are ready to do the pitch matching phase of the study. </li>");

                        $("#ansButtons button").prop('disabled', true);
                        $("#ansButtons button").css({'opacity': '.1'});
                        $("#startId").prop('disabled', false);
                        $("#startId").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
                        $("#finish").prop('disabled', true);
                        $("#finish").css({'opacity': '0'});
                        $("#down").html('tinnitus is lower'); $("#up").html('tinnitus is higher');  

                        //expcount++; 
                        expcount = "pitch_bracket1"
                        count = 0;  
                        
                    } else {
                        $("#instruct").html('Instructions: Level Matching');
                        $("#startingInstr").html("<li id='Instructions'> Push <strong> Start </strong> to play a sound. </li>\
                        <li>If your tinnitus is softer than the sound or you can't hear the sound, click the \
                            <strong> softer </strong> button. </li>\
                        <li>If your tinnitus is louder than the sound, click the <strong> louder </strong> button.</li>\
                        <li style='color:firebrick'><strong>Do this until your find a sound that has the same (or very close) \
                            loudness as your tinnitus.</strong></li>\
                        <li>Then, click the <strong> Done </strong> button to play the next sound and do this again.</li><br>\
                        <li>Note: An orange circle will flash while a sound is playing.");
                        $("#ansButtons button").css({'opacity': '1'});

                        count++; //amp[count] = startingamp[count];
                        tonef = frequencies[count];
                        tinnitusPitchMatch = tonef;
                        ampForPlayFunction = amp[count];
                        playSound();
                        setTimeout(() => {
                            // $("#startId").css({'opacity': '.1'});
                            $("#finish").prop('disabled', false); // Turning on the button while playing
                            $("#ansButtons button").prop('disabled', false); // Turning on the button while playing
                            $("#soundIndicator").css({'opacity': '0'}); // Turning on the button while playing
                            //console.log('test case')
                        }, tonedur * 1000);
                    };
                //};
            break;
            case "pitch_rating":  //This is the rating section
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
                        submitExperimentResults();
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

        // console.log(count,tonef,ampForPlayFunction)
        var sound = new Howl({
             src: ['wave' + tonef + '.wav'],
             html5: true // Force to HTML5 so that the audio can stream in (best for large files).
            });

        Howler.volume(ampForPlayFunction)
        sound.play();

        setTimeout(() => {
            $("#finish").prop('disabled', false);
            //if (ampForPlayFunction < 1) {
                $("#ansButtons button").prop('disabled', false);
            //} 
            $("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
        }, tonedur * 1000);

};

function shuffle(array,ratingcount) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    // swap elements array[i] and array[j]
    [array[i], array[j]] = [array[j], array[i]];
    [ratingcount[i], ratingcount[j]] = [ratingcount[j], ratingcount[i]];
  }
  //return array
}

const submitExperimentResults = () => {
    const myData = {
        participantId: pid,
        startTime
    }
    for (let i = 0; i < frequencies.length; i++) {
        myData['frequencies'+i] = frequencies[i];
    }
    for (let i = 0; i < amp.length; i++) {
        myData['amp'+i] = amp[i];
    }
    for (let i = 0; i < frequenciesbracket.length; i++) {
        myData['frequenciesbracket'+i] = frequenciesbracket[i];
    }
    myData['tinnitusPitchMatch'] = tinnitusPitchMatch;
    for (let i = 0; i < rfreqs.length; i++) {
        myData['rfreqs'+i] = rfreqs[i];
    }
    for (let i = 0; i < rating.length; i++) {
        myData['rating'+i] =rating[i];
    }
    $.ajax({
        type: 'POST',
        url: 'https://xcca7zh3n1.execute-api.us-east-2.amazonaws.com/Prod/complete/',
        dataType: 'json',
        data: myData
    }).done(() => {
        console.log('DATA SAVED');
        //console.log(myData)
    }).fail((err) => {
        console.error('Data not saved', err);
        $("#startingInstr").html("<li id='Instructions'>OPPS - something went completely wrong saving your experiment data.</li>");
    });
}


