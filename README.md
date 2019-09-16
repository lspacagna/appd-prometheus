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

4. (Optional) AWS Account with access to IAM and Lambda

5. (Optional) Claudia.js

```
$ npm install claudia -g
```

## Install Steps

1. Clone package

```
$ git clone git@github.com:lspacagna/appd-prometheus.git
$ cd appd-prometheus
```
2. Choose to run extension locally or in Lambda

This extension default configuration is run locally. If you would like to run the
extension inside a Lambda function. You need to edit src/index.js and comment
out the last line in the file. This should look like this:

```
// runLocal()
```

3. Configure extension to connect to your Prometheus endpoint

Edit the PROMETHEUS_URL constant at the top of src/index.js

```
const PROETHEUS_URL = 'http://localhost:9090'
```

4. Configure the extension to report to your already deployed machine agent

Edit the APPD_URL constant at teh top of src/index.js

```
const APPD_URL = 'http://localhost:8293/api/v1/metrics'
```

3. Use Babel to compile next-gen JS to Node compatible JS.

```
$ yarn run build
```

This will compile the src/index.js file into dist/index.js. The dist/ directory
will be created automatically.
