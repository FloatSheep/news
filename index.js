let index = 0;
let origin = 'zhihu';
// 方向
let direction = 'after';
let show_only = false;
get_day_news(0, origin);
show_only = true;
setTimeout(() => {
    Notiflix.Notify.warning('正在请求最新数据...');
    first_xhr();
}, 1000);

function handleError (e) { 
    // 如果返回的是知乎的错误，则提示知乎源的错误
    if (origin === 'zhihu') {
        console.log(e);
        if (e.data.news === 'zhihu') {
            if (direction === 'before') {
                if (index < 0) {
                    direction = 'after';
                    index = 0;
                }
                get_day_news(index = (index - 1), origin);
                console.log(`当天新闻不存在，尝试获取前一天 \uD83D\uDE1E ${e.data.title}`);
            } else {
                console.log(`当天新闻不存在，尝试获取后一天 \uD83D\uDE1E ${e.data.title}`);
                get_day_news(index = (index + 1), origin);
            }
        } else {
            NProgress.done();
            console.log(`An error occurred \uD83D\uDE1E ${e['data']['title']}`);
        }
    }
    else {
        NProgress.done();
        console.log(`An error occurred \uD83D\uDE1E ${e['data']['title']}`);
    }
}

function handleError_zhihu (e) { 
    NProgress.done();
    if (direction === 'before') {
        get_day_news(index, origin);
        console.log(`当天新闻不存在，尝试获取前一天 \uD83D\uDE1E ${e}`);
    } else {
        console.log(`当天新闻不存在，尝试获取后一天 \uD83D\uDE1E ${e}`);
        get_day_news(index, origin);
    }
}

function handleError_163 (e) { 
    NProgress.done();
    console.log(`网易新闻源：An error occurred \uD83D\uDE1E ${e}`);
}


function first_xhr () {
    const now_time = new Date().getHours() +"hrs" + new Date().getMinutes() + "min";
    try{
        const xhr_zhihu = new XMLHttpRequest();
        xhr_zhihu.open('GET', '/api?origin=zhihu&_vercel_no_cache=1' + '&cache=' + now_time);
        xhr_zhihu.onload = zhihu_first_load;
        xhr_zhihu.onerror = handleError_zhihu;
        xhr_zhihu.send();
    }catch(e){
        handleError_zhihu(e);
    }
    try{
        const xhr_163 = new XMLHttpRequest();
        xhr_163.open('GET', '/api?origin=163&_vercel_no_cache=1'+ '&cache=' + now_time);
        xhr_163.onload = _163_init_load;
        xhr_163.onerror = handleError_163;
        xhr_163.send();
    }catch(e){
        handleError_163(e);
    }
}

function str_to_date(str) {
    const dateRegex = /(\d{4})年?(\d{1,2})月(\d{1,2})日?/;
    const matches = str.match(dateRegex);
    if (matches) {
      return `${matches[1]}-${matches[2]}-${matches[3]}`;
    }else{
       // 如果没有年份，则默认为今年
        const year = new Date().getFullYear();
        const matches = str.match(/(\d{1,2})月(\d{1,2})日?/);
        if (matches) {
            return `${year}-${matches[1]}-${matches[2]}`;
        }
    }
    return str;
  }

// 本函数由 chatGPT 修复


function zhihu_first_load () {
    try{
        const days = JSON.parse(this.responseText);
    if (days['suc']) {
        days_load.call(this, show_only = false);
        Notiflix.Notify.success('当前知乎数据源为最新数据');
        const cache = str_to_date(days['data']['date']);
        localStorage.setItem('zhihu_cache', cache);
    } else{
        handleError_zhihu(days['data']['title']);
    }
    }catch(error){
        handleError_zhihu(error);
    }
}

