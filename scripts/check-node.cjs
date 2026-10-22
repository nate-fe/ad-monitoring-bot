const major = Number(process.versions.node.split('.')[0] || 0)

// We standardize on Node 24 (.nvmrc) to match CI.
if (major < 24) {
  // eslint-disable-next-line no-console
  console.error(
    [
      `Node.js ${process.versions.node} is too old for this project.`,
      'Please use Node.js >= 24.',
      '',
      'If you use nvm-windows:',
      '  nvm install 24.22.1',
      '  nvm use 24.22.1',
      '',
    ].join('\n'),
  )
  process.exit(1)
}
