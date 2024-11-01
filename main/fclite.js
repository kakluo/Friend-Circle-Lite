function initialize_fc_lite() {
    const root = document.getElementById('friend-circle-lite-root');
    if (!root) return;

    // 使用 DocumentFragment 优化 DOM 操作
    const fragment = document.createDocumentFragment();
    
    // 使用模板字符串预先创建结构
    const template = `
        <div id="random-article"></div>
        <div class="articles-container" id="articles-container"></div>
        <button id="load-more-btn">再来亿点</button>
        <div id="stats-container"></div>
    `;
    root.innerHTML = template;

    // 缓存 DOM 查询结果
    const elements = {
        randomArticle: document.getElementById('random-article'),
        container: document.getElementById('articles-container'),
        loadMoreBtn: document.getElementById('load-more-btn'),
        statsContainer: document.getElementById('stats-container')
    };

    // 使用防抖优化加载更多
    const debounce = (fn, delay) => {
        let timer = null;
        return function (...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    };

    // 优化文章处理函数
    function processArticles(data) {
        if (!data || !data.article_data) return;
        
        allArticles = data.article_data;
        updateStats(data.statistical_data);
        updateRandomArticle();

        const fragment = document.createDocumentFragment();
        const articles = allArticles.slice(start, start + UserConfig.page_turning_number);
        
        // 使用 map 优化循环
        const cards = articles.map(createArticleCard);
        cards.forEach(card => fragment.appendChild(card));
        
        elements.container.appendChild(fragment);
        start += UserConfig.page_turning_number;
        
        elements.loadMoreBtn.style.display = start >= allArticles.length ? 'none' : 'block';
    }

    // 分离文章卡片创建逻辑
    function createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'card';
        
        // 使用模板字符串优化 HTML 创建
        card.innerHTML = `
            <div class="card-title">${article.title}</div>
            <div class="card-author">
                <img class="no-lightbox" src="${article.avatar || UserConfig.error_img}" onerror="this.src='${UserConfig.error_img}'">
                ${article.author}
            </div>
            <div class="card-date">🗓️${article.created.substring(0, 10)}</div>
            <img class="card-bg no-lightbox" src="${article.avatar || UserConfig.error_img}" onerror="this.src='${UserConfig.error_img}'">
        `;

        // 事件委托优化
        card.querySelector('.card-title').onclick = () => window.open(article.link, '_blank');
        card.querySelector('.card-author').onclick = () => showAuthorArticles(article.author, article.avatar, article.link);
        
        return card;
    }

    // 优化统计信息更新
    function updateStats(stats) {
        if (!stats) return;
        elements.statsContainer.innerHTML = `
            <div>Powered by: <a href="https://github.com/willow-god/Friend-Circle-Lite" target="_blank" rel="nofollow">FriendCircleLite</a></div>
            <div>Designed By: <a href="https://www.liushen.fun/" target="_blank" rel="nofollow">LiuShen</a></div>
            <div>订阅:${stats.friends_num} 活跃:${stats.active_num} 总文章数:${stats.article_num}</div>
            <div>更新时间:${stats.last_updated_time}</div>
        `;
    }

    let start = 0; // 记录加载起始位置
    let allArticles = []; // 存储所有文章

    function loadMoreArticles() {
        const cacheKey = 'friend-circle-lite-cache';
        const cacheTimeKey = 'friend-circle-lite-cache-time';
        const cacheTime = localStorage.getItem(cacheTimeKey);
        const now = new Date().getTime();

        if (cacheTime && (now - cacheTime < 10 * 60 * 1000)) { // 缓存时间小于10分钟
            const cachedData = JSON.parse(localStorage.getItem(cacheKey));
            if (cachedData) {
                processArticles(cachedData);
                return;
            }
        }

        fetch(`${UserConfig.private_api_url}all.json`)
            .then(response => response.json())
            .then(data => {
                localStorage.setItem(cacheKey, JSON.stringify(data));
                localStorage.setItem(cacheTimeKey, now.toString());
                processArticles(data);
            })
            .finally(() => {
                elements.loadMoreBtn.innerText = '再来亿点'; // 恢复按钮文本
            });
    }

    function updateRandomArticle() {
        const randomArticle = allArticles[Math.floor(Math.random() * allArticles.length)];
        elements.randomArticle.innerHTML = `
            <div class="random-container">
                <div class="random-container-title">
                    <span>🎣 钓鱼</span>
                    <span class="random-refresh" onclick="updateRandomArticle()">
                        <svg t="1721999754997" class="icon" viewBox="0 0 1024 1024" version="1.1" p-id="1207" width="16" height="16"><path d="M772.6 320H672c-35.4 0-64 28.6-64 64s28.6 64 64 64h256c35.4 0 64-28.6 64-64V128c0-35.4-28.6-64-64-64s-64 28.6-64 64v102.4l-35.2-35.2c-175-175-458.6-175-633.6 0s-175 458.6 0 633.6 458.6 175 633.6 0c25-25 25-65.6 0-90.6s-65.6-25-90.6 0c-125 125-327.6 125-452.6 0s-125-327.6 0-452.6 327.6-125 452.6 0l34.4 34.4z" p-id="1208"></path></svg>
                    </span>
                </div>
                <div class="random-title">${randomArticle.title}</div>
                <div class="random-author">作者: ${randomArticle.author}</div>
            </div>
            <button class="random-link-button" onclick="window.open('${randomArticle.link}', '_blank')">过去转转</button>
        `;
    }

    function showAuthorArticles(author, avatar, link) {
        // 如果不存在，则创建模态框结构
        if (!document.getElementById('modal')) {
            const modal = document.createElement('div');
            modal.id = 'modal';
            modal.className = 'modal';
            modal.innerHTML = `
            <div class="modal-content">
                <img id="modal-author-avatar" src="" alt="">
                <a id="modal-author-name-link"></a>
                <div id="modal-articles-container"></div>
                <img class="modal-background" src="" alt="">
            </div>
            `;
            document.body.appendChild(modal);
        }

        const modal = document.getElementById('modal');
        const modalArticlesContainer = document.getElementById('modal-articles-container');
        const modalAuthorAvatar = document.getElementById('modal-author-avatar');
        const modalAuthorNameLink = document.getElementById('modal-author-name-link');
        const modalBackground = document.querySelector('.modal-background');

        modalArticlesContainer.innerHTML = ''; // 清空之前的内容
        modalAuthorAvatar.src = avatar  || UserConfig.error_img; // 使用默认头像
        modalAuthorAvatar.onerror = () => modalAuthorAvatar.src = UserConfig.error_img; // 头像加载失败时使用默认头像
        modalAuthorNameLink.innerText = author;
        modalAuthorNameLink.href = new URL(link).origin;

        // 设置背景图
        modalBackground.src = avatar || UserConfig.error_img;
        modalBackground.onerror = () => modalBackground.src = UserConfig.error_img; // 头像加载失败时使用默认头像

        const authorArticles = allArticles.filter(article => article.author === author);
        // 仅仅取前五个，防止文章过多导致模态框过长，如果不够五个则全部取出
        authorArticles.slice(0, 5).forEach(article => {
            const articleDiv = document.createElement('div');
            articleDiv.className = 'modal-article';

            const title = document.createElement('a');
            title.className = 'modal-article-title';
            title.innerText = article.title;
            title.href = article.link;
            title.target = '_blank';
            articleDiv.appendChild(title);

            const date = document.createElement('div');
            date.className = 'modal-article-date';
            date.innerText = "📅" + article.created.substring(0, 10);
            articleDiv.appendChild(date);

            modalArticlesContainer.appendChild(articleDiv);
        });

        // 设置类名以触发显示动画
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('modal-open');
        }, 10); // 确保显示动画触发
    }

    // 隐藏模态框的函数
    function hideModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('modal-open');
        modal.addEventListener('transitionend', () => {
            modal.style.display = 'none';
            document.body.removeChild(modal);
        }, { once: true });
    }

    // 初始加载
    loadMoreArticles();

    // 加载更多按钮点击事件
    elements.loadMoreBtn.addEventListener('click', debounce(loadMoreArticles, 300));

    // 添加刷新按钮点击事件
    window.updateRandomArticle = updateRandomArticle;

    // 点击遮罩层关闭模态框
    window.onclick = function(event) {
        const modal = document.getElementById('modal');
        if (event.target === modal) {
            hideModal();
        }
    };
}

// 优化初始化逻辑
let isInitialized = false;  // 添加初始化标志

const initHandler = () => {
    const root = document.getElementById('friend-circle-lite-root');
    
    // 如果页面中没有对应元素，清除初始化状态
    if (!root) {
        isInitialized = false;
        return;
    }
    
    // 防止重复初始化
    if (!isInitialized) {
        initialize_fc_lite();
        isInitialized = true;
    }
};

// 使用 document.readyState 确保在任何情况下都能正确初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHandler);
} else {
    initHandler();
}

// pjax 完成后重新检查初始化
document.addEventListener('pjax:complete', initHandler);
