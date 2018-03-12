module.exports = [{
  type: 'select',
  name: 'dialect',
  message: 'What database driver are you going to use?',
  choices: [
    { title: 'PostgreSQL', value: 'postgres' },
    { title: 'SQLite', value: 'sqlite' },
    { title: 'MySQL', value: 'mysql' },
    { title: 'MSSQL', value: 'mssql' }
  ]
}, {
  type: 'text',
  name: 'host',
  message: 'What is your host?',
  initial: 'localhost'
}, {
  type: 'text',
  name: 'username',
  message: 'What is your username?'
}, {
  type: 'password',
  name: 'password',
  message: 'What is your password?'
}, {
  type: 'text',
  name: 'database',
  message: 'What is your database?'
}]
