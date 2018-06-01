// 权限及登录是否过期验证
layui.define(function(exports) {
	var a = {
		authorify: function (status) {
			switch (status) {
				case 1: 
					console.log(222)
					layer.msg('您无权查看此内容！');
					break;
				case 2:
					layer.msg('请重新登录！');
					location.href = 'http://127.0.0.1:9999';
					break;
			}

		}
	}
    

    exports('authorify', a);
});


