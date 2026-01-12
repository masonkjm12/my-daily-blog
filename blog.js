let posts = JSON.parse(localStorage.getItem('posts')) || [];
let editingIdx = -1; 
let currentFilter = 'All';
let viewMode = 'list'; // 기본은 목록형 ('list' 또는 'album')

// 1. 게시물 목록 그리기 (요약본만 표시)
function renderPosts() {
    const postList = document.getElementById('post-list');
    postList.innerHTML = ''; 
    
    // 뷰 모드에 따라 클래스 변경 (CSS가 모양을 바꿔줌)
    postList.className = (viewMode === 'list') ? 'list-mode' : 'album-mode';

    renderCategoryBar(); // 메뉴바 갱신

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const category = post.category || '일반';

        // 필터링
        if (currentFilter !== 'All' && category !== currentFilter) continue;

        const dateString = post.date ? post.date.split('. ')[1] + '.' + post.date.split('. ')[2] : ""; // 날짜 짧게
        const colorStyle = stringToColor(category);
        
        // 썸네일 처리 (이미지 없으면 회색 박스 대신 안 보이게 처리 등)
        let thumbTag = "";
        if (post.media && !post.media.includes("data:video")) {
            thumbTag = `<img src="${post.media}" class="post-thumb">`;
        } else if (post.media && post.media.includes("data:video")) {
             thumbTag = `<video src="${post.media}" class="post-thumb"></video>`;
        } else {
            // 이미지가 없을 때 앨범형이면 기본 이미지
            thumbTag = `<div class="post-thumb" style="background-color:#eee; display:flex; align-items:center; justify-content:center; color:#999; font-size:12px;">No Image</div>`;
        }

        // ⭐ 클릭하면 viewPost(i) 실행!
        postList.innerHTML += `
            <div class="post-item" onclick="viewPost(${i})">
                ${thumbTag}
                <div class="post-info">
                    <div>
                        <span class="badge" style="background-color: ${colorStyle}">${category}</span>
                        <h3>${post.title}</h3>
                    </div>
                    <span class="date">${post.date}</span>
                </div>
            </div>
        `;
    }
}

// 2. 상세 페이지 보여주기 (클릭 시 실행)
function viewPost(index) {
    const post = posts[index];
    
    // 메인 숨기고 상세 보이기
    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('detail-view').classList.remove('hidden');
    document.getElementById('category-bar').classList.add('hidden'); // 상단 메뉴도 잠시 숨김 (집중 위해)

    const detailContent = document.getElementById('detail-content');
    
    let mediaTag = "";
    if (post.media) {
        if (post.media.includes("data:video")){
            mediaTag = `<video src="${post.media}" controls></video>`;
        } else {
            mediaTag = `<img src="${post.media}">`;
        }
    }

    // 상세 내용 채워넣기
    detailContent.innerHTML = `
        <div class="detail-header">
            <span class="badge" style="background-color: ${stringToColor(post.category || '일반')}">${post.category || '일반'}</span>
            <h2>${post.title}</h2>
            <div class="detail-meta">${post.date}</div>
        </div>
        ${mediaTag}
        <p>${post.content}</p>
        
        <div class="detail-actions">
            <button class="edit-btn" onclick="editPost(${index})">수정</button>
            <button class="delete-btn" onclick="deletePost(${index})">삭제</button>
        </div>
    `;
    
    window.scrollTo(0, 0);
}

// 3. 메인으로 돌아가기 (뒤로가기)
function showMain() {
    document.getElementById('main-view').classList.remove('hidden');
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('category-bar').classList.remove('hidden');
    renderPosts();
}

// 4. 보기 방식 변경 (목록형 <-> 앨범형)
function setViewMode(mode) {
    viewMode = mode;
    renderPosts();
}

// --- 아래는 기존 로직 (저장, 수정, 삭제, 카테고리 등) ---

function renderCategoryBar() {
    const navBar = document.getElementById('category-bar');
    const dataList = document.getElementById('category-list');
    const allCategories = posts.map(p => p.category || '일반');
    const uniqueCategories = ['All', ...new Set(allCategories)];

    navBar.innerHTML = ''; dataList.innerHTML = '';

    uniqueCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.innerText = (cat === 'All') ? "전체보기" : cat;
        if (cat === currentFilter) btn.classList.add('active');
        btn.onclick = () => { currentFilter = cat; renderPosts(); showMain(); }; // 필터 누르면 메인으로
        navBar.appendChild(btn);

        if(cat !== 'All') {
            const option = document.createElement('option');
            option.value = cat;
            dataList.appendChild(option);
        }
    });
}

function addPost() {
    const categoryInput = document.getElementById('category-input');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const fileInput = document.getElementById('media');

    let category = categoryInput.value.trim();
    if (category === "") category = "일반";

    const title = titleInput.value;
    const content = contentInput.value;
    const file = fileInput.files[0];

    if (!title || !content) { alert("내용을 입력해주세요!"); return; }
    
    const now = new Date();
    const reader = new FileReader();

    const saveProcess = (mediaData) => {
        let finalMedia = mediaData;
        if (editingIdx !== -1 && !file) finalMedia = posts[editingIdx].media;

        const newPost = {
            category: category, title: title, content: content,
            date: now.toLocaleString(), media: finalMedia
        };

        if (editingIdx === -1) posts.unshift(newPost);
        else { posts[editingIdx] = newPost; editingIdx = -1; document.getElementById('add-btn').innerText = "기록 남기기"; }

        localStorage.setItem('posts', JSON.stringify(posts));
        showMain(); // 저장 후 메인으로 이동
        
        titleInput.value = ''; contentInput.value = ''; fileInput.value = ''; categoryInput.value = '';
    };

    if (file) { reader.readAsDataURL(file); reader.onload = (e) => saveProcess(e.target.result); } 
    else { saveProcess(""); }
}

function deletePost(index){
    if (!confirm("삭제하시겠습니까?")) return;
    posts.splice(index, 1);
    localStorage.setItem('posts', JSON.stringify(posts));
    showMain(); // 삭제 후 메인으로
}

function editPost(index){
    const post = posts[index];
    showMain(); // 수정하려면 입력창이 있는 메인으로 가야 함
    
    document.getElementById('title').value = post.title;
    document.getElementById('content').value = post.content;
    document.getElementById('category-input').value = post.category || '';
    
    editingIdx = index;
    document.getElementById('add-btn').innerText = "수정 완료";
    window.scrollTo(0, 0);
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 85%)`; 
}

renderPosts();