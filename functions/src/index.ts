import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
admin.initializeApp()

import { createTasks } from './tasks/create'

export const createPreOrder = functions.firestore.document(`order/{doc}`).onCreate(async (snap) => {
  const data = snap.data()
  // @ts-ignore ! #YOLO
  const date = data.date // "2020-01-25T15:00:00.000Z" ! hardcoded format for the sake of the sample
  // @ts-ignore
  const id = snap.id
  const { task } = await createTasks({
    ...data,
    id,
  }, date)

  console.log(task)

  return Promise.resolve({ ok: true })
})

export const preOrder = functions.https.onRequest((request, response) => {
 console.log(request.body) 
 try {
    // ! Send OK to Cloud Task queue to delete task.
    response.status(200).send('Task Completed');
  } catch (error) {
    // ! Any status code other than 2xx or 503 will trigger the task to retry.
    response.status(error.code).send(error.message);
  }
})

