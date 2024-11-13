# TinnitusTest

This is a test to measure tinnitus perception (loudness and pitch).  
Loudness is measured with level matching.  Pitch is measured using bracketing and a rating method.  

The application uses several AWS resources, including Lambda functions and an API Gateway API. 
These resources are defined in the `template.yaml` file in this project.

## Deploy the experiment

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality
 for building and testing Lambda applications. To use the SAM CLI, you need the following tools.
 
 * SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
 * Node.js - [Install Node.js 20.x](https://nodejs.org/en/), including the NPM package management tool.
 * Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)
 
 Additionally:
 * Create AWS account
 * Configure AWS Identity and Access Management (IAM) permissions.
 
 You can find your API Gateway Endpoint URL in the output values displayed after deployment.
 
 `<bucket>` - The S3 bucket where SAM resources are uploaded. Must be created in advance (same bucket can be used for multiple SAM apps).
 `<your_profile>` - The AWS profile for our IAM (not required if using a default profile).
 `<experiment_stack>` - name for the stack.
 `<prefix>` - AWS resources are given unique names using the <prefix> as a prefix. 
 ```
sam build -t template.yaml --use-container
sam package --s3-bucket <bucket> --output-template-file packaged.yaml --profile <your_profile>
sam deploy --template-file packaged.yaml --stack-name <experiment_stack> --parameter-overrides StackPrefix=<prefix> --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND --region us-east-2 --profile <your_profile>
```

After deploying the backend to the AWS cloud, use the output to update tinnitusTest.js with this deployment's API endpoints
`https://whatever/Prod/start/` is replace with the value from `StartExperimentApi` 
`https://whatever/Prod/complete/` is replaced with the value from `CompleteExperimentApi`

Finally, copy experiment resources to their respective buckets.
```bash
cd src
aws s3 cp .  s3://<experiment-bucket> --recursive --profile <your_profile>
cd ../resources
aws s3 cp results.csv s3://<experiment-results-bucket>/results.csv --profile <your_profile>
cd <where ever you have your file of participant ids>
aws s3 cp participants.txt s3://<experiment-results-bucket>/participants.txt --profile <your_profile>
```

After the deployment, the experiment will not be available at the `CloudFrontDomain` value for 
several minutes. Once it becomes available, any changes to index.html or any other front end resources
freshly copied to `<experiment-bucket>` will not become available to the UI without expiring the
resources cache with:
```bash
aws cloudfront create-invalidation --distribution-id <distribution id> --paths "/*"
```

Look up the distribution id in the cloudfront portion of the AWS console.

### Experiment Flow
* Participant Data Collection - handleParticipantForm submits data to backend and shows `experiment` div
* calibrateNoise Phase - user adjusts volume using computer volume control - phase specific button listener 
  `$("button.testNoise")` and handler `handleNoiseCalibration()`
* transition - `switchToQualityMatching()`
* qualityMatching Phase -  handleQualityMatching() - plays two sounds from which user selects `tinnitusTypeMeasured`. 
  Results used to decide which type of sounds are played to user.
* transition - `switchToCalibration()`
* calibrate Phase - `handleCalibration()`
  * handleCalibrateAnswer() increases or decreases volume assigned to ampInit for a specific frequency, 
  * handleCalibrateDone() transitions from High Freq to Mid Freq to Low Freq then transitions to next phase
* transition - `beginLevelMatching()` includes 
  * `setLevelsFrequencyRanges()` sets `ampInit` values based on High, Mid, and Low freq values collected in calibrate phase
  * `addLevelMatchingInstructions()`
  * `setUplevelMatching()`
* levelSet Phase - handleLevelSet() adjusts `ampInit` up or down for freq in `frequencies` for `frequencyIndex`  
  * `handleLevelSetDone()` switches to next frequency until last `frequency` in array reached then 
* transition - `switchToPitchMatching()` - no longer calls prepPitchMatchingAmplitudes ?????? WHAT AMPLITUDES ARE USED???
                                            NEED TO REINSTATE prepPitchMatchingAmplitudes
* pitchMatching Phase - `handlePitchMatching()` - 3 attempts to zero in on the pitch matching the tinnitus, pushing results onto `pitchMatchResult`
  PITCH MATCHING IS USING FREQ I cannot hear which it should not be using
  then
* transition - `switchToPitchRating()` - Fills `pitchRatingAmplitude` (1/3 length of `frequencies`) getting the avg of pitchRatingAmplitude values for each freq
  * SAME AS prepPitchMatchingAmplitudes ??????? NEED TO DROP THIS as it will now be duplicate work
* pitchRating Phase - `handlePitchRating()`  should be recording results, instead logging `Recording rating of ${rating[frequencyIndex]} for index ${frequencyIndex}`
  * upon reaching the end of frequencies, then
* transition - `switchToFinalMatch()` - determines up to 3 tones to test 
* octaveTest Phase - `handleFinishSoundSelection()` plays up to 3 sounds (determined from results of pitchMatching Phase)
* `submitTinRating` listener calls `handleFinalMatchAnswersSubmission()` should be recording results, instead logging `save rating ${rating} and the tone associated with sound button ${sound}` WHAT DO WE DO WITH THIS???
  SHOULD MOVE TO RIGHT AFTER PITCH MATCHING
  * then 
* transition - `switchToResidualInhibition()` uses 8000, 4000, 1000 tones. Checks to see if bracketFrequencies is one of these frequencies
* residualInhibition Phase - `handleResidualInhibition()` 
  * triggers `doTinnitusReporting()`
    * `pushing ${tinnitusPercentage} onto tinnitusReports with count of ${count}` WHAT DO WE DO WITH THIS???
* MISSING - PROPER BUTTON endabling / disabling in residualInhibition Phase and final transition `complete()`

## Reporting At the END of the ??? 
* tinnitusTypeMeasured - string SAVE self report and result of qualityMatching Phase????
* pitchMatchResult - array of 3 frequencies - result of pitchMatching Phase
* `Recording rating of ${rating[frequencyIndex]} for index ${frequencyIndex}` array of {freq: number, rating: number}
* `save rating ${rating} and the tone associated with sound button ${sound}` {freq: number, rating: number}
* `pushing ${tinnitusPercentage} onto tinnitusReports with count of ${count}` {freq: number, tinnitusPercentage: [number]}
* also need to save amplitudes from level set {freq: number, ampChange: number}[]


## Citation
This code may be modified for a user's specific needs, but this repository should be acknowledged in the comments of any source code and in any print or online publication.


RANDOMIZE before level set and then randomize before pitch rating