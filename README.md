# TinnitusTest

Jenny - please add a short description

The application uses several AWS resources, including Lambda functions and an API Gateway API. 
These resources are defined in the `template.yaml` file in this project.

## Deploy the experiment

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality
 for building and testing Lambda applications. To use the SAM CLI, you need the following tools.
 
 * SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
 * Node.js - [Install Node.js 10](https://nodejs.org/en/), including the NPM package management tool.
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
sam package --s3-bucket <bucket> --output-template-file packaged.yaml --profile <your_profile>
sam deploy --template-file packaged.yaml --stack-name <experiment_stack> --parameter-overrides StackPrefix=<prefix> --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND --region us-east-2 --profile <your_profile>
```

After deploying the backend to the AWS cloud, use the output to update tintest.js with this deployments API endpoints
`https://startwhatever` is replace with the value from `StartExperimentApi` 
`http://whatever` is replaced with the value from `CompleteExperimentApi`

Finally, copy experiment resources to their respective buckets.
```bash
cd src
aws s3 cp .  s3://<experiment-bucket> -recursive --profile <your_profile>
cd ../resources
aws s3 cp results.csv s3://<experiment-results-bucket>/results.csv --profile <your_profile>
cd ???
aws s3 cp participants.txt s3://<experiment-results-bucket>/participants.txt --profile <your_profile>

```