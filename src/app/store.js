import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'

const seed = new URL('./data/seed.json', import.meta.url)

export async function openMenuStore(directory) {
  await mkdir(directory, { recursive: true })
  const dataFile = join(directory, 'dishes.json')
  const temporaryFile = join(directory, 'dishes.tmp')

  try {
    await copyFile(seed, dataFile, constants.COPYFILE_EXCL)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }

  let dishes = JSON.parse(await readFile(dataFile, 'utf8'))
  if (!Array.isArray(dishes)) throw new Error('The menu data must be a JSON array.')
  let pending = Promise.resolve()

  return {
    list() {
      return dishes
    },

    change(transform) {
      // Each change reads the result of the previous successful write.
      const operation = pending.then(async () => {
        const next = transform(dishes)
        await writeFile(temporaryFile, JSON.stringify(next, null, 2) + '\n')
        await rename(temporaryFile, dataFile)
        dishes = next
      })
      // A failed request must not stop the next request from running.
      pending = operation.catch(() => {})
      return operation
    }
  }
}
