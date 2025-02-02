'use strict'

const path = require('path')
const fs = require('fs')
const semver = require('semver')
const exec = require('./helpers/exec')
const title = require('./helpers/title')

const pkg = require('../package.json')
const increment = getIncrement()
const version = semver.inc(pkg.version, increment, 'pre')

title(`Bumping version to v${version}.`)

const currentBranch = exec.pipe(`git branch --show-current`)

if (currentBranch === 'master') {
  exec(`git checkout -b v${semver.major(pkg.version)}.x`)
  exec(`git push -u origin HEAD`)

  const nextMajor = semver.major(pkg.version) + 1

  bump(`v${nextMajor}.0.0-pre`)
}

bump(version)

function bump (newVersion) {
  pkg.version = newVersion

  exec(`git checkout -b v${newVersion}`)
  write('package.json', JSON.stringify(pkg, null, 2) + '\n')
  write('packages/dd-trace/lib/version.js', `module.exports = '${newVersion}'\n`)
  add('package.json')
  add('packages/dd-trace/lib/version.js')
  exec(`git commit -m v"${newVersion}"`)
  exec(`git push -u origin HEAD`)
}

function getIncrement () {
  const increments = ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease']
  const index = increments.indexOf(process.argv[2])

  if (index === -1) {
    throw new Error(`increment must be one of ${increments.join(', ')}`)
  }

  return increments[index]
}

function filename (relativePath) {
  return path.normalize(path.join(__dirname, '..', relativePath))
}

function write (file, data) {
  fs.writeFileSync(filename(file), data)
}

function add (file) {
  exec(`git add ${filename(file)}`)
}
