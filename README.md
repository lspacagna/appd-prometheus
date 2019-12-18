# AppD &amp; Prometheus Integration

## Introduction

This extension connects to a Prometheus endpoint and runs the specified queries.
Responses are then parsed and then passed to AppDynamics as analytics events.




## Pre-requisites

1. (Optional) Homebrew - for easier installation and management on MacOS
2. Node.JS - currently targeting latest LTS version (10.16.3)

```
$ brew install node
```

3. (Optional) AWS Account with access to IAM and Lambda - only required if deploying to Lambda

4. (Optional) Claudia.js - only required if deploying to Lambda

```
$ npm install claudia -g
```

5. AppDynamics controller with appropriate Analytics licence.



## Installation

### Clone package

```
$ git clone git@github.com:lspacagna/appd-prometheus.git
$ cd appd-prometheus
```
### Choose to run extension locally or in Lambda

This extension default configuration is to run locally. If you would like to run the
extension inside a Lambda function. You need to edit src/index.js and comment
out the last line in the file. It should look like this:

```
// runLocal()
```

### Rebuild project (only if deploying to Lambda)

If you are deploying to Lambda and have commented out 'runLocal()' you will need to rebuild the project. Rebuilding will parse the source code in /src and store the built version in /dist.

```
npm run build
```

## Configuration

### Configure extension controller connection

Open the the conf/config.json file for editing. The default configuration is below

```
{
  "read_local": false ,
  "prometheus_url": "http://localhost:9090",
  "appd_analytics_url": "https://analytics.api.appdynamics.com",
  "appd_global_account_name": "",
  "appd_events_api_key": "",
  "schema_name": "prometheus_events",
  "local_file": "data/sample.json"
}
```

Parameter | Function | Default Value
------------ | -------------
read_local | Choose to read from local data file instead of pulling data from Prometheus API. Useful during debugging. | false
prometheus_url | The URL of your Prometheus deployment | http://localhost:9090
appd_analytics_url | URL to connect to the AppD controller events service. See https://docs.appdynamics.com/display/PRO45/Analytics+Events+API#AnalyticsEventsAPI-create_schemaCreateEventSchema for the URL for your controller. | (blank)






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
$ claudia create --region us-east-1 --handler index.handler
```

When the deployment completes, Claudia will save a new file claudia.json in
your project directory, with the function details, so you can invoke and
update it easily.

For more detailed instructions see: https://claudiajs.com/tutorials/hello-world-lambda.html

#### Running in AWS

You can either use the AWS UI to trigger the function. Or you can setup a trigger.
A common trigger would be to run this extension once per minute.



## Define Prometheus Queries

The extension has been designed to run Prometheus queries in series. By default
the extension will run two sample queries and send the data to AppD.

Currently, the queries are configured within the extension code. Future versions
of this extension will configure in an external configuration file.

To change the default queries find the getDataFromPrometheus() method. For each
query you would like to run add a new 'prometheusRequest' line. The query should
be passed as the variable to the prometheusRequest call.

Default config:
```
data.push(await prometheusRequest('prometheus_target_interval_length_seconds'))
data.push(await prometheusRequest('prometheus_http_requests_total'))
```

Default config with custom query:
```
data.push(await prometheusRequest('prometheus_target_interval_length_seconds'))
data.push(await prometheusRequest('prometheus_http_requests_total'))
data.push(await prometheusRequest('CUSTOM QUERY HERE'))
```

Remember to re-compile the project after making changes.
