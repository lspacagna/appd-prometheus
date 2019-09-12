import _ from 'lodash'
import fs from 'async-file'
import fetch from 'node-fetch'

const PROETHEUS_URL = 'http://localhost:9090'

const prometheusRequest = async (query) => {

  const response = await fetch(`${PROETHEUS_URL}/api/v1/query?query=${query}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain, */*'
    }
  })

  if(response.ok){
    return response.json()
  }
  else{
    throw new Error(response.statusText);
  }

}


const getDataFromPrometheus = async () => {
  const data = await prometheusRequest('prometheus_target_interval_length_seconds')

  console.log(data)

}

const main = async () => {
  try {
    const data = await getDataFromPrometheus()

  } catch (e) {
    console.error(e)
  }
}


// Called when running locally
const runLocal = async () => {
  try{
    console.log(`Starting Script...`)
    await main()
  }
  catch(e){
    console.log(e)
  }
}

// Only called when running in AWS Lambda
exports.handler = async (event, context, callback) => {
    try{
      console.log(`Starting Script...`)
      await main()
      callback(null, 'AppDynamics updates succeeded')
    }
    catch(e){
      callback(new Error(e))
    }

};

runLocal()
