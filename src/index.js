import _ from 'lodash'
import fetch from 'node-fetch'

const PROETHEUS_URL = 'http://localhost:9090'
/**
 * URL of the HTTP listener running on your machine agent.
 * See https://docs.appdynamics.com/display/PRO45/Standalone+Machine+Agent+HTTP+Listener
 */
const APPD_MA_URL = 'http://localhost:8293/api/v1/metrics'

/**
 * Some Prometheus metrics return several values with different labels.
 * Method adds the labels to the metric names ready for AppD
 */
const addLabelsToMetricNames = (metric) => {

  if(typeof metric.metric.quantile !== "undefined"){
    metric.metric.__name__ = metric.metric.__name__ + ":" + metric.metric.quantile
  }

  if(typeof metric.metric.handler !== "undefined"){
    metric.metric.__name__ = metric.metric.__name__ + ":" + metric.metric.handler
  }

  return metric
}

/**
 * AppD metrics must be an Int. To keep metric accuracy, convert second values
 * to milliseconds
 */
const convertSecondsToMilliseconds = (metric) => {

  if(metric.metric.__name__.endsWith('seconds')){
    // update metric name
    metric.metric.__name__ = metric.metric.__name__.replace('seconds', 'milliseconds')

    // update metric value
    metric.value[1] = metric.value[1] * 1000
  }

  return metric
}

/**
 * AppD metrics must be an Int. Convert double values to ints
 */
const convertDoublesToInts = (metric) => {

  metric.value[1] = _.round(metric.value[1])

  return metric
}

const appdRequest = async (data) => {
  const requestBody = []

  for(let metric of data){

    /**
    * Creating payload to be passed to AppD API.
    * See https://docs.appdynamics.com/display/latest/Standalone+Machine+Agent+HTTP+Listener
    * for available options.
    */
    const value = {
      "metricName": `Custom Metrics|Prometheus|${metric.metric.job}|${metric.metric.__name__}`,
      "aggregatorType": "OBSERVATION",
      "value": metric.value[1]
    }

    requestBody.push(value)
  }

  const response = await fetch(APPD_MA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if(await response.ok){
    console.log(`[succeeded] ${data.length} metrics to added / updated`)
  }
  else{
    throw new Error(response.statusText);
  }
}

const publishToAppd = async (data) => {
  console.log(`[starting] ${data.length} metrics to add / update...`)

  // Loop through array of metrics and convert seconds to milliseconds
  data.map(convertSecondsToMilliseconds)
  // Loop through array and convert values from doubles to ints
  data.map(convertDoublesToInts)
  // Loop through array of metrics and add the labels to the metric names
  data.map(addLabelsToMetricNames)

  // Send data to AppD
  await appdRequest(data)
}

const prometheusRequest = async (query) => {
  console.log(`[starting] '${query}' query...`)

  const response = await fetch(`${PROETHEUS_URL}/api/v1/query?query=${query}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain, */*'
    }
  })

  if(response.ok){
    const data = await response.json()

    console.log(`[succeeded] '${query}' query. ${data.data.result.length} data points found.`)
    return data.data.result
  }
  else{
    throw new Error(response.statusText);
  }

}

const getDataFromPrometheus = async () => {
  let data = []

  // Make Prometheus queries
  data.push(await prometheusRequest('prometheus_target_interval_length_seconds'))
  data.push(await prometheusRequest('prometheus_http_requests_total'))

  data = _.flatten(data)

  return data
}

const main = async () => {
  try {
    const data = await getDataFromPrometheus()
    await publishToAppd(data)

  } catch (e) {
    console.error(e)
  }
}

// Called when running locally
const runLocal = async () => {
  try{
    console.log(`[starting] Starting Script...`)
    await main()
  }
  catch(e){
    console.log(e)
  }
}

// Only called when running in AWS Lambda
exports.handler = async (event, context, callback) => {
    try{
      console.log(`[starting] Starting Script...`)
      await main()
      callback(null, '[succeeded] AppDynamics updates succeeded')
    }
    catch(e){
      callback(new Error(e))
    }

};

runLocal()
