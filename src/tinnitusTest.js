const TONE_DURATION = 2
let participantData = {};
let startTime = 0;
let soundEar = "R";
let currentPhase = 'calibrate';
let testValues = null;

const testSettings = {
    testLow: {tonef: 500, calPass: 1},
    testMid: {tonef: 3000, calPass: 6},
    testHigh: {tonef: 8000, calPass: 11}
}

const frequencies = [
    250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000, 16000,
    250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000, 16000,
    250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000, 16000];
const ratingsFrequencies = [...frequencies]

const ratingCount = [];
const rating = [];
for (let step = 0; step < ratingsFrequencies.length; step++) {
    ratingCount.push(step % (ratingsFrequencies.length / 3)); //put back after testing!
    rating.push(0);
}

// will be initialized later
let ampInit = null;
let frequencyIndex = 0;
const pitchRatingAmplitude = [...new Array(frequencies.length/3)].map(() => 0)

function shuffle(freqArray, counterArray) {
    for (let i = freqArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        // swap elements array[i] and array[j]
        [freqArray[i], freqArray[j]] = [freqArray[j], freqArray[i]];
        [counterArray[i], counterArray[j]] = [counterArray[j], counterArray[i]];
    }
}
const handleLevelSetDone = (event) => {
    console.log(`handleLevelSet with frequencyIndex ${frequencyIndex}`, event)
    if (frequencyIndex === (frequencies.length - 1)) {
        console.log('handle move to the pitchRating')
        switchToPitchRating()
    } else {
        const amplitude = ampInit[++frequencyIndex]
        const tone = frequencies[frequencyIndex]
        playOneSound(participantData['tinnitusType'], soundEar, amplitude, tone, null)
    }
}

const handleLevelSet = (event) => {
    const increaseVolume = event.target.id === 'up'
    if (increaseVolume) {
        ampInit[frequencyIndex] = 1.78 * ampInit[frequencyIndex];
    } else {
        ampInit[frequencyIndex] = 0.56 * ampInit[frequencyIndex];
    }
    const amplitude = ampInit[frequencyIndex]
    const tone = frequencies[frequencyIndex]
    playOneSound(participantData['tinnitusType'], soundEar, amplitude, tone, null)
}

const handlePitchRating = (event) => {
    const tone = rfreqs[frequencyIndex++]

}

const handleFinishAnswer = (event) => {
    console.log(`handleFinishAnswer`)
}

const addLevelMatchingInstructions = () => {
    $("#instruct").html('Instructions: Level Matching');
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Start </strong> to play a sound. </li>\
                    <li>If your tinnitus is softer than the sound, click the \
                        <strong> softer </strong> button. </li>\
                    <li>If your tinnitus is louder than the sound or you can't hear the sound, click the <strong> louder </strong> button.</li>\
                    <li style='color:firebrick'><strong>Do this until your find a sound that has the same (or very close) \
                        loudness as your tinnitus.</strong></li>\
                    <li>Then, click the <strong> Done </strong> button to play the next sound and do this again.</li><br>\
                    <li>Note: You will see an orange circle while sound is playing.");
}

// TODO - needs a good comment on what is going on here
const doWhatever = () => {
    console.log('starting state of ampInit', ampInit)
    const copy = [...ampInit]
    for (step = 0; step < 4; step++) {
        ampInit[step] = copy[1];
    }
    for (step = 4; step < 8; step++) {
        ampInit[step] = copy[6];
    }
    for (step = 9; step < 12; step++) {
        ampInit[step] = copy[11];
    }
    for (step = 12; step < 16; step++) {
        ampInit[step] = copy[1];
    }
    for (step = 16; step < 20; step++) {
        ampInit[step] = copy[6];
    }
    for (step = 20; step < 24; step++) {
        ampInit[step] = copy[11];
    }
    for (step = 24; step < 28; step++) {
        ampInit[step] = copy[1];
    }
    for (step = 28; step < 32; step++) {
        ampInit[step] = copy[6];
    }
    for (step = 32; step < 36; step++) {
        ampInit[step] = copy[11];
    }
    console.log('ending state of ampInit', ampInit)
}

const setUplevelMatching = () => {
    // remove the calibration test buttons
    $('#testButtons>button').remove()
    // $("#testMid").remove();
    // $("#testLow").remove();
    // $("#testHigh").remove();
    $("#down").html('tinnitus is softer');
    $("#up").html('tinnitus is louder');
    $("#finish").html("Done");
    $("#startId").prop('disabled', false);
}

const switchToTwo = () => {
    $('#ansButton1').removeClass('is-invisible');
    $('#ansButton2').removeClass('is-invisible');
    $("button.answer").prop('disabled', true).css({'cursor': 'not-allowed'});
    // $("#ansButton1 button").prop('disabled', true).css({'cursor': 'not-allowed'});
    // $("#ansButton2 button").prop('disabled', true).css({'cursor': 'not-allowed'});
    $("#testHigh").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#testMid").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Test2 </strong> to play another sound. </li>\
                    <li>Use the softer and louder buttons to set this sound so that it is moderately soft.");
}

