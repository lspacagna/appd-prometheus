import _ from 'lodash'
import fetch from 'node-fetch'
import fs from 'fs'
import analytics from './analytics.js'

/**
 * Set to true to read from a local file instead of the Prometheus API
 * Default: false
 */
let READ_LOCAL

/**
 * URL of Prometheus deployment
 */
let PROMETHEUS_URL

/**
 * URL to connect to the AppD controller events service
 * See https://docs.appdynamics.com/display/PRO45/Analytics+Events+API#AnalyticsEventsAPI-create_schemaCreateEventSchema
 * for the URL for your controller.
 */
let APPD_ANALYTICS_URL

/**
 * Account name to connect to the AppD controller
 * See Settings > License > Account for the value for your controller
 */
let APPD_GLOBAL_ACCOUNT_NAME

/**
 * API Key to connect to AppD controller events service
 * See https://docs.appdynamics.com/display/PRO45/Managing+API+Keys
 */

let APPD_EVENTS_API_KEY

/**
 * Reporting data to analytics requires a schema to be created.
 * Change this value if you are connecting more than one of these extensions to
 * more than one Prometheus deployment
 * Default: prometheus-metrics
 */
let SCHEMA_NAME

let LOCAL_FILE


const prometheusRequest = async (query) => {
  console.log(`[starting] '${query}' query...`)

  const response = await fetch(`${PROMETHEUS_URL}/api/v1/query?query=${query}`, {
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

  // Get queries from config file
  const queries = fs.readFileSync('conf/queries.txt', 'utf8').toString().trim().split("\n")

  for (const query of queries){
    // Make Prometheus query
    data.push(await prometheusRequest(query))
  }

  data = _.flatten(data)

  return data
}

const processConfig = () => {
  const config = JSON.parse(fs.readFileSync('conf/config.json', 'utf8'))

  READ_LOCAL = (typeof x === 'undefined') ? config.read_local : false;
  PROMETHEUS_URL = config.prometheus_url
  APPD_ANALYTICS_URL = config.appd_analytics_url
  APPD_GLOBAL_ACCOUNT_NAME = config.appd_global_account_name
  APPD_EVENTS_API_KEY = config.appd_events_api_key
  SCHEMA_NAME = (typeof x === 'undefined') ? config.schema_name : "prometheus_events";
  LOCAL_FILE = (typeof x === 'undefined') ? config.local_file : "data/sample.json";
}

const main = async () => {
  try {
    processConfig()

    let data
    if(READ_LOCAL){
      console.log(`[starting] Reading locally...`)
      data = fs.readFileSync(LOCAL_FILE, 'utf8')
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
