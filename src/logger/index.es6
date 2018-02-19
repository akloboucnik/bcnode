const moment = require('moment')
const winston = require('winston')
require('winston-daily-rotate-file')

const tsFormat = () => moment().utc().format('YYYYMMDDHHmmss')

const format = (options) => {
  const ts = options.timestamp()
  const level = options.level.toUpperCase()
  const msg = (undefined !== options.message ? options.message : '')
  const meta = (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta, null, 2) : '')

  return `${ts} ${level}\t${msg} ${meta}`
}

export const logger = (function init () {
  return new (winston.Logger)({
    transports: [
      // Console
      new (winston.transports.Console)({
        colorize: true,
        timestamp: tsFormat,
        formatter: format
      }),

      // File
      new (winston.transports.DailyRotateFile)({
        filename: 'logs/bcnode',
        timestamp: tsFormat,
        datePattern: '-yyyyMMddHHmm.log',
        json: false,
        formatter: format
      })

      // new (winston.transports.File)({
      //   name: 'info-file',
      //   filename: 'filelog-info.log',
      //   level: 'info'
      // }),
      //
      // new (winston.transports.File)({
      //   name: 'error-file',
      //   filename: 'filelog-error.log',
      //   level: 'error'
      // })
    ]
  })
})()