const fs = require('fs')
const { promisify } = require('util')
const { groupWith } = require('ramda')
const chalk = require('chalk')


const readdir = promisify(fs.readdir)
const log = {
  error: (...arg) => console.error(chalk.red(...arg)),
  info: (...arg) => console.info(chalk.green(...arg)),
}


const fileNameCheck = files => {
  let error = false

  files = files
    .map(filename => ({
      filename,
      serial: filename.match(/^\d+\./g),
    }))

  files.forEach(file => {
    if (!file.serial) {
      log.error(`[Check Error] Cannot find serial number from filename\n => ${file.filename}\n`)
      error = true
    }
  })

  files = files
    .filter(file => file.serial)
    .map(({ filename, serial }) => ({ filename, serial: serial[0] }))

  const serialEqual = (a, b) => a.serial === b.serial
  const filesGroupWithSerial = groupWith(serialEqual, files)

  filesGroupWithSerial.forEach(group => {
    if (group.length === 1) return

    const filenames = group
      .map(file => ` => ${file.filename}`)
      .join('\n')

    log.error(`[Check Error] Duplicate serial number:\n${filenames}\n`)
    error = true
  })

  return !error
}

const formatCheck = async () => {
  const files = await readdir('./articles')

  if (fileNameCheck(files)) log.info('[Check Passed]')
}

formatCheck()
