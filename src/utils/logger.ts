import chalk from 'chalk'

type LogType = 'info' | 'success' | 'warn' | 'error'

const ICONS: Record<LogType, string> = {
  info: chalk.blue('ℹ'),
  success: chalk.green('✓'),
  warn: chalk.yellow('⚠'),
  error: chalk.red('✖'),
}

const MAX_WIDTH = process.stdout.columns || 100

class Logger {

  _context: string;

  constructor(context: string) {
    this._context = context
  }

  log(type: LogType, message: string) {
    const icon = ICONS[type]
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const timeStr = chalk.gray(now)
    const context = chalk.gray(this._context);

    const line = `${icon} ${message}`
    const paddingLength = Math.max(1, MAX_WIDTH - line.length - timeStr.length - context.length) 
    const padding = ' '.repeat(paddingLength)

    console.log(` ${line}${padding}${context} ${timeStr}`)
  }

  info(msg: string) {
    this.log('info', msg)
  }

  success(msg: string) {
    this.log('success', msg)
  }

  warn(msg: string) {
    this.log('warn', msg)
  }

  error(msg: string) {
    this.log('error', msg)
  }
}

const logger = new Logger("@pgdev/next-prisma");

export { logger };