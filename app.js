const http = require('http');
const querystring = require('querystring');
const mysql = require('mysql');
const fs = require('fs')
const path = require('path')
const express = require('express');
const bodyParser = require('body-parser')
const mime = require('mime');
const session = require('express-session')
const app = express();
const moment = require('moment');

app.use(express.static(path.join(__dirname, './static')));
app.use(express.static(path.join(__dirname, './plugins')));
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 1000*60*60*240}})) //maxAge为登录有效期
// parse application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json 
app.use(bodyParser.json())


//连接数据库
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'pro1',
    password : 'n4nrDPdprwiTAj2Y',
    database : 'pro1',
    multipleStatements: true
});
// var connection = mysql.createConnection({
//     host     : '127.0.0.1',
//     user     : 'root',
//     password : '123456',
//     database : 'nodetext',
//     multipleStatements: true
//});
connection.connect();

console.log('数据库连接成功');
// connection.query('SELECT * FROM formData', function (err,data){
//     console.log(data);
// })












var proAddress = ['http://www.yuyaninggujikang.com', 'http://www.zhendasm.com', 'http://www.yuyafulishu.com', 'http://www.yuyajianruishiyou.com', 'http://www.zhangdefusankeyou.com', 'http://www.zdfrt.com', 'http://www.guoshijiankang.com']
var fieldArr = ['formdata', 'pro2', 'pro3', 'pro4', 'pro5', 'pro6', 'pro7'];
var reqErrArr = {
        status: 0,// 1 无权限 2 未登录
        code: 0, 
        msg: 1,
        count: 0,
        data: []
    }
// 提交的form数据
app.post('/*', function(req, res) {
    var obj= req.body;
    if (req.url === '/dopost') {  // 官网提交的订单
        // 当产品ID不存在 直接返回结果 防止恶意提交
        if (!obj.pId || obj.pId < 1 || obj.pId > fieldArr.length) {
            res.end('<!doctype html><html><head><meta charset="utf-8"></head><script>alert("请不要恶意提交！")</script></html>')
            return;
        }

        obj.submitTime = moment().format('YYYY-MM-DD HH:mm:ss');
        obj.status = 1;
        obj.submitMethod = 0;
        obj.isRead = 0;
        var currField = fieldArr[obj.pId-1];
        var pid = obj.pId;
        delete obj.pId;
        connection.query('insert into '+currField+' set ?',obj , function(err,result){
            if (err) {
                console.log(err);
                return
            }
        })
        res.end('<!doctype html><html><head><meta charset="utf-8"></head><script>alert("提交成功! 我们会尽快安排发货~");location.href="'+proAddress[pid-1]+'"</script></html>')
    }else if (req.url==='/login') {
        // 进行账号秘密验证
        var sql = 'select * from login where userName = "' + obj.loginName + '" and passWord = "' + obj.passWord + '"';
        connection.query(sql, function(err, result) {
            if (err) res.end(err);
            if (result && result.length) {
                req.session.username = obj.loginName;
                res.end('{"err": 0}')
            }else {
                res.end('{"err": 1}')
            }
        })
    }else if (req.url==='/api/edit') {// 后台提交的编辑信息
        // 防止前台修改下列属性
        obj.status = 1;
        obj.submitMethod = 1;

        var id = obj.id;
        var currField = fieldArr[obj.pId-1];
        // 删除不需要添加的字段
        delete obj.id;
        delete obj.pId;
        connection.query('update '+currField+' set ? where id = '+id,obj , function(err,result){
            if (err) {
                console.log(err);
                return
            }
            var reqArr = {
                code: '1',
                msg: 'edit success'
            };
            res.end(JSON.stringify(reqArr));
        })

    }
})

