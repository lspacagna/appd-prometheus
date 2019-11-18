import fetch from 'node-fetch'
import fs from 'fs'

const createSchema = async (settings) => {
  console.log(`[starting] creating ${settings.schemaName} schema...`)

  const schemaData = JSON.parse(fs.readFileSync('conf/schema.json', 'utf8'))

  const fullSchema = {
    "schema" : schemaData
  }

  const response = await fetch(`${settings.analyticsUrl}/events/schema/${settings.schemaName}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'X-Events-API-AccountName': settings.accountName,
      'X-Events-API-Key': settings.apiKey,
      'Content-type': 'application/vnd.appd.events+json;v=2'
    },
    body: JSON.stringify(fullSchema)
  });

  if(await response.status === 201){
    console.log(response.status)
    return true
  }
  else{
    console.log(response.status)
    throw new Error(`Unable to create schema | ${responseJSON.statusCode} - ${responseJSON.message}`);
  }

  console.log(await response.status)

}

const schemaExists = async (settings) => {
  console.log(`[starting] Checking if ${settings.schemaName} schema exists...`)
  const response = await fetch(`${settings.analyticsUrl}/events/schema/${settings.schemaName}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'X-Events-API-AccountName': settings.accountName,
      'X-Events-API-Key': settings.apiKey,
      'Content-type': 'application/vnd.appd.events+json;v=2'
    }
  });

  if(response.status !== 200 || response.status !== 404){
    const responseJSON = await response.json()
  }

  switch (response.status) {
    case 200:
      console.log(`[succeeded] ${settings.schemaName} found.`)
      return true;
      break;
    case 404:
      console.log(`[succeeded] ${settings.schemaName} not found.`)
      return false;
      break;
    default:
      throw new Error(`Unable to check if schema exists | ${responseJSON.statusCode} - ${responseJSON.message}`);
      break;
  }
}

const createSchemaIfRequired = async (settings) => {
  if(await schemaExists(settings)){
    // send event
  }
  else{
    await createSchema(settings)
  }

}

module.exports = {
  publish: async function (settings, data) {
    await createSchemaIfRequired(settings)
  }
};
