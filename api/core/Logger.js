import {createLogger, transports, format} from 'winston'
import { logDirectory } from '../config.js'
import DailyRotateFile from 'winston-daily-rotate-file'
import fs from 'fs'
import path from 'path'

let dir = logDirectory ?? "logs"

if(!dir) dir = path.resolve('logs')

if(fs.existsSync(dir))
    fs.mkdirSync(dir)

const logLevel = process.env.LOG_LEVEL || "info"

const dailyRotateFile = new DailyRotateFile({
    level: logLevel,
    filename: `${dir}/%DATE%-result.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchie: true,
    handleExeptions: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: format.combine(
        format.errors({stack: true}),
        format.timestamp(),
        format.json()
    )
})

export const logger = createLogger({
    transports: [
        new transports.Console({
            level: logLevel,
            format: format.combine(
                format.errors({stack: true}),
                format.colorize(),
                format.prettyPrint()
            )
        }),
        dailyRotateFile
    ],
    exceptionHandlers: [dailyRotateFile],
    exitOnError: false
})