app.all('/*', function(req, res) {
    var fileUrl = req.url.split('?')[0];
    var filename = fileUrl.split('/')[fileUrl.split('/').length-1];
    var suffix = fileUrl.split('.')[fileUrl.split('.').length-1];
    
    
    // 订单总数据接口
    if(fileUrl==='/api/tableData'){
        if (checkAuthority(req.session, res)) {
            return false
        }
        var parmas = req.url.split('?')[1];
        var obj = querystring.parse(parmas);
        var currField = fieldArr[obj.pId-1]; // 不同产品数据表的数组 
        var sql = 'SELECT COUNT(*) FROM '+currField+' where status = 1;SELECT * FROM '+currField+' where status = 1 order by id desc limit ' + (obj.page-1)*obj.limit + ','+obj.limit+';';
        connection.query(sql, function (err, results){
            if (err) throw err;
            res.setHeader("Content-Type",'text/json');
            var reqArr = {
                code: '',
                msg: '',
                count: results[0][0]['COUNT(*)'],
                data: results[1]
            };
            res.end(JSON.stringify(reqArr));
        })
    }else if(fileUrl==='/api/search') { // 按照条件搜索订单接口
        if (checkAuthority(req.session, res)) {
            return false
        }
        var parmas = req.url.split('?')[1];
        var obj = querystring.parse(parmas);
        var currField = fieldArr[obj.pId-1]; // 不同产品数据表的数组 
        var sql = "select COUNT(*) from "+currField+" where tel regexp "+obj.keyword+" and status = 1;select * from "+currField+" where tel regexp "+obj.keyword+" and status = 1 LIMIT "+ (obj.page-1)*obj.limit + ','+obj.limit;
        connection.query(sql, function (err, results){
                    if (err) throw err;
                    res.setHeader("Content-Type",'text/json');
                    var reqArr = {
                        code: '',
                        msg: '',
                        count: results[0][0]['COUNT(*)'],
                        data: results[1]
                    };
                    res.end(JSON.stringify(reqArr));
                })
    }else if(fileUrl==='/api/del') {// 删除某条数据
        var parmas = req.url.split('?')[1];
        var obj = querystring.parse(parmas);
        var currField = fieldArr[obj.pId-1];
        var sql = 'UPDATE '+currField+' set status = 0 where id in (' + obj.id + ')';

        connection.query(sql, function(err, result) {
            if (err) throw err;
            res.setHeader("Content-Type",'text/json');
            var reqArr = {
                code: '1',
                msg: 'del success'
            };
            res.end(JSON.stringify(reqArr));
        })
    }else if(fileUrl==='/api/isRead') {// 更新isRead
        var parmas = req.url.split('?')[1];
        var obj = querystring.parse(parmas);
        var currField = fieldArr[obj.pId-1];
        var sql = 'UPDATE '+currField+' set isRead = '+ obj.isRead +' where id = ' + obj.id;

        connection.query(sql, function(err, result) {
            if (err) throw err;
            res.setHeader("Content-Type",'text/json');
            var reqArr = {
                code: '1',
                msg: 'update success'
            };
            res.end(JSON.stringify(reqArr));
        })
    }else if(fileUrl==='/api/getAllRead') {// 获取所有未读订单
        var reqArr = [], sql  = '';
        for(var i=0;i<fieldArr.length;i++) { //循环遍历查询每个产品表
            sql += 'select COUNT(*) from '+ fieldArr[i] +' where isRead = 0 and status = 1;';
        }
        connection.query(sql, function(err, results) {
            if (err) throw err; 
            for(var i=0;i<results.length;i++) {
                reqArr.push(results[i][0]['COUNT(*)']);  
            }
            res.end(JSON.stringify(reqArr));
        })
        
    }else if(fileUrl==='/exit'){ //退出登录
        req.session.destroy();
    }else if(fileUrl==='/api/toIndex') {// 统计访问量
	    var parmas = req.url.split('?')[1];
	    var obj = querystring.parse(parmas);
	    var currDate = moment().format('YYYY-MM-DD HH:mm:ss');
	    obj.time = currDate;
	    var sql = 'insert into clickCount set date="'+currDate.slice(0, 10)+'", pro='+obj.source+' on duplicate key update toIndex=toIndex+1;insert into ip set ? ';

	    connection.query(sql, obj, function(err) {
		    if (err) throw err;
		    res.end('ok');
	    })
    }else if(fileUrl==='/api/toTaobao') {// 统计跳转到淘宝次数
		var parmas = req.url.split('?')[1];
		var obj = querystring.parse(parmas);
		var currDate = moment().format('YYYY-MM-DD');
		var sql = 'insert into clickCount set date="'+currDate+'", pro='+obj.pId+' on duplicate key update toTaobao=toTaobao+1';

		connection.query(sql, function(err, result) {
			if (err) throw err;
			res.end('ok');
		})
	}else if(fileUrl==='/api/getCount') {// 后台首页各种统计数据接口
	    var parmas = req.url.split('?')[1];
	    var obj = querystring.parse(parmas);
	    obj.time = moment().format('YYYY-MM-DD HH:mm:ss');
	    obj.user = req.session.username;
	    obj.source = 0;
	    connection.query('insert into ip set ? ', obj, function(err) {
		    if (err) throw err;
	    })
	    var sql  = 'select COUNT(*) from formdata where isRead = 0 and status = 1'
		    ,currDate = moment().format('YYYY-MM-DD')
		    ,sqlAll;
	    for(var i=1;i<fieldArr.length;i++) { //循环遍历查询每个产品表
		    sql += ' union all select COUNT(*) from '+ fieldArr[i] +' where isRead = 0 and status = 1';
	    }

	    sqlAll = 'SELECT SUM(toIndex) as indexCounts,SUM(toTaobao) as taobaoCounts FROM clickCount GROUP BY pro;SELECT * from clickCount where date = "'+currDate+'";'+sql;
	    connection.query(sqlAll, function(err, results) {
		    if (err) throw err;
		    res.end(JSON.stringify(results));
	    })
    }else if(checkfile(req.url)){
        fs.readFile(path.join(__dirname, fileUrl),(err, data)=>{
            if (err) throw err;
            res.setHeader("Content-Type",mime.getType(fileUrl));
            res.end(data);
        })
    }else {
        fs.readFile(path.join(__dirname, 'login.html'),(err, data)=>{
            if (err) throw err;
            res.setHeader("Content-Type",mime.getType('login.html'));
            res.end(data);
        })
    }




   
})

app.listen(9999);//设置监听端口和监听地址

// 检查是否为静态文件
function checkfile(str, arr) {
    var arr = arr || ['.img','.gif','.png','.jpg','.woff','.html','.css','.js','.json'];
    var res = false;
    arr.forEach(function (v, i){
        if (str.indexOf(v) > -1) {
            res = true;
        }      
    })
    return res;
}
// 权限验证
function checkAuthority(session, res) {
    if (!session.username) {
        // 值为undefined  此时登录失效或者未登录
        reqErrArr.status = 2;
        res.end(JSON.stringify(reqErrArr));
        return true;
    }else if(session.username!=='admin'){
        reqErrArr.status = 1;
        res.end(JSON.stringify(reqErrArr));
        return true;
    }else {
        return false;
    }
}
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
从哪提交的订单（官网、后台） where 0官网 1后台修改 2后台新增
*/