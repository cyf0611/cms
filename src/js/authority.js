// 权限及登录是否过期验证
layui.define(function(exports) {
	function authority(status) {
		switch (status) {
			case 1: 
				layer.msg('您无权查看此内容！');
				break;
			case 2:
				layer.msg('登录失效，请重新登录！');
				setTimeout(function() {
					location.href = location.origin;
				}, 2000);
				break;
		}

	}
    

    exports('authority', authority);
});


