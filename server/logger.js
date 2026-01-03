import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, 'logs', 'app.log');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const formatDate = () => {
    return new Date().toISOString();
};

const writeToFile = (level, message, data = null) => {
    const logEntry = {
        timestamp: formatDate(),
        level,
        message,
        data
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
        fs.appendFileSync(LOG_FILE, logLine);
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
};

export const logger = {
    info: (message, data = null) => {
        console.log(`[INFO] ${formatDate()} - ${message}`, data || '');
        writeToFile('INFO', message, data);
    },

    error: (message, data = null) => {
        console.error(`[ERROR] ${formatDate()} - ${message}`, data || '');
        writeToFile('ERROR', message, data);
    },

    warn: (message, data = null) => {
        console.warn(`[WARN] ${formatDate()} - ${message}`, data || '');
        writeToFile('WARN', message, data);
    },

    debug: (message, data = null) => {
        console.log(`[DEBUG] ${formatDate()} - ${message}`, data || '');
        writeToFile('DEBUG', message, data);
    },

    request: (req, res, next) => {
        const start = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - start;
            const logData = {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip || req.connection.remoteAddress
            };

            if (res.statusCode >= 400) {
                logger.error(`HTTP ${req.method} ${req.originalUrl}`, logData);
            } else {
                logger.info(`HTTP ${req.method} ${req.originalUrl}`, logData);
            }
        });

        next();
    }
};

export default logger;
