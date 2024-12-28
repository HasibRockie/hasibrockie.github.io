document.addEventListener("DOMContentLoaded", async () => {
    const baseURL = "http://hasib009.pythonanywhere.com";
    const toBn = (n) => n.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
  
    // Extract post ID from the URL
    const params = new URLSearchParams(window.location.search);
    const postId = params.get("id");
  
    const showLoading = () => {
      document.getElementById("loading").style.display = "block";
    };
  
    const hideLoading = () => {
      document.getElementById("loading").style.display = "none";
    };
  
    const fetchPost = async (id) => {
      try {
        const response = await fetch("../data/posts.json");
        const data = await response.json();
        return data.find((post) => post.id.toString() === id);
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };
  
    const renderPost = (post) => {
      const postDetails = document.getElementById("post-details");
      if (!post) {
        postDetails.innerHTML = `<h2>Post not found</h2>`;
        return;
      }
  
      postDetails.innerHTML = `
        <div class="details">
        <br>
        <h4>${post.title}</h4>
          <hr>
          <small class="post-meta">
             • পোস্ট নংঃ ${toBn(post.id.toString())} • ক্যাটেগরিঃ ${post.category} • তারিখঃ ${toBn(post.date)}  • লেখকঃ ${post.author} • 
          </small> <hr>
          <img src="${baseURL + post.img1}" alt="Hasib Rockie" class="banner"> <br> <br>
          <p class="post-content">${post.para1}</p>
          <p class="post-content">${post.para2 || ""}</p>
          <p class="post-content">${post.para3 || ""}</p> 
          <br>
          <div class="images">
            ${post.img2 ? `<div><img src="${baseURL + post.img2}" alt="${post.title}" class="post-image"> </div>` : ''}
            ${post.img3 ? `<div><img src="${baseURL + post.img3}" alt="${post.title}" class="post-image"> </div>` : ''}
            ${post.img4 ? `<div><img src="${baseURL + post.img4}" alt="${post.title}" class="post-image"> </div>` : ''}
            ${post.img5 ? `<div><img src="${baseURL + post.img5}" alt="${post.title}" class="post-image"> </div>` : ''}
            ${post.img6 ? `<div><img src="${baseURL + post.img6}" alt="${post.title}" class="post-image"> </div>` : ''}
            ${post.img7 ? `<div><img src="${baseURL + post.img7}" alt="${post.title}" class="post-image"> </div>` : ''}
            ${post.img8 ? `<div><img src="${baseURL + post.img8}" alt="${post.title}" class="post-image"> </div>` : ''}
            ${post.img9 ? `<div><img src="${baseURL + post.img9}" alt="${post.title}" class="post-image"> </div>` : ''}
            ${post.img10 ? `<div><img src="${baseURL + post.img10}" alt="${post.title}" class="post-image"> </div>` : ''}
            </div>
            <br>
          
            <p class="post-content">${post.para4 || ""}</p>
            <p class="post-content">${post.para5 || ""}</p>
            <p class="post-content">${post.para6 || ""}</p>
            <p class="post-content">${post.para7 || ""}</p>
            <p class="post-content">${post.para8 || ""}</p>
            <p class="post-content">${post.para9 || ""}</p>
            <p class="post-content">${post.para10 || ""}</p>
            <p class="post-content">${post.para11 || ""}</p>
            <p class="post-content">${post.para12 || ""}</p>
            <p class="post-content">${post.para13 || ""}</p>
            <p class="post-content">${post.para14 || ""}</p>
            <p class="post-content">${post.para15 || ""}</p>
            <p class="post-content">${post.para16 || ""}</p>
            <p class="post-content">${post.para17 || ""}</p>
            <p class="post-content">${post.para18 || ""}</p>
            <p class="post-content">${post.para19 || ""}</p>
            <p class="post-content">${post.para20 || ""}</p>
            <p class="post-content">${post.para21 || ""}</p>
            <p class="post-content">${post.para22 || ""}</p>
            <p class="post-content">${post.para23 || ""}</p>
            <p class="post-content">${post.para24 || ""}</p>
            <p class="post-content">${post.para25 || ""}</p>
            <p class="post-content">${post.para26 || ""}</p>
            <p class="post-content">${post.para27 || ""}</p>
            <p class="post-content">${post.para28 || ""}</p>
            <p class="post-content">${post.para29 || ""}</p>
            <p class="post-content">${post.para30 || ""}</p>
            <p class="post-content">${post.para31 || ""}</p>
            <p class="post-content">${post.para32 || ""}</p>
            <p class="post-content">${post.para33 || ""}</p>
            <p class="post-content">${post.para34 || ""}</p>
            <p class="post-content">${post.para35 || ""}</p>
            <p class="post-content">${post.para36 || ""}</p>
            <p class="post-content">${post.para37 || ""}</p>
            <p class="post-content">${post.para38 || ""}</p>
            <p class="post-content">${post.para39 || ""}</p>
            <p class="post-content">${post.para40 || ""}</p>
            <p class="post-content">${post.para41 || ""}</p>
            <p class="post-content">${post.para42 || ""}</p>
            <p class="post-content">${post.para43 || ""}</p>
            <p class="post-content">${post.para44 || ""}</p>
            <p class="post-content">${post.para45 || ""}</p>
            <p class="post-content">${post.para46 || ""}</p>
            <p class="post-content">${post.para47 || ""}</p>
            <p class="post-content">${post.para48 || ""}</p>
            <p class="post-content">${post.para49 || ""}</p>
            <p class="post-content">${post.para50 || ""}</p>
            <p class="post-content">${post.para51 || ""}</p>
            <p class="post-content">${post.para52 || ""}</p>
            <p class="post-content">${post.para53 || ""}</p>
            <p class="post-content">${post.para54 || ""}</p>
            <p class="post-content">${post.para55 || ""}</p>
            <p class="post-content">${post.para56 || ""}</p>
            <p class="post-content">${post.para57 || ""}</p>
            <p class="post-content">${post.para58 || ""}</p>
            <p class="post-content">${post.para59 || ""}</p>
            <p class="post-content">${post.para60 || ""}</p>
            <p class="post-content">${post.para61 || ""}</p>
            <p class="post-content">${post.para62 || ""}</p>
            <p class="post-content">${post.para63 || ""}</p>
            <p class="post-content">${post.para64 || ""}</p>
            <p class="post-content">${post.para65 || ""}</p>
            <p class="post-content">${post.para66 || ""}</p>
            <p class="post-content">${post.para67 || ""}</p>
            <p class="post-content">${post.para68 || ""}</p>
            <p class="post-content">${post.para69 || ""}</p>
            <p class="post-content">${post.para70 || ""}</p>
            <p class="post-content">${post.para71 || ""}</p>
            <p class="post-content">${post.para72 || ""}</p>
            <p class="post-content">${post.para73 || ""}</p>
            <p class="post-content">${post.para74 || ""}</p>
            <p class="post-content">${post.para75 || ""}</p>
            <p class="post-content">${post.para76 || ""}</p>
            <p class="post-content">${post.para77 || ""}</p>
            <p class="post-content">${post.para78 || ""}</p>
            <p class="post-content">${post.para79 || ""}</p>
            <p class="post-content">${post.para80 || ""}</p>
            <p class="post-content">${post.para81 || ""}</p>
            <p class="post-content">${post.para82 || ""}</p>
            <p class="post-content">${post.para83 || ""}</p>
            <p class="post-content">${post.para84 || ""}</p>
            <p class="post-content">${post.para85 || ""}</p>
            <p class="post-content">${post.para86 || ""}</p>
            <p class="post-content">${post.para87 || ""}</p>
            <p class="post-content">${post.para88 || ""}</p>
            <p class="post-content">${post.para89 || ""}</p>
            <p class="post-content">${post.para90 || ""}</p>
            <p class="post-content">${post.para91 || ""}</p>
            <p class="post-content">${post.para92 || ""}</p>
            <p class="post-content">${post.para93 || ""}</p>
            <p class="post-content">${post.para94 || ""}</p>
            <p class="post-content">${post.para95 || ""}</p>
            <p class="post-content">${post.para96 || ""}</p>
            <p class="post-content">${post.para97 || ""}</p>
            <p class="post-content">${post.para98 || ""}</p>
            <p class="post-content">${post.para99 || ""}</p>
            <p class="post-content">${post.para100 || ""}</p>
            <hr>
        </div>
      `;
    };
  
    showLoading();
    const post = await fetchPost(postId);
    hideLoading();
    renderPost(post);
  });
  