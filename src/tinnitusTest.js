"use strict";
const INITIAL_AMPLITUDE_NO_HEARING_LOSS = 0.00316;
const INITIAL_AMPLITUDE_HEARING_LOSS = 0.1;   //This number is bigger than initial amp for no HL - this is 30 dB
const TONE_DURATION = 2
let participantData = {};
let soundEar = "R";
let tinnitusTypeMeasured = "Tonal";
let currentPhase = 'calibrateNoise';
let testValues = null;
const tinnutusReports = []
const testSettings = {
    testLow: {tonef: 500, calPass: 0},
    testMid: {tonef: 3000, calPass: 4},
    // testMid: {tonef: 3000, calPass: 2},
    testHigh: {tonef: 8000, calPass: 9},
    // testHigh: {tonef: 8000, calPass: 4},
}

const testNoiseSettings = {
    testNoise: {tonef: 2000}
}

const frequencies = [
    // 500, 2000, 3000, 4000, 8000,
    // 500, 2000, 3000, 4000, 8000,
    // 500, 2000, 3000, 4000, 8000];
    // 500, 1500, 3000, 5000, 7000, 8000, 12000,
    // 500, 1500, 3000, 5000, 7000, 8000, 12000,
    // 500, 1500, 3000, 5000, 7000, 8000, 12000]
    //|0,13,26                      |                             |
    500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000,
    500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000,
    500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000];
const ratingsFrequencies = [...frequencies];
const bracketFrequenciesAndAmps = [];

// assume all frequencies will be heard, and only mark them otherwise if they are not.
const heardFrequencies = Array(frequencies.length).fill(true);
const pitchMatchResult = [];

const ratingCount = [];
const rating = [];
for (let step = 0; step < ratingsFrequencies.length; step++) {
    ratingCount.push(step % (ratingsFrequencies.length / 3)); //put back after testing!
    rating.push(-1);
}
const pitchRatingFrequenciesAndAmps = []

// will be initialized later
let step = null;
let ampInit = null;
let frequencyIndex = 0;
let arrayIndex = 0;

let pitchMatchingCounter = 0;
const pitchRatingAmplitude = [...new Array(frequencies.length/3)].map(() => 0)
//const pitchMatchingAmplitude = []; //[...new Array(bracketFrequencies.length)].map(() => 0)
// endArrayIndex is used only in pitch matching where we want it to start at the end of bracketFrequencies
let endArrayIndex = undefined; //bracketFrequencies.length - 1;


