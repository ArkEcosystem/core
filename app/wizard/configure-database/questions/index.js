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
}]
