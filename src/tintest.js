const tonedur = 2; //duration of the tones to be played
var count = 0;  //general counter
var butcount = 0;  //counter for buttons in pitch comparison task
var expcount = 'calibrate';
// var expcount = 'pitchbracket2';

var tonef = 0; 
var ampForPlayFunction;
var pitchMatch2 = 0;
var myClassesResult;
var pitch2ResultS;
var pitch2Result;
var twoSounds = false;
var soundEar;
var calPass;

var frequencies = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
var frequenciesbracket = [250, 8000, 500, 7000, 750, 6000, 1000, 5000, 1500, 4000, 2000, 3000]; 
var rfreqs = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 250, 500, 750, 1000, 1500, 2000, 
    3000, 4000, 5000, 6000, 7000, 8000, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
// var rfreqs = [250, 1000, 3000, 7000];
var bracketcount = [0, 11, 1, 10, 2, 9, 3, 8, 4, 7, 5, 6];  //counter for shuffled frequencies
//mapconst mapindex=[0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12];  //Need for amplitude values for bracket2 procedure

let bracketMap = new Map();
bracketMap.set('1000-A', {low: '750-B', high: '1500-B'});
bracketMap.set('750-B', {low: '500-C', high: '750-C'});
bracketMap.set('1500-B', {low: '1000-C', high: '1500-C'});
bracketMap.set('500-C', {low: '250-D', high: '500-D'});
bracketMap.set('750-C', {low: '750-D', high: '1000-D'});
bracketMap.set('2000-A', {low: '1500-B', high: '3000-B'});
bracketMap.set('1500-C', {low: '1500-D', high: '2000-B'});
bracketMap.set('3000-B', {low: '2000-D', high: '4000-C'});
bracketMap.set('2000-B', {low: '2000-C', high: '3000-D'});
bracketMap.set('4000-C', {low: '3000-D', high: '6000-D'});
bracketMap.set('3000-D', {low: '3000-E', high: '4000-E'});
bracketMap.set('6000-D', {low: '4000-E', high: '8000-E'});
bracketMap.set('4000-E', {low: '4000-F', high: '6000-F'});
bracketMap.set('8000-E', {low: '6000-F', high: '8000-F'});


