"use strict";
const TONE_DURATION = 2
let participantData = {};
let startTime = 0;
let soundEar = "R";
let tinnitusTypeMeasured = "Tonal";
let currentPhase = 'calibrateNoise';
let testValues = null;

const testSettings = {
    testLow: {tonef: 500, calPass: 0},
    testMid: {tonef: 3000, calPass: 4},    
    testHigh: {tonef: 8000, calPass: 9},
}

const testNoiseSettings = {
    testNoise: {tonef: 2000}
}

const frequencies = [
    2000, 4000, 8000,
    2000, 4000, 8000,
    2000, 4000, 8000];
    // 500, 1500, 3000, 5000, 7000, 8000, 12000,
    // 500, 1500, 3000, 5000, 7000, 8000, 12000,
    // 500, 1500, 3000, 5000, 7000, 8000, 12000]
    // //|                      |                             |
    // 500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000,
    // 500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000,
    // 500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000];
const ratingsFrequencies = [...frequencies];
// let bracketFrequencies = frequencies.slice(0, frequencies.length / 3);  
let bracketFrequencies = [2000, 4000, 8000];
// assume all frequencies will be heard, and only mark them otherwise if they are not.
const heardFrequencies = Array(frequencies.length).fill(true);
const pitchMatchResult = [];

const ratingCount = [];
const rating = [];
for (let step = 0; step < ratingsFrequencies.length; step++) {
    ratingCount.push(step % (ratingsFrequencies.length / 3)); //put back after testing!
    rating.push(-1);
}

// will be initialized later
let step = null;
let ampInit = null;
let frequencyIndex = 0;
let arrayIndex = 0;

let pitchMatchingCounter = 0;
const pitchRatingAmplitude = [...new Array(frequencies.length/3)].map(() => 0)
const pitchMatchingAmplitude = [...new Array(bracketFrequencies.length)].map(() => 0)
// endArrayIndex is used only in pitch matching where we want it to start at the end of bracketFrequencies
let endArrayIndex = bracketFrequencies.length - 1;

function shuffle(freqArray, counterArray) {
    for (let i = freqArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        // swap elements array[i] and array[j]
        [freqArray[i], freqArray[j]] = [freqArray[j], freqArray[i]];
        [counterArray[i], counterArray[j]] = [counterArray[j], counterArray[i]];
    }
}

const topThreeIndices = (arr) => {
    // create array of objects with value & index
    const indexedArray = arr.map((value, index) => ({value, index}));
    // sort descending
    indexedArray.sort((a, b) => b.value - a.value);
    // get the first 3 and return the indices
    const largestElements = indexedArray.slice(0, 3);
    return largestElements.map((el) => el.index)
}

const switchToFinalMatch = () => {
    currentPhase = 'octaveTest';
    console.log('Hello from switchToFinalMatch')
    $("#instruct").html('Instructions: Final Pitch Test');
    $("#startingInstr").html("<li>Click on each of the blue buttons to play a sound</li> \
                            <li>After listening to each sound, type which sound best matched your tinnitus into the textbox.</li> \
                            <li>Then, rate the similarity of that sound to your tinnitus. </li> \
                            <li>Push the Submit button to store your answers.</li>");
    $("#ansButton1").remove();
    $("#ansButton2").remove();
    $('#testButtons').show();
    $('#testHigh').html('Sound 1').prop('disabled', false).css({'opacity' : '1', 'cursor': 'pointer'});
    $('#testMid').html('Sound 2').prop('disabled', false).css({'opacity' : '1', 'cursor': 'pointer'});
    $('#testLow').html('Sound 3').prop('disabled', false).css({'opacity' : '1', 'cursor': 'pointer'});
    $('#tinnitusRating').show();
    $("#ratingSlider").hide();
    $("#finish").remove();
    // sorting PitchMatchResult to establish most common value for the final pitch match, the middle one
    pitchMatchResult.sort((a, b) => b.value - a.value);  

    const bestMatchedTone = pitchMatchResult[1];
    let lower = bestMatchedTone.value / 2;
    let higher = bestMatchedTone.value * 2;
    if (bestMatchedTone.value === 8000) {
        higher = 12000;
    } else if (bestMatchedTone.value === 750) {
        lower = 500;
    }
    console.log(`best matched tone index, lower, higher ${bestMatchedTone.value} ${bestMatchedTone.index} ${lower} ${higher}`)
    if ((bestMatchedTone.index === 0) || (bracketFrequencies.includes(lower) === false)) {
        lower = undefined;
        $('#testLow').css({'opacity' : '0'}).addClass('played').addClass('notAudible');  //If sound doesn't exist or isn't audible, hide and get played class
    } 
    
    if ((bestMatchedTone.index === bracketFrequencies.length - 1) || (bracketFrequencies.includes(higher) === false)) {
        higher = undefined;
        $('#testHigh').css({'opacity' : '0'}).addClass('played').addClass('notAudible');  //If sound doesn't exist or isn't audible, hide and get played class
    } 

    $('#testLow').attr('tone',lower);
    $('#testMid').attr('tone',bestMatchedTone.value);
    $('#testHigh').attr('tone',higher);
}

