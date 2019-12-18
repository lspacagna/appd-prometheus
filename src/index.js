import _ from 'lodash'
import fetch from 'node-fetch'
import fs from 'fs'
import analytics from './analytics.js'

/**
 * Set to true to read from a local file instead of the Prometheus API
 * Default: false
 */
const READ_LOCAL = false


/**
 * URL of Prometheus deployment
 */
const PROETHEUS_URL = 'http://localhost:9090'

/**
 * URL to connect to the AppD controller events service
 * See https://docs.appdynamics.com/display/PRO45/Analytics+Events+API#AnalyticsEventsAPI-create_schemaCreateEventSchema
 * for the URL for your controller.
 */
const APPD_ANALYTICS_URL = "https://analytics.api.appdynamics.com"

/**
 * Account name to connect to the AppD controller
 * See Settings > License > Account for the value for your controller
 */
const APPD_GLOBAL_ACCOUNT_NAME = "lspac1_d3af08ad-64fa-4871-a017-988fc2b9d014"

/**
 * API Key to connect to AppD controller events service
 * See https://docs.appdynamics.com/display/PRO45/Managing+API+Keys
 */

const APPD_EVENTS_API_KEY = "c8e04b82-2075-4f5d-b476-82da9cc3d146"

/**
 * Reporting data to analytics requires a schema to be created.
 * Change this value if you are connecting more than one of these extensions to
 * more than one Prometheus deployment
 * Default: prometheus-metrics
 */
const SCHEMA_NAME = "prometheus_events"


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
    let data
    if(READ_LOCAL){
      console.log(`[starting] Reading locally...`)
      data = fs.readFileSync('data/sample.json', 'utf8')
      data = JSON.parse(data)
      console.log(`[succeeded] Local file read`)
    }
    else{
      console.log(`starting] Reading from Prometheus...`)
      data = await getDataFromPrometheus()
      console.log(`[succeeded] Prometheus data collected`)
    }

    await analytics.publish({
      analyticsUrl: APPD_ANALYTICS_URL,
      schemaName: SCHEMA_NAME,
      accountName: APPD_GLOBAL_ACCOUNT_NAME,
      apiKey: APPD_EVENTS_API_KEY
    },data)

    console.log(`[complete] Processing complete.`)

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
