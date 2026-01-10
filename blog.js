// 1. 글 목록을 담을 빈 리스트(배열) 만들기
// 만약 저장된 글이 있다면 그걸 가져오고, 없으면 빈 리스트로 시작
let posts = JSON.parse(localStorage.getItem('posts')) || [];

// 현재 수정 중인 글의 번호를 기억하는 변수 (-1이면 새 글 작성 모드)
let editingIdx = -1;

// 2. 화면에 글을 보여주는 함수 (그리기 담당)
function renderPosts() {
    const postList = document.getElementById('post-list');
    postList.innerHTML = ''; // 일단 화면을 싹 비우고

    // 리스트에 있는 글들을 하나씩 꺼내서 화면에 추가
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const dateString = post.date ? post.date : "";

        let mediaTag = "";
        if (post.media) {
            if (post.media.includes("data:video")){
                mediaTag = `<video src="${post.media}" controls></video>`;
            } else {
                mediaTag = `<img src="${post.media}">`;
            }
        }
        postList.innerHTML += `
            <div class="post">
                <div class="post-header">
                    <h3>${post.title}</h3>
                    <span class="date">${dateString}</span>
                </div>
                ${mediaTag}
                <p>${post.content}</p>
                <div class="post-footer">
                    <button class="edit-btn" onclick="editPost(${i})">수정</button>
                    <button class="delete-btn" onclick="deletePost(${i})">삭제</button>
                </div>
            </div>
        `;
// ... 뒷부분 생략 ...
    }
}

// 3. 글을 추가하는 함수 (등록 담당)
function addPost() {
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const fileInput = document.getElementById('media');

    const title = titleInput.value;
    const content = contentInput.value;
    const file = fileInput.files[0];

    // 제목이나 내용이 비어있으면 경고창 띄우기
    if (!title || !content) {
        alert("제목과 내용을 모두 입력해주세요!");
        return;
    }
    
    const now = new Date();
    const reader = new FileReader();

    // 파일을 다 읽었거나, 파일이 없을 때 실행할 로직
    const saveProcess = (mediaData) => {
        // 수정 모드일 때 기존 이미지를 유지할지 결정
        let finalMedia = mediaData;
        
        // 파일은 안 바꿨는데 수정 모드라면? -> 기존 이미지 그대로 사용
        if (editingIdx !== -1 && !file) {
            finalMedia = posts[editingIdx].media;
        }

        const newPost = {
            title: title,
            content: content,
            date: now.toLocaleString(),
            media: finalMedia // 이미지 데이터 저장
        };

        if (editingIdx === -1) {
            // 새 글 작성 모드 -> 맨 앞에 추가
            posts.unshift(newPost);
        } else {
            // 수정 모드 -> 해당 자리를 교체
            posts[editingIdx] = newPost;
            
            // 수정 끝났으니 모드 초기화
            editingIdx = -1;
            document.getElementById('add-btn').innerText = "기록 남기기";
        }

        // 저장 및 화면 갱신
        localStorage.setItem('posts', JSON.stringify(posts));
        renderPosts();

        // 입력창 비우기
        titleInput.value = '';
        contentInput.value = '';
        fileInput.value = ''; // 파일 선택도 초기화
    };

    // 파일이 있으면 읽고, 없으면 그냥 저장하러 감
    if (file) {
        reader.readAsDataURL(file); // 파일을 문자열로 변환 시작!
        reader.onload = function(e) {
            saveProcess(e.target.result); // 변환된 결과물을 가지고 저장
        };
    } else {
        saveProcess(""); // 파일 없이 저장
    }
}

function deletePost(index){
    if (!confirm("정말 삭제하시겠습니까?")){
        return;
    }
    posts.splice(index, 1);
    localStorage.setItem('posts', JSON.stringify(posts));
    renderPosts();
}
function editPost(index){
    const post = posts[index];
    // 입력창에 기존 내용 채우기 
    document.getElementById('title').value = post.title;
    document.getElementById('content').value = post.content;

    // "수정 중"임을 알리기 위해 전역 변수 업데이트
    editingIdx = index;
    
    // 버튼 글씨 바꾸기
    document.getElementById('add-btn').innerText = "수정 완료";
    
    // 입력하기 편하게 스크롤 위로 올리기
    window.scrollTo(0, 0);
}


// 페이지가 처음 열릴 때, 저장된 글이 있으면 화면에 그려주기
renderPosts();