const handleLevelSetDone = (event) => {
    console.log(`handleLevelSet with frequencyIndex ${frequencyIndex}`, event)
    if (frequencyIndex === (frequencies.length - 1)) {
        switchToPitchMatching()
    } else {
        const amplitude = ampInit[++frequencyIndex]
        const tone = frequencies[frequencyIndex]
        // TODO JJL PUT BACK IN
        // playOneSound(participantData['tinnitusType'], soundEar, amplitude, tone, null)
    }
}

const handleLevelSet = (event) => {
    console.log('Hello from handleLevelSet');
    $('#startId').prop('disabled', false).css({'opacity': '1'});
    $('#finish').prop('disabled', false).css({'opacity': '1'});
        if (event.target.id === 'up') {
        let maxVolume = parseInt($(event.currentTarget).attr('maxvolume'));
        console.log(`Current maxvolume is ${maxVolume}`, event.target);
        const value = 1.78 * ampInit[frequencyIndex];
        if (value > 1) {
            maxVolume += 1;
            // using >= coerces both vars to numbers while vs >== does not, and here we want to coercion
            if (maxVolume > 3) {
                console.log('maxVolume attempts exceeded');
                const heard = confirm('Press OK if you can hear a sound, but it is still softer than your tinnitus or Cancel if you can just barely hear the sound or it is not audible.')
                heardFrequencies[frequencyIndex] = heard;
                // reset before moving on
                $('#up').attr('maxvolume', 0)
                return handleLevelSetDone(event)
            }
            console.log('bumping maxvolume')
            $('#up').attr('maxvolume', maxVolume)
            ampInit[frequencyIndex] = 1;
        } else {
            ampInit[frequencyIndex] = value;
        }
    } else if (event.target.id === 'down') {
        ampInit[frequencyIndex] = 0.56 * ampInit[frequencyIndex];
    }
    const amplitude = ampInit[frequencyIndex]
    const tone = frequencies[frequencyIndex]
    // JJL PUT BACK IN
    // playOneSound(participantData['tinnitusType'], soundEar, amplitude, tone, null)
}

const switchToQualityMatching = () => {
    currentPhase = 'qualityMatching';
    console.log('Hello from switch to qualityMatching');
    const alertText = "Please do not adjust the volume on your computer any longer, "
        + "even if you can't hear the sounds."
    alert(alertText);
    $('#volumeInstructions').removeClass('is-invisible');
    $('#startId').prop('disabled', false).css({'opacity': '1'});
    $("#testLow").show().prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#testHigh").show().prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    addQualityMatchingInstructions();
    setUpPitchAndQualityMatching();  //This sets up the buttons only
    console.log('pitchMatchingAmplitude before', pitchMatchingAmplitude)
    for (step = 0; step < pitchRatingAmplitude.length; step++) {
        pitchMatchingAmplitude[step] =
        (ampInit[step]
            + ampInit[step + pitchRatingAmplitude.length]
            + ampInit[step + (2 * pitchRatingAmplitude.length)]) / 3;
    }
    console.log('pitchMatchingAmplitude AFTER', pitchMatchingAmplitude)
}

const switchToPitchMatching = () => {
    currentPhase = 'pitchMatching';
    console.log('Hello from switch to pitchMatching');
    $('#startId').prop('disabled', false).css({'opacity': '1'});
    // $("#testLow").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'}).html("Sound 1");
    $("#up").html("Sound 2").prop('disabled', false);
    $("#down").html("Sound 1").prop('disabled', false);
    $("#finish").css({'opacity': '0', 'cursor': 'not-allowed'});
    
    addPitchMatchingInstructions();
}

