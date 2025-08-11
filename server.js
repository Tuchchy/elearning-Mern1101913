const net = require('net')

const server = net.createServer(socket =>{
    console.log('client connect: ' + socket.remoteAddress + ' ' + socket.remotePort);
    socket.on('data', buf =>{
        console.log('recv:', buf.toString());
        socket.write('ACK: ' + buf.toString());
    })
})

server.listen(3000, '0.0.0.0', ()=>{
    console.log(`listen at 0.0.0.0`);
})