const switchToThree = () => {
    console.log('hello from switchToThree')
    $("button.answer").prop('disabled', true).css({'cursor': 'not-allowed'});
    $("#testLow").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    $("#testMid").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Test3 </strong> to play the last sound. </li>\
                    <li>Use the softer and louder buttons to set this sound so that it is moderately soft.");
}

const beginLevelMatching = () => {
    currentPhase = 'levelSet';
    doWhatever();
    $("#testLow").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    addLevelMatchingInstructions();
    setUplevelMatching();
}
// const beginBracketOne = () => {
//     currentPhase = 'bracketOne';
//     $("#instruct").html('Instructions: Break');
//     $("startingInstr").css("color", "black")
//     $("#startingInstr").html("<li id='Instructions'>Thank you!  The levels have been set! </li>\
//                         <li>The next phase is a pitch matching experiment. </li> \
//                         <li>You will hear two sounds after you push the <strong> start </strong> button. Click <strong>lower</strong> if your tinnitus better matches the lower (1st) sound. <br>\
//                         Click <strong>higher</strong> if your tinnitus better matches the higher (2nd) sound. <br></li>");
//     $("button.answer").prop('disabled', true).css({'cursor': 'not-allowed', 'opacity': '.1'});
//     $("#down").html('tinnitus is lower');
//     $("#up").html('tinnitus is higher');
//     $("#startId").prop('disabled', false)
//         .css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
//     $("#finish").prop('disabled', true)
//         .css({'opacity': '0'});
//     for (step = 0; step < (frequencies.length / 3); step++) {
//         amp[step] = (ampInit[step] + ampInit[step + 12] + ampInit[step + 24]) / 3;
//     }
// }

// const handleBracketOneAnswer = (event) => {
//     console.log(`handleBracketOneAnswer`)
// }

const switchToPitchRating = () => {
    currentPhase = 'pitchRating';
    $("button.answer").prop('disabled', true)
        .css({'cursor': 'not-allowed', 'opacity': '.1'});
    $("#instruct").html('Instructions: Pitch Rating');
    $("#startingInstr").html("<li id='Instructions'>In this last phase of the experiment, we will measure\
            the pitch of your tinnitus using a different procedure.</li>\
        <li>Push <strong> Play </strong> (as many times as you want) to hear a sound.</li>\
        <li>Rate the similarity of the pitch of that sound to the pitch of your tinnitus using the slider.</li>\
        <li>Push <strong> Done </strong> button when you satisfied with your rating and a new sound will play. </li>\
        <li>If you can't hear the sound, drag the slider all the way to the left. </li><br>\
        <li>Push <strong> Start </strong> when you are ready. </li><br>\
        <li>Note: there are a total of 36 sounds in this section of the experiment.</li>");
    $('#finish').prop('disabled',true).css({'opacity': '.1'});
    $('#startId').hide();
    $('#down').hide();
    $('#up').html('Play');
    $('#ratingSlider').show();
    $("#finish").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
    frequencyIndex = 0;
    for (step = 0; step < pitchRatingAmplitude.length; step++) {
        pitchRatingAmplitude[step] =
            (ampInit[step]
                + ampInit[step + pitchRatingAmplitude.length]
                + ampInit[step + (2 * pitchRatingAmplitude.length)]) / 3;
    }
}

const handleCalibrateAnswer = (event) => {
    const increaseVolume = event.target.id === 'up'
    if (increaseVolume) {
        const increase = 1.78 * ampInit[testValues.calPass];
        ampInit[testValues.calPass] = increase > 1 ? 1 : increase
    } else {
        ampInit[testValues.calPass] = 0.56 * ampInit[testValues.calPass];
    }
    const buttonId = $('#testButtons').find('button:not(:disabled)').attr('id') // TODO get id of button
    console.log("The clicked button has id " + buttonId);
    $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    testValues = testSettings[buttonId]
    const amplitude = buttonId === 'testHigh' ? null : ampInit[testValues.calPass]
    playOneSound(participantData['tinnitusType'], soundEar, amplitude, testValues.tonef, buttonId)
    $("#finish").prop('disabled', false);
    $("#finish").css({'opacity': '1','cursor': 'pointer' });
}

const handleCalibrateDone = () => {
    const current = $("#testButtons button:not(:disabled)")[0];
    console.log(`current is ${JSON.stringify(current)}`)
    if (current.id === 'testHigh') {
        switchToTwo();
    } else if (current.id === 'testMid') {
        switchToThree();
    } else if (current.id === 'testLow') {
        beginLevelMatching()
    }
    console.log(`the current is ${current.id}`, current)
}

