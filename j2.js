import http from 'http'
import path from 'path'
import fs from 'fs'
const server = http.createServer((req,res)=>{
    if(req.url==='/hi'){
        const filePath = path.join(__dirname, 'a.html');
        data = fs.readFileSync(filePath);
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end(data);
    }
})
server.listen(3003,()=>{
    console.log('Server is listening on port 3003');
});