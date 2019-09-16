# AppD &amp; Prometheus Integration

## Introduction

This extension connects to a Prometheus endpoint and runs the specified queries.
Responses are then parsed (and sometimes transformed) and then passed to AppDynamics as metrics.




## Pre-requisites

1. (Optional) Homebrew - for easier installation and management
2. Node.JS - currently targeting latest LTS version (10.16.3)x

```
$ brew install node
```

3. Yarn (installed via Homebrew) - latest version (1.17.3)

```
$ brew install yarn
```

4. AppDynamics Machine Agent

4. (Optional) AWS Account with access to IAM and Lambda - only required if deploying to Lambda

5. (Optional) Claudia.js - only required if deploying to Lambda

```
$ npm install claudia -g
```




## Install Steps

### Clone package

```
$ git clone git@github.com:lspacagna/appd-prometheus.git
$ cd appd-prometheus
```
### Choose to run extension locally or in Lambda

This extension default configuration is run locally. If you would like to run the
extension inside a Lambda function. You need to edit src/index.js and comment
out the last line in the file. This should look like this:

```
// runLocal()
```

### Configure extension to connect to your Prometheus endpoint

Edit the PROMETHEUS_URL constant at the top of src/index.js

```
const PROETHEUS_URL = 'http://localhost:9090'
```
### Configure the extension to report to your already deployed machine agent

Edit the APPD_URL constant at teh top of src/index.js. This URL should always end with
'/api/v1/metrics'

```
const APPD_URL = 'http://localhost:8293/api/v1/metrics'
```

### Use Babel to compile next-gen JS to Node compatible JS.

```
$ yarn run build
```

This will compile the src/index.js file into dist/index.js. The dist/ directory
will be created automatically. Whenever you make changes to the src/index.js
file you should re-run this command.




## Run Extension

### Run extension - locally
If running locally the extension is ready to run. Run the extension with the
following command.

```
$ yarn run run
```

### Run extension - Lambda

Create AWS profile with IAM full access, Lambda full access, and API Gateway
Admin privileges.

Add the keys to your .aws/credentials file

```
[claudia]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_ACCESS_SECRET
```

#### Send function to AWS via Claudia

```
$ claudia create --region us-east-1 --handler lambda.handler
```

When the deployment completes, Claudia will save a new file claudia.json in
your project directory, with the function details, so you can invoke and
update it easily.

For more detailed instructions see: https://claudiajs.com/tutorials/hello-world-lambda.html

#### Running in AWS

You can either use the AWS UI to trigger the function. Or you can setup a trigger.
A common trigger would be to run this extension once per minute.