function shuffle(freqArray, counterArray) {
    for (let i = freqArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        // swap elements array[i] and array[j]
        [freqArray[i], freqArray[j]] = [freqArray[j], freqArray[i]];
        [counterArray[i], counterArray[j]] = [counterArray[j], counterArray[i]];
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
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
    console.log(`switchToFinalMatch transitions to ${currentPhase} Phase`)
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
    //$('#tinnitusRating').show();
    $('div.RatingFormContainer').show()
    $("#ratingSlider").hide();
    $("#finish").remove();
    // sorting PitchMatchResult to establish most common value for the final pitch match, the middle one
    pitchMatchResult.sort((a, b) => b.value.freq - a.value.freq);

    const bestMatchedTone = pitchMatchResult[1].value.freq;
    let lower = bestMatchedTone / 2;
    let higher = bestMatchedTone * 2;
    if (bestMatchedTone === 8000 || bestMatchedTone === 12000) {
        higher = 14000;
    } else if (bestMatchedTone === 750) {
        lower = 500;
    }
    console.log(`best matched tone ${bestMatchedTone} at index: ${pitchMatchResult[1].index}, lower tone ${lower}, higher tone: ${higher}`)
    if (bestMatchedTone === frequencies[(frequencies.length/3) - 1]) {
        higher = undefined;
        $('#testHigh').css({'opacity' : '0', 'cursor': 'not-allowed'}).addClass('played notAudible').prop('disabled', true);  //If sound doesn't exist or isn't audible, hide and get played class
        // nth-child starts at 1 and we want the 'Sound 1' or 2nd option disabled
        $('#tinnitusMatchedSoundField option:nth-child(2)').attr('disabled', true);
    }
    participantData['octaveTestFrequences'] = [lower, bestMatchedTone, higher];

    if (higher) {
        $('#tinnitusMatchedSoundField option:contains("Sound 1")').attr('value', higher.toString());
    }
    $('#tinnitusMatchedSoundField option:contains("Sound 2")').attr('value', bestMatchedTone.toString());
    $('#tinnitusMatchedSoundField option:contains("Sound 3")').attr('value', lower.toString());
    $('#testHigh').attr('tone',higher);
    $('#testMid').attr('tone',bestMatchedTone);
    $('#testLow').attr('tone',lower);
}

const handleLevelSetDone = (event) => {
    // console.log(`handleLevelSet with frequencyIndex ${frequencyIndex}`)
    if (frequencyIndex === (frequencies.length - 1)) {
        switchToPitchMatching()
    } else {
        const amplitude = ampInit[++frequencyIndex]
        const tone = frequencies[frequencyIndex]
        playOneSound(tinnitusTypeMeasured, soundEar, amplitude, tone, null)
    }
}

const handleLevelSet = (event) => {
    $('#startId').prop('disabled', true).css({'opacity': '0'});
    $('#finish').prop('disabled', false).css({'opacity': '1'});
        if (event.target.id === 'up') {
        let maxVolume = parseInt($(event.currentTarget).attr('maxvolume'));
        // console.log(`Current maxvolume is ${maxVolume}`, event.target);
        const value = 1.78 * ampInit[frequencyIndex];
        if (value > 1) {
            maxVolume += 1;
            // using >= coerces both vars to numbers while vs >== does not, and here we want to coercion
            if (maxVolume > 3) {
                // console.log('maxVolume attempts exceeded');
                const heard = confirm('Press OK if you can hear a sound, but it is still softer than your tinnitus or Cancel if you can just barely hear the sound or it is not audible.')
                heardFrequencies[frequencyIndex] = heard;
                // reset before moving on
                $('#up').attr('maxvolume', 0)
                return handleLevelSetDone(event)
            }
            // console.log('bumping maxvolume')
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
    playOneSound(tinnitusTypeMeasured, soundEar, amplitude, tone, null)
}

const switchToQualityMatching = () => {
    currentPhase = 'qualityMatching';
    console.log(`switchToQualityMatching transition to ${currentPhase} Phase`);
    const alertText = "Please do not adjust the volume on your computer any longer, "
        + "even if you can't hear the sounds."
    alert(alertText);
    $('#volumeInstructions').removeClass('is-invisible');
    $('#startId').prop('disabled', false).css({'opacity': '1'});
    $("#testLow").show().prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#testHigh").show().prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    addQualityMatchingInstructions();
    setUpPitchAndQualityMatching();  //This sets up the buttons only
}

// skip anything NOT heard as well as 5000, 7000, 10000
const prepForPitchMatching = () => {
    const skipUs = [5000, 7000, 10000]
    const tries = frequencies.length / 3
    for (let i = 0; i < tries; i++) {
        const freq = frequencies[i];
        const secondTry = tries + i;
        const thirdTry = (tries * 2) + i;
        if (!skipUs.includes(freq) && (heardFrequencies[i] || heardFrequencies[secondTry] || heardFrequencies[thirdTry])) {
            const amplitude = (ampInit[i] + ampInit[secondTry] + ampInit[thirdTry]) / 3;
            console.log(`amplitude is ${amplitude} based on ampInit[${i}] + ampInit[${secondTry}] + ampInit[${thirdTry}]`)
            bracketFrequenciesAndAmps.push({freq: frequencies[i], amplitude: amplitude})
        }
    }
    endArrayIndex = bracketFrequenciesAndAmps.length - 1
}

const switchToPitchMatching = () => {
    currentPhase = 'pitchMatching';
    console.log(`switchToPitchMatching transition to ${currentPhase} Phase`);
    $('#startId').prop('disabled', false).css({'opacity': '1'});
    $("#up").html("Sound 2").prop('disabled', false);
    $("#down").html("Sound 1").prop('disabled', false);
    $("#finish").prop('disabled ', true).css({'opacity': '0', 'cursor': 'not-allowed'});
    addPitchMatchingInstructions();
    // prepPitchMatchingAmplitudes();
    prepForPitchMatching();
}

const handlePitchMatching = (event) => {
    $('#startId').prop('disabled', true).css({'opacity': '0'});
    if (event.target.id === 'down') {
        endArrayIndex--
    } else if (event.target.id ==='up'){
        arrayIndex++
    }
    var tone1 = bracketFrequenciesAndAmps[arrayIndex].freq;
    var amplitude1 = bracketFrequenciesAndAmps[arrayIndex].amplitude;
    var tone2 = bracketFrequenciesAndAmps[endArrayIndex].freq;
    var amplitude2 = bracketFrequenciesAndAmps[endArrayIndex].amplitude;
    if (pitchMatchingCounter < 3) {
        if (arrayIndex == endArrayIndex) {
            pitchMatchingCounter++; 
            pitchMatchResult.push({value: bracketFrequenciesAndAmps[arrayIndex], index: arrayIndex});
            endArrayIndex = bracketFrequenciesAndAmps.length - 1;
            // console.log(`handlePitchMatching with pitchMatchResult 
            //     ${bracketFrequencies[arrayIndex]} at ${arrayIndex}`);
            arrayIndex = 0;
            tone1 = bracketFrequenciesAndAmps[arrayIndex].freq;
            amplitude1 = bracketFrequenciesAndAmps[arrayIndex].amplitude;
            tone2 = bracketFrequenciesAndAmps[endArrayIndex].freq;
            amplitude2 = bracketFrequenciesAndAmps[endArrayIndex].amplitude;
        }
        if (pitchMatchingCounter === 3) {
            switchToPitchRating();
        } else {
            playTwoSounds(tinnitusTypeMeasured, tinnitusTypeMeasured, soundEar, amplitude1, amplitude2, tone1, tone2);
        }
    }
}

const handleQualityMatching = (event) => {
    if (event.target.id === 'down') {
        $('#startId').prop('disabled', true).css({'opacity': '0'});
        tinnitusTypeMeasured = 'Tonal';
        console.log(`handleQualityMatching with tinnitusTypeMeasured: ${tinnitusTypeMeasured}`);
        switchToCalibration();
    } else if (event.target.id ==='up'){
        $('#startId').prop('disabled', true).css({'opacity': '0'});
        tinnitusTypeMeasured = 'Noisy';
        console.log(`handleQualityMatching with tinnitusTypeMeasured: ${tinnitusTypeMeasured}`);
        switchToCalibration();
    } else if (event.target.id === 'startId') {
        const tone = 2000;
        const amplitude = participantData['hearingLoss'] === 'HL' ? INITIAL_AMPLITUDE_HEARING_LOSS : INITIAL_AMPLITUDE_NO_HEARING_LOSS
        playTwoSounds('Tonal', 'Noisy', soundEar, amplitude, amplitude, tone, tone, '#startId');
    }
 }

const handlePitchRating = (event) => {
    // console.log(`In handlePitchRating with event.target.id of ${event.target.id}`)
    if (event.target.id === 'finish') {
        pitchRatingFrequenciesAndAmps[frequencyIndex]['rating'] = $('#rangeSlider').val();
        console.log(`Recording rating of ${JSON.stringify(pitchRatingFrequenciesAndAmps[frequencyIndex])} for index ${frequencyIndex}`);
        if (frequencyIndex >= pitchRatingFrequenciesAndAmps.length - 1) {
            switchToFinalMatch();
        } else {
            frequencyIndex++;
            const tone = pitchRatingFrequenciesAndAmps[frequencyIndex].freq;
            const amplitude = pitchRatingFrequenciesAndAmps[frequencyIndex].amplitude;
            $('#rangeSlider').val(1);
            playOneSound(tinnitusTypeMeasured, soundEar, amplitude, tone, null)
        }
    } else {
        // just play the same thing again
        const tone = pitchRatingFrequenciesAndAmps[frequencyIndex].freq;
        const amplitude = pitchRatingFrequenciesAndAmps[frequencyIndex].amplitude;
        $('#rangeSlider').val(1);
        playOneSound(tinnitusTypeMeasured, soundEar, amplitude, tone, null)
    }
}

const handleFinalMatchAnswersSubmission = (event) => {
    const sound = $('#tinnitusMatchedSoundField').val();
    const rating = $('#tinnitusRatingField').val();
    if (sound && rating) {
        console.log(`save rating ${rating} and the tone associated with sound button ${sound}`)
        participantData['octaveTestResults'] = {frequency: sound, rating: rating}
        switchToResidualInhibition();
    } else {
        $('#ratingFormContainer2').append('<div class="notification is-danger"><p>Both a sound selection and a rating are required</p></div>')
    }
}

const addLevelMatchingInstructions = () => {
    $("#instruct").html('Instructions: Level Matching');
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Start </strong> to play a sound. </li>\
                    <li>If your tinnitus is softer than the sound, click the \
                        <strong> softer </strong> button. </li>\
                    <li>If your tinnitus is louder than the sound or you can't hear the sound, click the <strong> louder </strong> button.</li>\
                    <li style='color:firebrick'><strong>Do this until your find a sound that has the same (or very close) \
                        loudness as your tinnitus.</strong></li>\
                    <li>Then, click the <strong> Done </strong> button to play the next sound and do this again.</li>\
                    <li>Note: You will see an orange circle while sound is playing.");
}

const addCalibrationInstructions = () => {
    $("#instruct").html('Instructions: Set up for Multiple Pitches');
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Test 1 </strong> button to play a sound. </li>\
                    <li>Use the <strong> Make Louder </strong> and <strong> Make Softer </strong> buttons to find a sound that is moderately soft</li>\
                    <li>Click <strong> Calibration Complete </strong> when you are finished for each of the three test sounds. </li>\
                    <li>If your tinnitus loudness is between two levels, select the louder of the two.</li>\
                    <li>Note: You will see an orange circle while sound is playing.");
}

const addRIInstructions = () => {
    $("#instruct").html('Instructions: Residual Inhibition');
    $("#startingInstr").html("<li id='Instructions'> Push one of the <strong> Sound </strong> buttons to play a sound. </li>\
                    <li>This sound will play for one minute. </li>\
                    <li>When the sound stops, you will be asked what percentage of your tinnitus is left. </li>\
                    <li>The scale is 0% (no tinnitus) to 100% (tinnitus is the same as before the sound) </li>\
                    <li>You will be prompted to do this 15 seconds until your tinnitus returns to 100% or 4 minutes have passed. </li>\
                    <li>Do this for each of the sound buttons. </li><br>\
                    <li>Note: This sound might be a bit loud. If you think it is hurting your ears, click the stop button.  </li>\
                    <li>Note: You will see an orange circle while sound is playing.");
}

const addQualityMatchingInstructions = () => {
    $("#instruct").html('Instructions: Quality Matching');
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Play </strong> to play two sounds. </li>\
                    <li>If the quality of your tinnitus sounds more like the first sound, click the \
                        <strong> Sound 1 </strong> button. </li>\
                    <li>If the quality of your tinnitus sounds more like the second sound, click the <strong> Sound 2 </strong> button.</li>\
                    <li>Press the <strong> Play </strong> again as needed if necessary before making a selection</li>\
                    <li>Note: You will see an orange circle while sound is playing.</li>");
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
//
// 500, 2000, 3000, 4000, 8000,
//     500, 2000, 3000, 4000, 8000,
//     500, 2000, 3000, 4000, 8000

const setLevelsFrequencyRanges = () => {
    console.log('starting state of ampInit', ampInit)
    const copy = [...ampInit]
    for (let step = 0; step < 4; step++) {   // 0 & 4
        ampInit[step] = copy[testSettings.testLow.calPass];
    }
    for (let step = 4; step < 9; step++) {  // 4 & 9
        ampInit[step] = copy[testSettings.testMid.calPass];
    }
    for (let step = 9; step < 13; step++) { // 9 & 13
        ampInit[step] = copy[testSettings.testHigh.calPass];
    }
    for (let step = 13; step < 17; step++) { // 13 & 17
        ampInit[step] = copy[testSettings.testLow.calPass];
    }
    for (let step = 17; step < 22; step++) { // 17 & 22
        ampInit[step] = copy[testSettings.testMid.calPass];
    }
    for (let step = 22; step < 26; step++) {  // 22 & 26
        ampInit[step] = copy[testSettings.testHigh.calPass];
    }
    for (let step = 26; step < 30; step++) {  // 26 & 30
        ampInit[step] = copy[testSettings.testLow.calPass];
    }
    for (let step = 30; step < 35; step++) { // 30 & 35
        ampInit[step] = copy[testSettings.testMid.calPass];
    }
    for (let step = 35; step < 39; step++) { // 35 & 39
        ampInit[step] = copy[testSettings.testHigh.calPass];
    }
    console.log('ending state of ampInit', ampInit)
} 

const setUplevelMatching = () => {
    // remove the calibration test buttons
    $('#testButtons>button').css({'opacity': '0'})
    $("#down").html('tinnitus is softer').prop('disabled', true).css({'opacity': '.5', 'cursor': 'not-allowed'});;
    $("#up").html('tinnitus is louder').prop('disabled', true).css({'opacity': '.5', 'cursor': 'not-allowed'});;
    $("#finish").html("Done").prop('disabled', true);
    $('#startId').prop('disabled', false).css({'opacity': '1', 'cursor' : 'pointer'});
    //Setting up new frequency range
}

const setUpPitchAndQualityMatching = () => {
    // Sets up the buttons for pitch matching
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
    frequencyIndex = 0
    const size = frequencies.length / 3;
    for (let i = 0; i < size; i++) {
        const secondTry = size + i;
        const thirdTry = (size * 2) + i;
        if (heardFrequencies[i] || heardFrequencies[secondTry] || heardFrequencies[thirdTry]) {
            const amplitude = (ampInit[i] + ampInit[secondTry] + ampInit[thirdTry]) / 3;
            pitchRatingFrequenciesAndAmps.push({freq: frequencies[i], amplitude: amplitude});
            pitchRatingFrequenciesAndAmps.push({freq: frequencies[i], amplitude: amplitude});
            pitchRatingFrequenciesAndAmps.push({freq: frequencies[i], amplitude: amplitude});
        }
    }
    shuffleArray(pitchRatingFrequenciesAndAmps);
    for (let i = 0; i < pitchRatingAmplitude.length; i++) {
        pitchRatingAmplitude[i] =
            (ampInit[i]
                + ampInit[i + pitchRatingAmplitude.length]
                + ampInit[i + (2 * pitchRatingAmplitude.length)]) / 3;
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
    // console.log("The clicked button has id " + buttonId);
    $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    testValues = testSettings[buttonId]
    const amplitude = ampInit[testValues.calPass]
    playOneSound(tinnitusTypeMeasured, soundEar, amplitude, testValues.tonef, buttonId)
    $("#finish").prop('disabled', false);
    $("#finish").css({'opacity': '1','cursor': 'pointer' });
}

const handleCalibrateDone = () => {
    const current = $("#testButtons button:not(:disabled)")[0];
    // console.log(`current is ${JSON.stringify(current)}`)
    $("#finish").prop('disabled', true)
    if (current.id === 'testHigh') {
        switchToTwo();
    } else if (current.id === 'testMid') {
        switchToThree();
    } else if (current.id === 'testLow') {
        beginLevelMatching()
    }
    // console.log(`the current is ${current.id}`, current)
}

const handleFinishSoundSelection = (event) => {
    //This is the octave test - set in switchtoFinalPitchMatch
    const tone = $(event.target).attr('tone');
    // if the tone is 250 or 750 we don't have that one, so we'll use 500 or the first
    const toneIndex = ['250', '750'].includes(tone) ? 0 : frequencies.indexOf(Number(tone));
    const amplitude = pitchRatingAmplitude[toneIndex];
    // console.log(`hello from handleFinishSoundSelection attribute index and amplitude ${tone} ${toneIndex} ${amplitude}`, event);
    playTestButtonsSound(tinnitusTypeMeasured, soundEar, amplitude, tone, TONE_DURATION, null)
    $(event.target).addClass('played');
    // $("#testButtons>button").prop('disabled', false);   //seems to be working ok this way. 
    if ($('#testButtons button.played').length === 3) {
        $('#submitTinRating').prop('disabled',false).css({'opacity': '1', 'cursor': 'pointer'});
    }
}

//TODO Buttons all need to be disabled until inibution thing is done
// Sounds need to be louder (or max at 1) get multiplication factor from Jenny
// Uncaught TypeError: buttons[i].hasClass is not a function
const handleResidualInhibition = (event) => {
    console.log(`The clicked button has id ${event.target.id}`, event)
    const tone = $(event.target).attr('tone');
    const toneIndex = frequencies.indexOf(Number(tone));
    // make the amplitude 50 decibels above the amplitude matching the "tinnitus loudness"
    //let amplitude = pitchRatingAmplitude[toneIndex] * 316;
    // make the amplitude ? decibels above the amplitude matchign the "tinnitus loudness"
    let amplitude = pitchRatingAmplitude[toneIndex] * 100
    if (amplitude > 1) {
        amplitude = 1;
    }
    $(event.target).addClass('played');
    playTestButtonsSound('Noisy', soundEar, amplitude, tone, 60, event.target.id);
    $('#hriHelper').remove();
    $('#testNoiseButton').append('<div id="hriHelper" class="notification is-info"><p>Please Wait</p></div>');
    $('#testNoiseButton').append(`<button id="emergencyStop" onClick="stop(event)" class="button" tone="${tone}" amplitude="${amplitude}">Stop (too loud)</button>`);
}

const stop = (event) => {
    event.preventDefault();
    Howler.stop();
    const tone = $(event.target).attr('tone');
    const amplitude = $(event.target).attr('amplitude');
    console.log("Stop button pressed");
    tinnutusReports.push({tone: tone, amplitude: amplitude, percentages: [], stopped: true});
    enableNextResidualInhibitionButton();
}

const handleCalibration = (event) => {
    console.log(`The clicked button has id ${event.target.id}`, event)
    $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    testValues = testSettings[event.target.id];
    const amplitude = ampInit[testValues.calPass];
    playOneSound(tinnitusTypeMeasured, soundEar, amplitude, testValues.tonef, event.target.id)
    $("#finish").prop('disabled', false);
    $("#finish").css({'opacity': '1','cursor': 'pointer' });
}

const handleNoiseCalibration = (buttonId) => {
    // console.log(`The clicked button has id ${buttonId}`)
    $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    testValues = testNoiseSettings[buttonId]
    const amplitude = ampInit[0];
    playOneSound('Noisy', soundEar, amplitude, testValues.tonef, buttonId)
}

const prepButton = (idSelector, tone) => {
    if (bracketFrequenciesAndAmps.find(el => el.freq === tone)) {
        $(idSelector).attr('tone', tone.toString()).prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'}).removeClass('played');
    } else {
        $(idSelector).attr('tone', tone.toString()).prop('disabled', true).css({'opacity': '0', 'cursor': 'pointer'}).addClass(['notAudible', 'played']);
    }
}

const switchToResidualInhibition = () => {
    currentPhase = 'residualInhibition';
    $('div.RatingFormContainer').hide();
    addRIInstructions();
    $("#testButtons>button").removeAttr('tone').removeClass('notAudible');
    prepButton('#testHigh', 8000);
    prepButton('#testMid', 4000);
    prepButton("#testLow", 1000);
    // $('#finish').show().prop('disabled',true).css({'opacity': '1'}).html('Submit percentage');
}

const switchToCalibration = () => {
    currentPhase = 'calibrate';
    $('#testButtons').removeClass('is-invisible').show()
    $("#down").html("Make Softer").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#up").html("Make Louder").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#testHigh").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    $("#testMid").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#testLow").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#finish").show().prop('disabled', true)
    $("#startId").html("Start")
    addCalibrationInstructions();
}


function playOneSound(tinnitusType, ear, amplitude, tone, buttonId) {
    $('button').prop('disabled', true).css({'cursor': 'not-allowed'});
    $("#ansButton1 button").css({'cursor': 'not-allowed'});
    $("#ansButton2 button").css({'cursor': 'not-allowed'});
    $("#soundIndicator").css({'opacity': '1'}); // Turning on the circle while playing
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

    console.log(`playOneSound with src ${source} ${tinnitusType}:${ear}:${amplitude}:${tone}`)
    sound.play();

    sound.on('end', () => {
        if (buttonId) {
            $('#'+buttonId).prop('disabled', false);
        }
        $("#finish").prop('disabled', false).css({'cursor': 'pointer'});
        $("#ansButton1 button").prop('disabled', false).css({'cursor': 'pointer', 'opacity' : '1'});
        $("#ansButton2 button").prop('disabled', false).css({'cursor': 'pointer', 'opacity' : '1'});
        $("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
    });
}

const enableNextResidualInhibitionButton = () => {
    let endResidualInhibition = true;
    const buttons = $('#testButtons>button');
    for (let i = 0; i < buttons.length; i++) {
        if (!$(buttons[i]).hasClass('played')) {
            $(buttons[i]).prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
            endResidualInhibition = false;
            break;
        }
    }
    if (endResidualInhibition) {
        complete(true);
    } else {
        $('#hriHelper').remove();
        $('#emergencyStop').remove();
        $('#testNoiseButton').append('<div id="hriHelper" class="notification is-info"><p>Click next Sound button</p></div>')
    }

}
const doTinnitusReporting = (tone, amplitude, count) => {
    let tinnitusPercentage = prompt('Indicate how much of your tinnitus is left. 0 indicates no tinnitus and 100 is full tinnitus. Click ok when you have entered your rating.')
    const timestamp = Date.now()
    const report = tinnutusReports.find(el => el.tone === tone)
    if (report) {
        report.percentages.push({tinnitusPercentage, timestamp})
    } else {
        tinnutusReports.push({tone: tone, amplitude: amplitude, percentages: [{tinnitusPercentage, timestamp}]});
    }
    console.log(`pushing ${tinnitusPercentage} onto tinnitusReports with count of ${count}`)
    if (!(tinnitusPercentage === '100' || count === 16)) {
        setTimeout(() => {
            doTinnitusReporting(tone, amplitude, count + 1)
        }, 10000)
    } else {
        enableNextResidualInhibitionButton()
    }
}

function playTestButtonsSound(tinnitusType, ear, amplitude, tone, duration, buttonId) {
    $('button').prop('disabled', true).css({'cursor': 'not-allowed'});
    $("#soundIndicator").css({'opacity': '1'}); // Turning on the circle while playing

    // console.log(`duration and disabledButtonId ${duration} ${buttonId}`);

    let filePrefix = null;
    if (duration == 2) {
        filePrefix = tinnitusType === "Noisy" ? ear + 'wavNoise' : ear + 'wav';
        // console.log('duration passed');
    } else {
        filePrefix = ear + 'wavNoise60sec';
    }

    const source = `${filePrefix}${tone}.wav`
    const howlOptions = {
        src: [source],
        html5: true
    }
    if (amplitude) {
        howlOptions['volume'] = amplitude;
    }
    const sound = new Howl(howlOptions);

    console.log(`playTestButtonSound with src ${source} ${tinnitusType}:${ear}:${amplitude}:${tone}`)
    sound.play();

    sound.on('end', () => {
        $("#finish").prop('disabled', false);
        $("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
        if (buttonId) {
            $('#' + buttonId).addClass('played')
            doTinnitusReporting(tone, amplitude, 0);
        } else {
            $('#testButtons>button').prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
            $('#testButtons>button.notAudible').prop('disabled', true).css({'opacity': '0', 'cursor': 'none'});
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
                if (buttonId) {
                    $(buttonId).prop('disabled', false).css({'cursor': 'pointer'});
                }
            })

        }, 500)
    })
}

const handleParticipantForm = () => {
    $('#participantForm').submit((event) => {
        event.preventDefault();
        $('#firstSubmit').prop('disabled', true);
        const pid = $('#participantId').val();
        participantData['participantId'] = pid
        participantData['earPhone'] = $('#earphone').val();
        participantData['tinnitusEar'] = $('#tinnitusEar').val();
        participantData['tinnitusType'] = $('#tinnitusType').val();
        participantData['hearingLoss'] = $('#hearingLoss').val();
        participantData['earphoneDescription'] = $('#earphoneDescription').val();
        participantData['browser'] = navigator.userAgent;
        // console.log("participantData", participantData);
        if (participantData['tinnitusEar'] === "Right"){
            soundEar = "L";
        } else if (participantData['tinnitusEar'] === "Left"){
            soundEar = "R";
        } else {
            soundEar = "R";  //Sound played in Right ear if tinnitus is bilateral
        }
        // POST THE DATA
        console.log(`SUBMITTING ${JSON.stringify(participantData)}`);
        $.ajax({
             type: 'POST',
             url: 'https://whatever/Prod/start/',
             dataType: 'json',
             data: JSON.stringify(participantData)
        })
            .done((response) => {
                const startTime = response.startTime;
                participantData['startTime'] = startTime;
                $('#participation').hide();
                $('#experiment').show();
                $('footer.footer').show();
                const value = participantData['hearingLoss'] === 'HL' ?
                    INITIAL_AMPLITUDE_HEARING_LOSS : INITIAL_AMPLITUDE_NO_HEARING_LOSS;
                ampInit = Array(frequencies.length).fill(value);
            })
            .fail(() => {
                $('#participantForm').append('<div class="notification is-danger">The Participant Id is not valid</div>');
            });
    });
}

const submitExperimentResults = (completedResidualInhibition) => {
    // console.log(`submit whatever data collected....${completedResidualInhibition}`)
    participantData['frequencies'] = frequencies;
    participantData['amplitudes'] = ampInit;
    participantData['tinnitusTypeMeasured'] = tinnitusTypeMeasured;
    participantData['pitchMatchResult'] = pitchMatchResult;
    participantData['pitchRatingFrequenciesAndAmps'] = pitchRatingFrequenciesAndAmps;
    participantData['tinnutusReports'] = tinnutusReports;
    participantData['completedResidualInhibition'] = completedResidualInhibition;
    participantData['endTime'] = new Date();
    console.log('POSTING DATA', participantData)
    $.ajax({
         type: 'POST',
         url: 'https://whatever/Prod/complete/',
         dataType: 'json',
         data: JSON.stringify(participantData)
     }).done(() => {
         console.log('DATA SAVED', participantData);
    }).fail((err) => {
        console.error('Data not saved', err);
        $("#startingInstr").html("<li id='Instructions'>OOPS - something went completely wrong saving your experiment data.</li>");
    });
}
const complete = (completedResidualInhibition) => {
    $("#up").remove();
    $("#instruct").html('Thank you.  You are done!');
    $("#startingInstr").remove();
    $('#tinnitusRating').remove();
    // todo make the residual sound buttons go away?
    $('#testButtons').remove();
    $('#hriHelper').remove();
    $('#emergencyStop').remove();
    submitExperimentResults(completedResidualInhibition);
}


const answerPhaseFunction = {
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
        // console.log(`The test button in phase with id ${currentPhase} ${event.target.id}`, event)
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
        event.preventDefault()
        console.log(`submitTinRating button clicked in phase ${currentPhase}`)
        handleFinalMatchAnswersSubmission(event)
    })
});