function playOneSound(tinnitusType, ear, amplitude, tone, buttonId) {
    $('button').prop('disabled', true)
    // $("#finish").prop('disabled', true);
    $("#ansButton1 button").css({'cursor': 'not-allowed'});
    $("#ansButton2 button").css({'cursor': 'not-allowed'});
    // $("#startId").prop('disabled', true);
    setTimeout(() => {
        $("#soundIndicator").show();
        $("#soundIndicator").css({'opacity': '1'}); // Turning on the circle while playing
    }, 250);
    const filePrefix = tinnitusType === "Noisy" ? ear + 'Noise' : ear
    const source = `${filePrefix}wav${tone}.wav`

    const sound = new Howl({
        src: [source],
        html5: true // Force to HTML5 so that the audio can stream in (best for large files).
    });

    console.log(`Hello from playOneSound with src ${source} ${tinnitusType}:${ear}:${amplitude}:${tone}`)
    if (amplitude) {
        Howler.volume(amplitude)
    }
    sound.play();

    setTimeout(() => {
        if (buttonId) {
            $('#'+buttonId).prop('disabled', false);
        }
        $("#finish").prop('disabled', false);
        $("#ansButton1 button").prop('disabled', false).css({'cursor': 'pointer'});
        $("#ansButton2 button").prop('disabled', false).css({'cursor': 'pointer'});
        $("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
    }, TONE_DURATION * 1500);

}

const handleCalibration = (buttonId) => {
    console.log(`The clicked button has id ${buttonId}`)
    $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    testValues = testSettings[buttonId]
    const amplitude = buttonId === 'testHigh' ? null : ampInit[testValues.calPass]
    playOneSound(participantData['tinnitusType'], soundEar, amplitude, testValues.tonef, buttonId)
    $("#finish").prop('disabled', false);
    $("#finish").css({'opacity': '1','cursor': 'pointer' });
}


const compareSounds = () => {

}

const handleParticipantForm = () => {
    $('#participantForm').submit((event) => {
        event.preventDefault();
        $('#firstSubmit').prop('disabled', true);
        console.log("form has been submitted")
        const pid = $('#participantId').val();
        participantData['participantId'] = pid
        participantData['earPhone'] = $('#earphone').val();
        participantData['tinnitusEar'] = $('#tinnitusEar').val();
        participantData['tinnitusType'] = $('#tinnitusType').val();
        participantData['hearingLoss'] = $('#hearingLoss').val();
        participantData['earphoneDescription'] = $('#earphoneDescription').val();
        console.log("participantData", participantData);
        if (participantData['hearingLoss'] === "HL") {
            ampInit = new Array(frequencies.length).fill(0.5);
        } else {
            ampInit = new Array(frequencies.length).fill(0.005);
        }
        if (participantData['tinnitusEar'] === "Right"){
            soundEar = "L";
        } else if (participantData['tinnitusEar'] === "Left"){
            soundEar = "R";
        } else {
            soundEar = "S";
        }
        // TODO POST THE DATA
        console.log(`SUBMITTING ${JSON.stringify({participantId: pid, browser: navigator.userAgent})}`)
        // $.ajax({
        //     type: 'POST',
        //     url: 'https://xcca7zh3n1.execute-api.us-east-2.amazonaws.com/Prod/start/',
        //     dataType: 'json',
        //     data: {participantId: pid, browser: navigator.userAgent}
        // })
        //     .done((response) => {
        //         startTime = response.startTime;
                startTime = new Date();
                $('#participation').hide();
                $('#experiment').show();
                // ampInit
                const value = participantData['hearingLoss'] === 'HL' ? 0.5 : 0.005;
                ampInit = Array(frequencies.length).fill(value);
            // })
            // .fail(() => {
            //     $('#participantForm').append('<div class="notification is-danger">The Participant Id is not valid</div>');
            // });
    });
}

const answerPhaseFunction = {
    finish: handleFinishAnswer,
    // bracketOne: handleBracketOneAnswer,
    // bracketTwo: handleBracketTwoAnswer,
    // bracketThree: handleBracketThreeAnswer,
    calibrate: handleCalibrateAnswer,
    levelSet: handleLevelSet,
    pitchRating: handlePitchRating
}

const donePhaseFunction = {
    calibrate: handleCalibrateDone,
    levelSet: handleLevelSetDone
}

$.when( $.ready ).then(() => {
    console.log("We are ready")
    handleParticipantForm();
    $("button.test").click((event) => {
        event.preventDefault();
        handleCalibration(event.target.id)
    });
    $('#finish').click(() => {
        $("#levelAtMax").css({'opacity': '0'});
        const handler = donePhaseFunction[currentPhase]
        handler()
    })
    $("button.answer").click((event) => {
        console.log(`Answer button clicked ${event.target.id} in phase ${currentPhase}`)
        $("button.answer").prop('disabled', true);
        const handler = answerPhaseFunction[currentPhase]
        handler(event)
    })
    $("#startId").click((event) => {
        const handler = answerPhaseFunction[currentPhase]
        handler(event)
    })
});



// TODO during level setting could we disable done button while sound is playing?
// really high pitch sounds are missing.