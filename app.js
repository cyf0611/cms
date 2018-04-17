var http = require('http');
var querystring = require('querystring');
var mysql = require('mysql');
const fs = require('fs')
const path = require('path')
let express = require('express');
const bodyParser = require('body-parser')
const mime = require('mime');
var app = express();
app.use(express.static(path.join(__dirname, './static')));
app.use(express.static(path.join(__dirname, './plugins')));
// parse application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json 
app.use(bodyParser.json())


//连接数据库
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : '123456',
    database : 'nodetext'
});
connection.connect();

console.log('数据库连接成功');
// connection.query('SELECT * FROM formData', function (err,data){
//     console.log(data);
// })

// 提交的form数据
app.post('/*', function(req, res) {
    var obj= req.body;
    if (req.url === '/dopost') {  
        obj.submitTime = Date.parse(new Date());
        obj.status = 1;
        console.log(obj);
        connection.query('insert into formData set ?',obj , function(err,result){
            if (err) {
                console.log(err);
                return
            }
        })
        res.end('<!doctype html><html><head><meta charset="utf-8"></head><script>alert("提交成功! 我们会尽快安排发货~");location.href="http://127.0.0.1:5566/4defb209c35fe4dc.html"</script></html>')
    }else if (req.url==='/login') {
        if (obj.loginName === 'admin' && obj.passWord === '123456') {
            res.end('{"err": 0}')
        }else {
            res.end('{"err": 1}')
        }
    }
})

app.all('/*', function(req, res) {
    var fileUrl = req.url.split('?')[0]
    var filename = fileUrl.split('/')[fileUrl.split('/').length-1];
    var suffix = fileUrl.split('.')[fileUrl.split('.').length-1];

    if(req.url==='/login'){
        fs.readFile(path.join(__dirname,'./login.html'),(err,data)=>{
            if (err) {
              console.log(err);
            }
            //设置响应头
            res.setHeader("Content-Type","text/html;charset=utf-8");
            //返回数据
            res.end(data);
        })
    }else {
        fs.readFile(path.join(__dirname, fileUrl),(err, data)=>{
            if (err) console.log(err);
            res.setHeader("Content-Type",mime.lookup(fileUrl));
            res.end(data);
        })
    }






    // else if (fileUrl.indexOf('.css')>-1) {
    //     res.writeHead(200, {'Content-Type': 'text/css'});
    //     res.end(get_file_content(path.join(__dirname, fileUrl)));
    // }else if(fileUrl.indexOf('.json')>-1) {
    //     res.writeHead(200, {'Content-Type': 'text/json'});
    //     res.end(get_file_content(path.join(__dirname, fileUrl)));
    // }else if (fileUrl.indexOf('.js')>-1) {
    //     res.writeHead(200, {'Content-Type': 'text/javascript'});
    //     res.end(get_file_content(path.join(__dirname, fileUrl)));
    // }else if (['gif', 'jpeg', 'jpg', 'png', 'woff', 'woff2'].indexOf(suffix)>-1) {
    //     res.writeHead(200, {'Content-Type': 'image/'+suffix});
    //     res.end(get_file_content(path.join(__dirname, fileUrl)));
    // }else if (['/index','/components/table'].indexOf(fileUrl)>-1) {
    //     fs.readFile(path.join(__dirname,fileUrl+'.html'),(err,data)=>{
    //         if (err) {
    //           console.log(err);
    //         }
    //         //设置响应头
    //         res.setHeader("Content-Type","text/html;charset=utf-8");
    //         //返回数据
    //         res.end(data);
    //     })
    // }


   
})

function get_file_content(filepath){
    return fs.readFileSync(filepath);
}

app.listen(9999);//设置监听端口和监听地址

/* 
id
订单时间 submitTime
产品描述 describe
姓名      name
联系方式  tel
所在省份  province
所在城市  city
所在地区  area
详细地址  address
状态      status true
是否已读  isRead  false

*/