var step;
var amp = []; 
for (step = 0; step < frequencies.length; step++) {
  amp[step] = 0.005;
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
const Frequency_MATCHER = /(\d+)\-[A-F]/;
const waitPlayHigh = async (highTone, highAmp) => {

    await new Promise(r => setTimeout(r,3000))
    //console.log(tonef)
    tonef = highTone; 
    ampForPlayFunction = highAmp;
    //console.log('Im fixin to play a sound');
    playSound();
}


const handlePitchUpdate = (event) => {
    //This function is for pitchbracket2 which handles playing two sounds and keeping track of the pitch
    //console.log(event.target.id);
    const myClasses = $('#' + event.target.id).attr('class').split(/\s+/);
    const pitchClass = myClasses.find(c => Frequency_MATCHER.test(c));
    const myClassesdown = $('#down').attr('class').split(/\s+/);
    const pitchClassdown = myClassesdown.find(c => Frequency_MATCHER.test(c));
    const myClassesup = $('#up').attr('class').split(/\s+/);
    const pitchClassup = myClassesup.find(c => Frequency_MATCHER.test(c));
    const nextfreq = bracketMap.get(pitchClass); 
    // console.log(nextfreq)
    // console.log('test')
    
    if (nextfreq) {
        // console.log(nextfreq)
        // console.log('test')
        var nextclasslow = nextfreq.low; 
        var toneftemplow = nextclasslow.match(/\d+/);
        const  nextclasshigh = nextfreq.high; 
        const toneftemphigh = nextclasshigh.match(/\d+/);
        const tonefhigh = toneftemphigh[0];
        tonef = toneftemplow[0];

        //console.log(`My pitchClass is ${pitchClassdown}`);
        //console.log(`change buttons to ${JSON.stringify(bracketMap.get(pitchClassdown))}`);
     
        ampForPlayFunction = amp[frequencies.indexOf(tonef)];
        playSound();

        waitPlayHigh(tonefhigh,amp[frequencies.indexOf(tonefhigh)]);
        $('#down').removeClass(pitchClassdown).addClass(nextfreq.low);
        $('#up').removeClass(pitchClassup).addClass(nextfreq.high);
    } else {
            //$("#finish").prop('disabled', false); // Turning on the button while playing
            //("#ansButtons button").prop('disabled', false); // Turning on the button while playing
            //$("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
            // console.log(nextfreq)
            // console.log('test2')
 
            $('#down').prop('disabled',true).css({'opacity': '.1'});
            $('#up').prop('disabled',true).css({'opacity': '.1'});  
            $('#startId').prop('disabled',false).css({'opacity': '1','pointer': 'cursor'});
            // console.log('test3')
        //     $('#experimentRow').show();

            expcount = 'pitch_rating';      

            $("#instruct").html('Instructions: Pitch Rating');
            $("#startingInstr").html("<li id='Instructions'>In this last phase of the experiment, we will measure\
                the pitch of your tinnitus using a different procedure.</li>\
            <li>Push <strong> Play </strong> (as many times as you want) to hear a sound.</li>\
            <li>Rate the similarity of the pitch of that sound to the pitch of your tinnitus using the slider.</li>\
            <li>Push <strong> Done </strong> button when you satisfied with your rating and a new sound will play. </li>\
            <li>Push <strong> Start </strong> when you are ready. <li><br>\
            <li>Note: there are a total of 36 sounds in this section of the experiment.</li>");      
            $('#finish').prop('disabled',true).css({'opacity': '.1'});
        
    };
};

$.when( $.ready ).then(() => {
    soundEar = "R"; 
    $('#participantForm').submit((event) => {
        event.preventDefault();
        pid = $('#participantId').val();
        earPhoneType = $('#earphone').val();
        tinEar = $('#tinnitusEar').val();
        tinType = $('#tinnitusType').val();
        HL = $('#hearingLoss').val();
        if (HL === "HL") {
            for (step = 0; step < frequencies.length; step++) {
            amp[step] = 0.5;
            };
        };

        eDescrip = $('#earphoneDescrip').val();
        if (tinEar === "Right"){
            soundEar = "L";
        } else if (tinEar === "Left"){
            soundEar = "R";
        } else {
            soundEar = "S";
        };

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
    $("button.test").click(() => {
        const calibrateMid = event.target.id === "testMid" ? true : false;
        const calibrateLow = event.target.id === "testLow" ? true : false;
        const calibrateHigh = event.target.id === "testHigh" ? true : false;
        // ampForPlayFunction = 0.005;

        // $("#ansButtons button").prop('disabled', false).css({'opacity': '1','cursor': 'pointer' });
        // $("#ansButtons button").prop('disabled', false).css({'opacity': '1','cursor': 'pointer' });


        if (calibrateMid){ 
            tonef = 3000; 
            calPass = 6;
            ampForPlayFunction = amp[calPass];
            $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});   
            // $("#testMid").prop('disabled', true).css({'opacity': '1','cursor': 'pointer' });

        } else if (calibrateLow){
            tonef = 500; 
            calPass = 1;
            $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
            ampForPlayFunction = amp[calPass];
 
        } else if (calibrateHigh){
            tonef = 8000;
            calPass = 11;
             ampForPlayFunction = amp[calPass];
      
        };


        //tonef = 3000;
        playSound();
        $("#finish").prop('disabled', false);
        $("#finish").css({'opacity': '1','cursor': 'pointer' });
        // const anstest = event.target.id === "down" ? true : false;
        // console.log(anstest)

    });

    $("#startId").click(() => {
        $("#ansButtons button").prop('disabled', false).css({'opacity': '1','cursor': 'pointer' });
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
                $("#down").html('tinnitus is lower'); 
                $("#up").html('tinnitus is higher');  
                //$("#startId").html('Playing');  //help!
                tonef = frequenciesbracket[0];
            break;

            case "pitch_bracket2":  //Pitch measurement - using audio bracketing procedure
                $("#startId").prop('disabled', true);
                $("#startId").css({'opacity': '.1'});
                $("#ansButtons button").prop('disabled', true).css({'cursor': 'not-allowed'});
                // $("#ansButtons button").css({'opacity': '1','cursor': 'pointer' });     
                $("#instruct").html('Instructions: Pitch Comparison Phase 2');
                $("#startingInstr").html("<p id='Instructions'>This is another method to measure the pitch\
                    of your tinnitus. <br>\
                You will hear two sounds after you push the <strong> start </strong> button. Click <strong>lower</strong> if your tinnitus better matches the lower (1st) sound. <br>\
                Click <strong>higher</strong> if your tinnitus better matches the higher (2nd) sound. <br></p>");
                $("#down").html('lower (1st) sound').addClass('1000-A'); 
                $("#up").html('higher (2nd) sound').addClass('2000-A');  
                
                tonef = 1000; 
                ampForPlayFunction = amp[frequencies.indexOf(tonef)];
                twoSounds = true;
                $("#ansButtons button").prop('disabled', true);
                // $("#ansButtons button").css({'opacity': '.1'});
                playSound();
                setTimeout(() => {
                    //$("#finish").prop('disabled', false);
                    //if (ampForPlayFunction < 1) {
                        $("#ansButtons button").prop('disabled', false).css({'cursor': 'pointer'});
                    //$("#ansButtons button").css({'opacity': '1', 'cursor': 'pointer'});
                    //} 
                    //$("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
                    }, tonedur * 2600);
               waitPlayHigh(2000,amp[frequencies.indexOf(2000)]);   //Plays second sound at 2000 Hz to start. 
 
             break;


            case "pitch_rating":  // Pitch rating part of the experiment
                $("#instruct").html('Instructions: Pitch Rating');
                $("#startingInstr").html("<li id='Instructions'>In this last phase of the experiment, we will measure\
                the pitch of your tinnitus using a different procedure.</li>\
                <li>Push <strong> Play </strong> (as many times as you want) to hear a sound.</li>\
                <li>Rate the similarity of the pitch of that sound to the pitch of your tinnitus using the slider.</li>\
                <li>Push <strong> Done </strong> button when you satisfied with your rating and a new sound will play. </li><br>\
                <li>Note: there are a total of 36 sounds in this section of the experiment.</li>");
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
            };
        // console.log("level set 287")
    });

 
    $("button.answer").click((event) => {
        
        if (expcount === "finish") {
            tonef = pitchMatch2;
            const isLargeNumber = (element) => element == pitchMatch2;
            const indexFreq = frequencies.findIndex(isLargeNumber);
            ampForPlayFunction = amp[indexFreq];
            playSound();
            $('#tinnitusRating').submit((event) => {
                event.preventDefault();
                tinRat = $('#tinnitusRating').val();
                $("#up").remove();
                submitExperimentResults();
                $("#instruct").html('Thank you.  You are done!');
                $("#startingInstr").remove();
                $('#tinnitusRating').remove();
            });
        };

        if (expcount === 'pitch_bracket2') {
            twoSounds = true;
            $("#ansButtons button").prop('disabled', true).css({'cursor': 'not-allowed'});
            //$("#ansButtons button").css({'opacity': '.1'});
            
            handlePitchUpdate(event);
             //console.log(event);
            myClassesResult = $('#' + event.target.id).attr('class').split(/\s+/);
            pitch2ResultS = myClassesResult.find(c => Frequency_MATCHER.test(c));
            // console.log(pitch2ResultS);
            pitch2Result = pitch2ResultS.match(/\d+/);
            pitchMatch2 = pitch2Result[0];
            setTimeout(() => {
                $("#ansButtons button").prop('disabled', false).css({'cursor': 'pointer'});
            }, tonedur * 2600);

        } else {
       twoSounds = false;
        const ansSofter = event.target.id === "down" ? true : false;
        const ansLouder = event.target.id === "up" ? true : false;
        if (ansSofter) {
            switch (expcount) {
                case "calibrate":
                    amp[calPass] = 0.56 * amp[calPass]; // if true, make sound 5 dB louder.
                    break;
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
               case "calibrate":
                    amp[calPass] = 1.78 * amp[calPass]; // if true, make sound 5 dB softer.
                    if (amp[calPass] > 1) {
                        amp[calPass] = 1;
                    }
                    break;
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
                    break;

            };
           // console.log(amp[count])

        };
        // console.log(expcount,butpressHigh,butpressLow,count,amp[bracketcount[count]])
        if ((expcount == "pitch_bracket1") && ((butpressHigh === 2) || (butpressLow === 2) ||
            (count == frequenciesbracket.length))){
            $("#instruct").html('Instructions: Break');
            $("#startingInstr").html("<li id='Instructions'>Thank you! </li>\
            <li>Take a short break, and push start to do another pitch matching study. </li>\
            <li>You will hear two sounds after you push the <strong> start </strong> button. Click <strong>lower</strong> if your tinnitus better matches the lower (1st) sound. <br>\
                Click <strong>higher</strong> if your tinnitus better matches the higher (2nd) sound. <br></li>");

            $("#ansButtons button").prop('disabled', true);
            $("#ansButtons button").css({'opacity': '.1'});
            $("#startId").prop('disabled', false);
            $("#startId").css({'opacity': '1'});

            //expcount++
            expcount = "pitch_bracket2"
            count = 0;

        } else {
            if (expcount === "pitch_rating"){
                ampForPlayFunction = amp[ratingcount[count]];
            } else if (expcount === "pitch_bracket1") {
                ampForPlayFunction = amp[bracketcount[count]];
            } else if (expcount === "calibrate") {
                ampForPlayFunction = amp[calPass]; 
            } else {
                ampForPlayFunction = amp[count];
            };
            playSound();

        };
        //console.log(expcount, count, amp[count], butpressHigh, butpressLow)

        if (expcount === "level_set" || "calibrate"){
            if (amp[count] >= 1 || amp[calPass] >= 1){
                $("#startingInstr").html("<li id='Instructions'>Press <strong> Done </strong> to move on. </li>");
               //<li>Press <strong> Done </strong> to hear the next sound. </li>");
                $("#ansButtons button").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
                $("#testButtons button").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
                // console.log('testing')
                //count++;
            };
        };
        }
    });

    $("#finish").click(() => {
        //console.log("finish",expcount)
 
            switch (expcount) {

            case "calibrate":
                if (calPass === 11) {
                    $("#testHigh").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
                    $("#testMid").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
                    $("#ansButtons button").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
                    $("#startingInstr").html("<li id='Instructions'> Push <strong> Test2 </strong> to play another sound. </li>\
                    <li>Use the softer and louder buttons to set this sound so that it is moderately soft.");
                } else if (calPass === 6) {
                    $("#testMid").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
                    $("#testLow").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
                    $("#ansButtons button").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
                    $("#startingInstr").html("<li id='Instructions'> Push <strong> Test3 </strong> to play the last sound. </li>\
                    <li>Use the softer and louder buttons to set this sound so that it is moderately soft.");

                } else {
                    $("#testMid").remove();
                    $("#testLow").remove();
                    $("#testHigh").remove();
                    $("#down").html('tinnitus is softer'); 
                    $("#up").html('tinnitus is louder');  
                    for (step = 0; step < 4; step++) {
                        const ampLev = amp[1];
                        amp[step] = ampLev;
                    };
                    for (step = 4; step < 8; step++) {
                        const ampLev = amp[6];
                        amp[step] = ampLev;
                     };
                    for (step = 9; step < 12; step++) {
                        const ampLev = amp[11];
                        amp[step] = ampLev;
                    };

                    $("#instruct").html('Instructions: Level Matching');
                    $("#startingInstr").html("<li id='Instructions'> Push <strong> Start </strong> to play a sound. </li>\
                    <li>If your tinnitus is softer than the sound, click the \
                        <strong> softer </strong> button. </li>\
                    <li>If your tinnitus is louder than the sound or you can't hear the sound, click the <strong> louder </strong> button.</li>\
                    <li style='color:firebrick'><strong>Do this until your find a sound that has the same (or very close) \
                        loudness as your tinnitus.</strong></li>\
                    <li>Then, click the <strong> Done </strong> button to play the next sound and do this again.</li><br>\
                    <li>Note: You will see an orange circle while sound is playing.");
                    
                    $("#finishButton button").prop('disabled', true);
                    $("#finishButton button").css({'opacity': '.1'});
                    $("#startId").prop('disabled', false);
                    $("#startId").css({'opacity': '1','cursor': 'pointer' });

                    tonef = frequencies[0];
                    //expcount++;
                    expcount = "level_set"
                    // expcount = "pitch_rating"
                    // console.log("level set 467")
                };
            break;

            case "level_set": //This is the level matching section
                //if (confirm("Confirm your response")){
                    if (count === (frequencies.length - 1)) {
                        $("#instruct").html('Instructions: Break');
                        $("#startingInstr").html("<li id='Instructions'>Thank you!  The levels have been set! </li>\
                        <li>The next phase is a pitch matching experiment. </li> \
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
                        <li>If your tinnitus is softer than the sound, click the \
                            <strong> softer </strong> button. </li>\
                        <li>If your tinnitus is louder than the sound or you can't hear the sound, click the <strong> louder </strong> button.</li>\
                        <li style='color:firebrick'><strong>Do this until your find a sound that has the same (or very close) \
                            loudness as your tinnitus.</strong></li>\
                        <li>Then, click the <strong> Done </strong> button to play the next sound and do this again.</li><br>\
                        <li>Note: You will see an orange circle while sound is playing.");
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
            case "pitch_bracket2":  //Pitch measurement - using audio bracketing procedure
                    $("#startId").prop('disabled', false).css({'opacity': '1','cursor': 'pointer' });
                    $("#finish").prop('disabled', true);
                    $("#finish").css({'opacity': '.1'});

                    $("#instruct").html('Instructions: Pitch Comparison Phase 2');
                    $("#startingInstr").html("<p id='Instructions'>This is another method to measure the pitch\
                    of your tinnitus. <br>\
                You will hear two sounds after you push the <strong> start </strong> button. Click <strong>lower</strong> if your tinnitus better matches the lower (1st) sound. <br>\
                Click <strong>higher</strong> if your tinnitus better matches the higher (2nd) sound. <br></p>");
                    $("#down").html('lower (1st) sound'); $("#up").html('higher (2nd) sound');
                    //$("#startId").html('Playing');  //help!
                    //  tonef = frequenciesbracket[0];
                    $('#down').css({'opacity': '1'}).prop('disabled', false).addClass('1000-A');
                    $('#up').css({'opacity': '1'}).prop('disabled', false).addClass('2000-A');
            break;

            case "pitch_rating":  //This is the rating section
                //if (confirm("Confirm your response")){
                    rating[count] = document.getElementById("rangeSlider").value;
                    //console.log(rating,count)
                    count++
                    tonef = rfreqs[count];
                    ampForPlayFunction = amp[ratingcount[count]];
                    if (count === rfreqs.length) {
                        $("#instruct").html('Instructions: Final Step');
                        $("#startingInstr").css({'text-align': 'center'});
                        $("#startingInstr").html("<h3 id='Instructions'>Push the Play button \
                            and rate the similarity of that sound to your tinnitus.<br></h3>");
                        $('#tinnitusRating').show();
                        $("#ratingSlider").remove();
                        $("#finish").remove();
                        expcount = "finish";
                    } else {
                        playSound();
                        //wait();
                        $("#finish").prop('disabled', true).css({'cursor': 'not-allowed'});
                        setTimeout(() => {
                            $("#finish").prop('disabled', false).css({'cursor': 'pointer'});
                            $("#up").prop('disabled', false);
                            $("#soundIndicator").css({'opacity': '0'}); // Turning on the button while playing
                       }, tonedur * 1200);
                    };
            break;
        };
        
    });

});

function playSound() {
       
        if (twoSounds === false){
            $("#finish").prop('disabled', true);
            $("#ansButtons button").prop('disabled', true).css({'cursor': 'not-allowed'});
            $("#startId").prop('disabled', true);
        };
        setTimeout(() => {
            $("#soundIndicator").show();
            $("#soundIndicator").css({'opacity': '1'}); // Turning on the button while playing
        }, 250);

        // console.log(count,tonef,ampForPlayFunction)
        const sound = new Howl({
             src: [soundEar + 'wav' + tonef + '.wav'],
             html5: true // Force to HTML5 so that the audio can stream in (best for large files).
            });

        //console.log(sound)
        Howler.volume(ampForPlayFunction)
        sound.play();
        //wait();

        if (twoSounds === false){
            setTimeout(() => {
                $("#finish").prop('disabled', false);
                //if (ampForPlayFunction < 1) {
                $("#ansButtons button").prop('disabled', false).css({'cursor': 'pointer'})
                //} 
                $("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
            }, tonedur * 1200);
        } else {
            setTimeout(() => {
                // $("#finish").prop('disabled', false);
                // //if (ampForPlayFunction < 1) {
                //     $("#ansButtons button").prop('disabled', false);
                // //} 
                $("#soundIndicator").css({'opacity': '0'}); // Turning off the indicator after playing
            }, tonedur * 1200);
            
        };

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
        startTime,
    }
    myData['earPhone'] = earPhoneType;
    myData['tinnitusEar'] = tinEar;
    myData['tinnitusType'] = tinType;
    myData['hearigLoss'] = HL;
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
    myData['tinnitusPitchMatch2'] = pitchMatch2;
    myData['clinicalRating'] = tinRat;
    for (let i = 0; i < rfreqs.length; i++) {
        myData['rfreqs'+i] = rfreqs[i];
    }
 
    for (let i = 0; i < rating.length; i++) {
        myData['rating'+i] =rating[i];
    }
    myData['earphonedescriptions'] = eDescrip;
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
        $("#startingInstr").html("<li id='Instructions'>OOPS - something went completely wrong saving your experiment data.</li>");
    });
}


