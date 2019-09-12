import _ from 'lodash'
import fs from 'async-file'
import fetch from 'node-fetch'

const PROETHEUS_URL = 'http://localhost:9090'


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

  return metric.metric.__name__
}

const appdRequest = async (data) => {

}

const publishToAppd = async (data) => {
  console.log(`[starting] ${data.length} metrics to add / update...`)
  let i = 1

  for(let metric of data)
  {
    metric.metric.__name__ = addLabelsToMetricNames(metric)

    console.log(` [${i}/${data.length}] Updating ${metric.metric.__name__}`)

    i++
  }

  console.log(`[succeeded] ${data.length} metrics to added / updated`)
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
      callback(null, 'AppDynamics updates succeeded')
    }
    catch(e){
      callback(new Error(e))
    }

};

runLocal()