const handlePitchMatching = (event) => {
    $('#startId').prop('disabled', true).css({'opacity': '0'});
    if (event.target.id === 'down') {
        endArrayIndex--
    } else if (event.target.id ==='up'){
        arrayIndex++
    }
    console.log('Hello from handlePitchMatching')
    // TODO Need to save final frequencies (when the indices are equal)
    var tone1 = bracketFrequencies[arrayIndex];
    var amplitude1 = pitchMatchingAmplitude[arrayIndex];
    var tone2 = bracketFrequencies[endArrayIndex];
    var amplitude2 = pitchMatchingAmplitude[endArrayIndex];
    if (pitchMatchingCounter < 3) {
        if (arrayIndex == endArrayIndex) {
            pitchMatchingCounter++; 
            pitchMatchResult.push({value: bracketFrequencies[arrayIndex], index: arrayIndex}); 
            endArrayIndex = bracketFrequencies.length - 1;
            console.log(`handlePitchMatching with pitchMatchResult 
                ${bracketFrequencies[arrayIndex]} at ${arrayIndex}`);
            arrayIndex = 0;
            tone1 = bracketFrequencies[arrayIndex];
            amplitude1 = pitchMatchingAmplitude[arrayIndex];
            tone2 = bracketFrequencies[endArrayIndex];
            amplitude2 = pitchMatchingAmplitude[endArrayIndex];
        }
        if (pitchMatchingCounter === 3) {
            switchToPitchRating();
        } else {
            playTwoSounds(tinnitusTypeMeasured, tinnitusTypeMeasured, soundEar, amplitude1, amplitude2, tone1, tone2);
        }
    }
}

const handleQualityMatching = (event) => {
    $('#startId').prop('disabled', true).css({'opacity': '0'});
    if (event.target.id === 'down') {
        tinnitusTypeMeasured = 'Tonal';
        console.log(`handleQualityMatching with tinnitusTypeMeasured: ${tinnitusTypeMeasured}`);
        switchToCalibration();
    } else if (event.target.id ==='up'){
        tinnitusTypeMeasured = 'Noisy';
        console.log(`handleQualityMatching with tinnitusTypeMeasured: ${tinnitusTypeMeasured}`);
        switchToCalibration();
    } else if (event.target.id === 'startId') {
        const tone = 1000;
        const frequencyIndex = bracketFrequencies.indexOf(tone)
        console.log("Hello from handleQualityMatching - after ifs");
        console.log('bracketFrequencies', bracketFrequencies);
        const amplitude = pitchMatchingAmplitude[frequencyIndex];
        console.log(`frequencyIndex: ${frequencyIndex}, pitchMatchingAmplitude: ${pitchMatchingAmplitude}`)
        playTwoSounds('Tonal', 'Noisy', soundEar, amplitude / 6, amplitude, tone, tone);
    // TODO JJL needs to fix playtwosounds routing to handle two different sounds
    }
 }

const handlePitchRating = (event) => {
    console.log(`In handlePitchRating with event.target.id of ${event.target.id}`, event)
    if (event.target.id === 'startId') {
        $('#startId').prop('disabled', true).css({'opacity': '0'});
        $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
        const tone = ratingsFrequencies[frequencyIndex]
        const amplitude = pitchRatingAmplitude[ratingCount[frequencyIndex]]
        // playOneSound(participantData['tinnitusType'], soundEar, amplitude, tone, null)
    } else if (event.target.id === 'finish') {
        rating[frequencyIndex] = $('#rangeSlider').val();
        console.log(`Recording rating of ${rating[frequencyIndex]} for index ${frequencyIndex}`);
        if (frequencyIndex >= frequencies.length - 1) {
            switchToFinalMatch();
        } else {
            frequencyIndex++;
            if (heardFrequencies[frequencyIndex]) {
                const tone = ratingsFrequencies[frequencyIndex]
                const amplitude = pitchRatingAmplitude[ratingCount[frequencyIndex]]
///JJL TODO put back int                //playOneSound(tinnitusTypeMeasured, soundEar, amplitude, tone, null)
                $('#finish').prop('disabled',false);
            } else {
                console.log('recursively calling self')
                // TODO is this the right thing to do?
                handlePitchRating(event)
            }
        }
    } else {
        // just play the same thing again
        const tone = ratingsFrequencies[frequencyIndex]
        const amplitude = pitchRatingAmplitude[ratingCount[frequencyIndex]]
///JJL TODO put back int        // playOneSound(tinnitusTypeMeasured, soundEar, amplitude, tone, null)
        $('#finish').prop('disabled',false);
    }
}

