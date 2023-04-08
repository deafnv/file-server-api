const test = (io, socket) => {
  socket.on('test', (message) => {
    console.log('Message: ' + message)
    socket.broadcast.emit('test', message)
  })
}

export default test