function _163_init_load () {
    try{
    const days = JSON.parse(this.responseText);
    if (days['suc']) {
        Notiflix.Notify.success('当前网易新闻数据源为最新数据');
        const cache = str_to_date(days['data']['date']);
        localStorage.setItem('163_cache', cache);
    } else{
        handleError_163(days['data']['title']);
    }
    }catch(error){
        handleError_163(error);
    }
}



function weiyu_load () {
    NProgress.done();
    const weiyu = JSON.parse(this.responseText);
    document.getElementById('weiyu').innerHTML = weiyu['hitokoto'];
}

function get_now_str () {
    if (origin === 'zhihu') {
        return '知乎';
    }
    if (origin === '163') {
        return '网易新闻';
    }
}


function days_load (show_only) { 
    try{
    NProgress.done();
    const days = JSON.parse(this.responseText);
    if (days['suc']) {   
        data = days['data'];
        // 加载标题
        if (data['date'].includes('月')){
            document.getElementById('date').innerHTML = data['date'];
        } else {
            document.getElementById('date').innerHTML = '暂无数据';
        }
        // 显示通知
        try {
            const date_now = str_to_date(data['date']);
            const now_str = get_now_str();
            Notiflix.Notify.success(`${now_str}源: ${date_now} 更新成功`, {
                showOnlyTheLastOne: show_only,    });
        } catch (error) {
            const now_str = get_now_str();
            Notiflix.Notify.success(`${now_str}源: 更新成功`, {
                showOnlyTheLastOne: show_only,    });   
        }
        // 加载weiyu
        if (data['weiyu'].includes('【微语】')){
            document.getElementById('weiyu').innerHTML = data['weiyu'].replace("【微语】", '');
        } else {
            // 获取一言
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://v1.hitokoto.cn');
            xhr.onload = weiyu_load;
            xhr.onerror = handleError;
            xhr.send();
        }
        
        // 清空原有的新闻
        document.getElementById('news').innerHTML = '';
        for (let i = 0; i < data['news'].length; i++) {
            // 将其变成 li 并插入ol
            const li = document.createElement('li');
            li.innerHTML = data['news'][i];
            // 插入新的 li
            document.getElementById('news').appendChild(li);
        }
        // // 滚动条滚到顶部
        // window.scrollTo(0, 0);
    } else {
        handleError(days);
    }}
    catch(error){
        handleError(error);
    }
}


function get_day_news(index, origin){
      try{
        NProgress.start();
        const xhr = new XMLHttpRequest();
        if (origin === 'zhihu') {
            cache =  localStorage.getItem('zhihu_cache');
        }else{
            cache =  localStorage.getItem('163_cache');
        }
        xhr.open('GET', `/api?index=${index}&cache=${cache}&origin=${origin}`);
        xhr.onload = days_load;
        xhr.onerror = handleError;
        xhr.send();
      } catch(error){
            handleError(error);
        }
}

function after (){
    if (index ===0 ){
        Notiflix.Notify.success('当前已经是最新的了');
    }else{
        index -= 1;
        direction = 'before';
        get_day_news(index, origin);
    }
}

function before (){
    if (index === 99 ){
        Notiflix.Notify.warning('之后没有了');
    }else{
        index += 1;
        direction = 'after';
        get_day_news(index, origin);
    }
}

document.onkeydown = change_page;
function change_page() {
    if (event.keyCode == 37 || event.keyCode == 33) {
        before();
    } else if (event.keyCode == 39 || event.keyCode == 34) {
        after();
    };
    // 回车键
    if (event.keyCode == 13) {
        if (origin === 'zhihu') {
            origin = '163';
        } else{
            origin = 'zhihu';
        }
        get_day_news(index, origin);
    }
}

function change_origin  (){
    if (origin === 'zhihu'){
        origin = '163';
        setTimeout(() => {
            Notiflix.Notify.success('成功切换源为网易新闻');
        }, 1000);
    }
    else{
        origin = 'zhihu';
        setTimeout(() => {
            Notiflix.Notify.success('成功切换源为知乎');
        }, 1000);
    }
    get_day_news(index, origin);
}