const handleFinishAnswer = (event) => {
    console.log(`handleFinishAnswer`)
    const mostSimilarIndices = topThreeIndices(rating)
    const tones = []
    mostSimilarIndices.forEach((val) => {
        tones.push({frequency: ratingsFrequencies[val], freqIndex: val})
    })
    console.log(`mostSimilarIndices are ${mostSimilarIndices}`);
    tones.sort((a, b) => b.frequency - a.frequency);
    let bestTone = tones[1];
    console.log(`equating to tones ${JSON.stringify(tones)} with best ${JSON.stringify(bestTone)}`);
    const tone = bestTone.frequency
    const amplitude = pitchRatingAmplitude[ratingCount[bestTone.freqIndex]]

    playOneSound(tinnitusTypeMeasured, soundEar, amplitude, tone, null)
    $('#submitTinRating').prop('disabled', false)
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

const addCalibrationInstructions = () => {
    $("#instruct").html('Instructions: Set up for Multiple Pitches');
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Test 1 </strong> button to play a sound. </li>\
                    <li>Use the <strong> Make Louder </strong> and <strong> Make Softer </strong> buttons to find a sound that is moderately soft</li>\
                    <li>Click <strong> Calibration Complete </strong> when you are finished for each of the three test sounds. </li><br>\
                    <li>Note: You will see an orange circle while sound is playing.");
}

const addRIInstructions = () => {
    $("#instruct").html('Instructions: Residual Inhibition');
    $("#startingInstr").html("<li id='Instructions'> Push one of the <strong> Sound </strong> buttons to play a sound. </li>\
                    <li>This sound will play for one minute. </li>\
                    <li>When the sound stops, you will be asked what percentage of your tinnitus is left. </li>\
                    <li>The scale is 0% (no tinnitus) to 100% (tinnitus is the same as before the sound) </li>\
                    <li>You will be prompted to do this every 30 seconds until your tinnitus returns to 100% or 4 minutes have passed. </li>\
                    <li>Do this for each of the sound buttons. </li><br>\
                    <li>Note: This sound might be a bit loud. If you think it is hurting your ears, click the stop button and remove your earphones.  </li>\
                    <li>Note: You will see an orange circle while sound is playing.");
}

const addQualityMatchingInstructions = () => {
    $("#instruct").html('Instructions: Quality Matching');
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Start </strong> to play two sounds. </li>\
                    <li>If the quality of your tinnitus sounds more like the first sound, click the \
                        <strong> Sound 1 </strong> button. </li>\
                    <li>If the quality of your tinnitus sounds more like the second sound, click the <strong> Sound 2 </strong> button.</li>\
                    <li>Note: You will see an orange circle while sound is playing.");
}

const addPitchMatchingInstructions = () => {
    $("#instruct").html('Instructions: Pitch Matching');
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Start </strong> to play two sounds. </li>\
                    <li>If the pitch of your tinnitus is more similar to the sound that played first, click the \
                        <strong> Sound 1 </strong> button. </li>\
                    <li>If the pitch of your tinnitus is more similar to the sound played second, click the <strong> Sound 2 </strong> button.</li>\
                    <li style='color:firebrick'><strong>This procedure will repeat a number of times.</strong></li>\
                    <li>Note: You will see an orange circle while sound is playing.");
}

const addPitchRatingInstructions = () => {
    $("#instruct").html('Instructions: Pitch Rating');
    $("#startingInstr").html("<li id='Instructions'>In this phase of the experiment, we will measure\
        the pitch of your tinnitus using a different procedure.</li>\
    <li>Push <strong> Play </strong> (as many times as you want) to hear a sound.</li>\
    <li>Rate the similarity of the pitch of that sound to the pitch of your tinnitus using the slider.</li>\
    <li>Push <strong> Done </strong> button when you satisfied with your rating and a new sound will play. </li>\
    <li>If you can't hear the sound, drag the slider all the way to the left. </li><br>\
    <li>Push <strong> Start </strong> when you are ready. </li><br>\
    <li>Note: there are a total of 45 sounds in this section of the experiment.</li>");
}
// The following code sets  levels for all tones based on values set for calibration
// low-frequency tones (500-1500) set to 500-Hz calibration amplitude
// mid-frequency tones (2000-5000) set to 3000-Hz calibration
// high-frequency tonres (6000 and above) set to 8000 Hz calibration
// const testSettings = {
//     testLow: {tonef: 500, calPass: 0},
//     testMid: {tonef: 3000, calPass: 4},
//     testHigh: {tonef: 8000, calPass: 9}
// }

//TODO Need to fix for final version

const setLevelsFrequencyRanges = () => {
    console.log('starting state of ampInit', ampInit)
    const copy = [...ampInit]
    for (let step = 0; step < 2; step++) {   // 0 & 4
        ampInit[step] = copy[testSettings.testLow.calPass];
    }
    for (let step = 2; step < 5; step++) {  // 4 & 9
        ampInit[step] = copy[testSettings.testMid.calPass];
    }
    for (let step = 5; step < 7; step++) { // 9 & 13
        ampInit[step] = copy[testSettings.testHigh.calPass];
    }
    for (let step = 7; step < 9; step++) { // 13 & 17
        ampInit[step] = copy[testSettings.testLow.calPass];
    }
    for (let step = 9; step < 12; step++) { // 17 & 22
        ampInit[step] = copy[testSettings.testMid.calPass];
    }
    for (let step = 12; step < 14; step++) {  // 22 & 26
        ampInit[step] = copy[testSettings.testHigh.calPass];
    }
    for (let step = 14; step < 16; step++) {  // 26 & 30
        ampInit[step] = copy[testSettings.testLow.calPass];
    }
    for (let step = 16; step < 19; step++) { // 30 & 35
        ampInit[step] = copy[testSettings.testMid.calPass];
    }
    for (let step = 19; step < 21; step++) { // 35 & 39
        ampInit[step] = copy[testSettings.testHigh.calPass];
    }
    console.log('ending state of ampInit', ampInit)
} 

const setUplevelMatching = () => {
    // remove the calibration test buttons
    $('#testButtons>button').css({'opacity': '0'})
    $("#down").html('tinnitus is softer').prop('disabled', true);
    $("#up").html('tinnitus is louder').prop('disabled', true);
    $("#finish").html("Done").prop('disabled', true);
    $('#startId').prop('disabled', false).css({'opacity': '1', 'cursor' : 'pointer'});
    //Setting up new frequency range
}

const setUpPitchAndQualityMatching = () => {
    // Sets up the buttons for pitch matching
    // $('#testButtons>button').remove()
    console.log('setUpPitchAndQualityMatching')
    $('#ansButton1').removeClass('is-invisible');
    $('#ansButton2').removeClass('is-invisible');
    $("#down").html('Sound 1').css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#up").html('Sound 2').css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#finish").hide();
    $("#testNoise").hide();
    $('#startId').prop('disabled', false).css({'opacity': '1'});
}

const setUpPitchRating = () => {
    // remove the calibration test buttons
    $('#testButtons').hide();
    // $("#testMid").remove();
    // $("#testLow").remove();
    // $("#testHigh").remove();
    $("#down").html('tinnitus is softer');
    $("#up").html('tinnitus is louder');
    $("#finish").html("Done");
    $('#startId').prop('disabled', false).css({'opacity': '1'});
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
    setLevelsFrequencyRanges();
    $("#testLow").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    addLevelMatchingInstructions();
    setUplevelMatching();
}

const switchToPitchRating = () => {
    currentPhase = 'pitchRating';
    $('#ansButton1').remove();
    $('#ansButton2').removeClass('is-col-span-2').addClass('is-col-span-4')
    $("button.answer").prop('disabled', true)
        .css({'cursor': 'not-allowed', 'opacity': '.1'});
    addPitchRatingInstructions();
    $('#finish').prop('disabled',true).css({'opacity': '.1'});
    $('#startId').prop('disabled', false).css({'opacity': '0'});
    $('#down').css({'opacity': '0'});
    $('#up').html('Play').prop('disabled', false).css({'opacity': '1','cursor': 'pointer'});
    $('#ratingSlider').show();
    $("#finish").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
    frequencyIndex = 0;
    //TODO JJL Take out and rename amplitude values for pitch rating after pitch matching works
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
    const buttonId = $('#testButtons').find('button:not(:disabled)').attr('id')
    console.log("The clicked button has id " + buttonId);
    $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    testValues = testSettings[buttonId]
    // const amplitude = buttonId === 'testHigh' ? null : ampInit[testValues.calPass]
    const amplitude = ampInit[testValues.calPass]
    playOneSound(tinnitusTypeMeasured, soundEar, amplitude, testValues.tonef, buttonId)
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

const handleFinishSoundSelection = (event) => {
    //This is the octave test - set in switchtoFinalPitchMatch
    const tone = $(event.target).attr('tone');
    const toneIndex = frequencies.indexOf(Number(tone));
    const amplitude = pitchRatingAmplitude[toneIndex];
    console.log(`hello from handleFinishSoundSelection attribute index and amplitude ${tone} ${toneIndex} ${amplitude}`, event);
    playTestButtonsSound(tinnitusTypeMeasured, soundEar, amplitude, tone, TONE_DURATION, null)
    $(event.target).addClass('played');
    // $("#testButtons>button").prop('disabled', false);   //TODO Need to figure out how to enable only the correct buttons
    if ($('#testButtons button.played').length === 3) {
        $('#submitTinRating').prop('disabled',false)
        // TODO check that fields have text upon button click - Stu needs to do
    } 
}

//TODO keep working on this to make sure that each sound is played once
const handleResidualInhibition = (event) => {
    console.log(`The clicked button has id ${event.target.id}`, event)
    const tone = $(event.target).attr('tone');
    const toneIndex = frequencies.indexOf(Number(tone));
    const amplitude = pitchRatingAmplitude[toneIndex];
    const duration = 2; // a 60-sec sound 
    $(event.target).addClass('played');
    playTestButtonsSound('Noisy', soundEar, amplitude, tone, duration, event.target.id);
    let tinnitusPercentage = prompt('Indicate how much of your tinnitus is left. 0 indicates no tinnitus and 100 is full tinnitus. Click ok when you have entered your rating.')
    //TODO Needs to get the timer in here
    // Need to put this after all data collection complete
    // if ($('#testButtons button.played').length === 3) {
    //     complete();
    // }
    // $("#finish").prop('disabled', false);
    // $("#finish").css({'opacity': '1','cursor': 'pointer' });
}

const handleCalibration = (event) => {
    console.log(`The clicked button has id ${event.target.id}`, event)
    $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    testValues = testSettings[event.target.id]
    const amplitude = ampInit[testValues.calPass] //TODO Need to resaerch what "Null" means in this context
    playOneSound(tinnitusTypeMeasured, soundEar, amplitude, testValues.tonef, event.target.id)
    $("#finish").prop('disabled', false);
    $("#finish").css({'opacity': '1','cursor': 'pointer' });
}

const handleNoiseCalibration = (buttonId) => {
    console.log(`The clicked button has id ${buttonId}`)
    $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    testValues = testNoiseSettings[buttonId]
    const amplitude = ampInit[0]; 
    console.log(`amplitude is ${amplitude}`)
    playOneSound('Noisy', soundEar, amplitude, testValues.tonef, buttonId)
    $("#finish").prop('disabled', false);
    $("#finish").css({'opacity': '1','cursor': 'pointer' });
}

const switchToResidualInhibition = () => {
    currentPhase = 'residualInhibition';
    $('#ratingFormContainer').remove();
    addRIInstructions();
    $("#testButtons>button").removeAttr('tone');
    // TODO Maybe stu can fix this" ?
    // If audible, display buttons and get a new tone attribute
    if (bracketFrequencies.indexOf(8000) != -1) {
        $("#testHigh").attr('tone','8000').prop('disabled', false).css({'opacity': '1'}).removeClass('played');
    } else {
        $("#testHigh").attr('tone','8000').prop('disabled', true).css({'opacity': '0'});
    }
    if (bracketFrequencies.indexOf(4000) != -1) {
        $("#testMid").attr('tone','4000').prop('disabled', false).css({'opacity': '1'}).removeClass('played');
    } else {
        $("#testMid").attr('tone','4000').prop('disabled', true).css({'opacity': '0'});
    }
    if (bracketFrequencies.indexOf(1000) != -1) {
        $("#testLow").attr('tone','1000').prop('disabled', false).css({'opacity': '1'}).removeClass('played');
    } else {
        $("#testLow").attr('tone','1000').prop('disabled', true).css({'opacity': '0'});
    }

    // $('#ratingSlider').show();
    // $('#0').html('0%');
    // $('#25').html('25%');
    // $('#50').html('50%');
    // $('#75').html('75%');
    // $('#100').html('100%');
    // $('#finish').show().prop('disabled',true).css({'opacity': '1'}).html('Submit percentage');
    

}

const switchToCalibration = () => {
    currentPhase = 'calibrate';
    console.log('Hello from switch tocalibration');
    $('#testButtons').removeClass('is-invisible').show();
    $("#down").html("Make Softer").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#up").html("Make Louder").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#testHigh").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    $("#testMid").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#testLow").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#finish").show();
    addCalibrationInstructions();
}


function playOneSound(tinnitusType, ear, amplitude, tone, buttonId) {
    $('button').prop('disabled', true);
    $("#ansButton1 button").css({'cursor': 'not-allowed'});
    $("#ansButton2 button").css({'cursor': 'not-allowed'});
    $("#soundIndicator").css({'opacity': '1'}); // Turning on the circle while playing

    //TODO Amplitude of first sound (8000 Hz is not passing correctly).  Needs fixing.

    const filePrefix = tinnitusType === "Noisy" ? ear + 'wavNoise' : ear + 'wav';
        
    const source = `${filePrefix}${tone}.wav`
    const howlOptions = {
        src: [source],
        html5: true
    }
    if (amplitude) {
        howlOptions['volume'] = amplitude;
    }
    const sound = new Howl(howlOptions);

    console.log(`Hello from playOneSound with src ${source} ${tinnitusType}:${ear}:${amplitude}:${tone}`)
    sound.play();

    sound.on('end', () => {
        if (buttonId) {
            $('#'+buttonId).prop('disabled', false);
        }
        $("#finish").prop('disabled', false);
        $("#ansButton1 button").prop('disabled', false).css({'cursor': 'pointer', 'opacity' : '1'});
        $("#ansButton2 button").prop('disabled', false).css({'cursor': 'pointer', 'opacity' : '1'});
        $("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
    });
}

function playTestButtonsSound(tinnitusType, ear, amplitude, tone, duration, disabledButtonId) {
    $('button').prop('disabled', true);
    $("#soundIndicator").css({'opacity': '1'}); // Turning on the circle while playing

    console.log(`duration and disabledButtonId ${duration} ${disabledButtonId}`);
    // if (duration == 2) {
    //     console.log('duration = passed');
    // } else {
    //     console.log('duration failed');
    // }    

    // TODO Doesn't work corectly
    const filePrefix = tinnitusType === "Noisy" ? ear + 'wavNoise' : ear + 'wav';
    // let filePrefix = null;
    // if (duration == 2) {
    //     filePrefix = tinnitusType === "Noisy" ? ear + 'wavNoise' : ear + 'wav';
    //     console.log('duration passed');
    // } else {
    //     filePrefix = ear + 'wavNoise60sec';
    // }    

    const source = `${filePrefix}${tone}.wav`
    const howlOptions = {
        src: [source],
        html5: true
    }
    if (amplitude) {
        howlOptions['volume'] = amplitude;
    }
    const sound = new Howl(howlOptions);

    console.log(`Hello from playTestButtonSound with src ${source} ${tinnitusType}:${ear}:${amplitude}:${tone}`)
    sound.play();

    sound.on('end', () => {
        $("#finish").prop('disabled', false);
        $("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
        // NEed to only enable buttons that are audible
        $('#testButtons>button').prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
        $('#testButtons>button.notAudible').prop('disabled', true).css({'opacity': '0'});
        if (disabledButtonId) {
            $('#'+disabledButtonId).prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
        }
    });
}
// TODO - need to ensure that only audible buttons (or buttons with a tone class) are displayed

function playTwoSounds(tinnitusTypeS1, tinnitusTypeS2, ear, amplitude1, amplitude2, tone1, tone2, buttonId) {
    $('button').prop('disabled', true).css({'cursor': 'not-allowed'});
    console.log(`playTwoSounds with ${tinnitusTypeS1}:${amplitude1}:${tone1} vs ${tinnitusTypeS2}:${amplitude2}:${tone2}`)
    $("#soundIndicator").css({'opacity': '1'}); // Turning on the circle while playing

    const filePrefix1 = tinnitusTypeS1 === "Noisy" ?  ear + 'wavNoise' : ear + 'wav';
    const filePrefix2 = tinnitusTypeS2 === "Noisy" ? ear + 'wavNoise' : ear + 'wav';

    //TODO - need to adjust the amplitudes of the noise so they are same as the tone; max may also need to be different!
    const source1 = `${filePrefix1}${tone1}.wav`
    const source2 = `${filePrefix2}${tone2}.wav`
    console.log(`playTwoSounds with ${source1}:${source2}`)

    let howlOptions = {
        src: [source1],
        html5: true
    }
    if (amplitude1) {
        howlOptions['volume'] = amplitude1;
    }

    let sound = new Howl(howlOptions);
    sound.play()
    sound.on('end', () => {
        setTimeout(() => {
            howlOptions = {
                src: [source2],
                html5: true
            }
            if (amplitude2) {
                howlOptions['volume'] = amplitude2;
            }
            const nextSound = new Howl(howlOptions);
            nextSound.play();
            nextSound.on('end', () => {
                $("#finish").prop('disabled', false).css({'cursor': 'pointer'});
                $("#ansButton1 button").prop('disabled', false).css({'cursor': 'pointer', 'opacity' : '1'});
                $("#ansButton2 button").prop('disabled', false).css({'cursor': 'pointer', 'opacity' : '1'});
                $("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
            })

        }, 500)
    })
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
        if (participantData['tinnitusEar'] === "Right"){
            soundEar = "L";
        } else if (participantData['tinnitusEar'] === "Left"){
            soundEar = "R";
        } else {
            soundEar = "R";  //Sound played in Right ear if tinnitus is bilateral
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
                $('footer.footer').show();
                // ampInit
                const value = participantData['hearingLoss'] === 'HL' ? 0.1 : 0.001;
                ampInit = Array(frequencies.length).fill(value);
            // })
            // .fail(() => {
            //     $('#participantForm').append('<div class="notification is-danger">The Participant Id is not valid</div>');
            // });
    });
}

const submitExperimentResults = (tinitusRating) => {
    console.log(`submit tinitusRating of ${tinitusRating} and whatever additional data collected....`)
    // TODO see tintest function of the same name
    for (let i = 0; i < frequencies.length; i++) {
        participantData['CalFreq'+i] = frequencies[i];
    }
    for (let i = 0; i < ampInit.length; i++) {
        participantData['CalAmp'+i] = ampInit[i];
    }
    participantData['clinicalRating'] = tinitusRating
    for (let i = 0; i < ratingsFrequencies.length; i++) {
        participantData['rfreqs'+i] = ratingsFrequencies[i];
    }
    for (let i = 0; i < rating.length; i++) {
        participantData['rating'+i] = rating[i];
    }
    console.log('POSTING DATA', participantData)
    // TODO POST
    // $.ajax({
    //     type: 'POST',
    //     url: 'https://xcca7zh3n1.execute-api.us-east-2.amazonaws.com/Prod/complete/',
    //     dataType: 'json',
    //     data: participantData
    // }).done(() => {
    //     console.log('DATA SAVED');
    //     console.log(myData)
    // }).fail((err) => {
    //     console.error('Data not saved', err);
    //     $("#startingInstr").html("<li id='Instructions'>OOPS - something went completely wrong saving your experiment data.</li>");
    // });
}
const complete = () => {
    const tinitusRating = $('#tinnitusRatingField').val();
    console.log(`tinitusRating is ${tinitusRating}`)
    if (tinitusRating !== '') {
        $("#up").remove();
        $("#instruct").html('Thank you.  You are done!');
        $("#startingInstr").remove();
        $('#tinnitusRating').remove();
        submitExperimentResults(tinitusRating);
    } else {
        $("#startingInstr").append('<li class="important">Rating is required</li>')
    }
}


const answerPhaseFunction = {
    octaveTest: switchToResidualInhibition,
    calibrate: handleCalibrateAnswer,
    levelSet: handleLevelSet,
    pitchRating: handlePitchRating,
    pitchMatching: handlePitchMatching, 
    qualityMatching: handleQualityMatching
}

const donePhaseFunction = {
    calibrate: handleCalibrateDone,
    calibrateNoise: switchToQualityMatching,
    levelSet: handleLevelSetDone,
    pitchRating: handlePitchRating,
    // TODO delete this line cuz there is no Done button in pitch matching right?
}

const testButtonsFunctions = {
    calibrate: handleCalibration,
    octaveTest: handleFinishSoundSelection,
    residualInhibition: handleResidualInhibition
}

$.when( $.ready ).then(() => {
    console.log("We are ready")
    handleParticipantForm();
    $("button.test").click((event) => {
        console.log(`The test button in phase with id ${currentPhase} ${event.target.id}`, event)
        event.preventDefault();
        const handler = testButtonsFunctions[currentPhase]
        handler(event)
    });
    $("button.testNoise").click((event) => {
        event.preventDefault();
        handleNoiseCalibration(event.target.id)
    });
    $('#finish').click((event) => {
        $("#levelAtMax").css({'opacity': '0'});
        console.log(`finish button clicked in phase ${currentPhase}`)
        const handler = donePhaseFunction[currentPhase]
        handler(event)
    })
    $("button.answer").click((event) => {
        console.log(`Answer button clicked ${event.target.id} in phase ${currentPhase}`)
        $("button.answer").prop('disabled', true);
        const handler = answerPhaseFunction[currentPhase]
        handler(event)
    })
    $("#startId").click((event) => {
        console.log(`startId button clicked in phase ${currentPhase}`)
        const handler = answerPhaseFunction[currentPhase]
        handler(event)
    })
    $('#submitTinRating').click((event) => {
        console.log(`submitTimeRating button clicked in phase ${currentPhase}`)
        const handler = answerPhaseFunction[currentPhase]
        handler(event)
        event.preventDefault()   
        // complete()
    })
});

// TODO during level setting could we disable done button while sound is playing?

