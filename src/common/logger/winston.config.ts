import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as fs from 'fs';

// Ensure the logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

console.log("file location not found ", fs.existsSync(logDir))

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context }) => {
    return `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
  })
);

// Create Winston Logger Configuration
export const winstonLoggerOptions: winston.LoggerOptions = {
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    new winston.transports.DailyRotateFile({
      dirname: logDir, // Ensure directory is set
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info', // Ensure logs are captured
      handleExceptions: true, // Handle uncaught exceptions
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: `${logDir}/exceptions.log` }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: `${logDir}/rejections.log` }),
  ],
};
