'use strict'

const project = process.env.GCP_PROJECT
const location = `us-east1` // ! hardcode Google Task location, this is NOT the function location
const function_url = `https://us-central1-cloud-tasks-sample-263214.cloudfunctions.net/preOrder` // ! change this for your task executer function
const default_queue = `sample-queue` // ! change this for your queue name
const SERVICE_ACCOUNT_EMAIL = `exec-public-endpoint-fn@cloud-tasks-sample-263214.iam.gserviceaccount.com` // ! change this for your service account email
const default_task = `pre_order`

export const createTasks = async function (
    payload: any, 
    date: string, 
    task_name: string = default_task, 
    queue_name: string = default_queue, 
    default_function: string = function_url
  ) {
  const { CloudTasksClient } = require('@google-cloud/tasks')
  const client = new CloudTasksClient()
  const parent = client.queuePath(project, location, queue_name)

  console.log(payload)

  const convertedPayload = JSON.stringify(payload)
  const body = Buffer.from(convertedPayload).toString('base64')

  const taskName = `${task_name}_${payload.id}` // ! must be unique

  const task: any = {
    httpRequest: {
      httpMethod: 'POST',
      url: default_function,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      oidcToken: {
        serviceAccountEmail: SERVICE_ACCOUNT_EMAIL
      }
    },
    name: `projects/${project}/locations/${location}/queues/${queue_name}/tasks/${taskName}`
  }

  // ! dates set in the pass will be set as current date
  const convertedDate = new Date(date)
  const currentDate = new Date()

  if (convertedDate < currentDate)
    throw new Error(`Scheduled data in the past.`)

  const date_in_release_in_seconds = convertedDate.getTime() / 1000 // ! maybe the date should be passe directly in seconds instead of calculating it here

  task.scheduleTime = {
    seconds: date_in_release_in_seconds,
  };

  const [ response ] = await client.createTask({ parent, task })

  console.log(`Created task ${response.name}`)

  return Promise.resolve({ task: response.name })
}