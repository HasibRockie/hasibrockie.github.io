document.addEventListener("DOMContentLoaded", () => {
    const toBn = (n) => n.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
    const baseURL = "http://hasib009.pythonanywhere.com";
    let posts = [];
    let personals = [];
    let fictional = [];
    let religious = [];
    
    const getPosts = async () => {
      try {
        const response = await fetch("data/posts.json");
        const data = await response.json();
        posts = data;
        personals = data.filter((post) => post.category === "ব্যক্তিগত");
        religious = data.filter((post) => post.category === "ধর্মীয়");
        fictional = data.filter(
          (post) =>
            post.category === "ফিকশন" ||
            post.category === "ব্লগ" ||
            post.category === "অন্যান্য"
        );
        renderTabs();
        renderPosts(posts, "all-posts");
        renderPosts(personals, "personal-posts");
        renderPosts(fictional, "fiction-posts");
        renderPosts(religious, "religious-posts");
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
  
    const renderTabs = () => {
      const tabContainer = document.getElementById("tabs");
      tabContainer.innerHTML = `
        
      `;
  
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", (event) => {
          const target = event.target.getAttribute("data-target");
          document.querySelectorAll(".posts-container").forEach((container) => {
            container.style.display = "none";
          });
          document.getElementById(target).style.display = "block";
        });
      });
    };
  
    const renderPosts = (postList, containerId) => {
      const container = document.getElementById(containerId);
      container.innerHTML = postList
        .map(
          (post) => `
          <div class="post-card">
            <a href="/post.html?id=${post.id}" class="post-link">
              <div class="card">
                <img class="card-img" src="${baseURL + post.img1}" alt="${post.title}">
                
                <div class="card-body">
                  <h6 class="card-title">${post.title}</h6>
                  <small class="card-meta">
                    ${post.category} • পোস্ট নংঃ ${toBn(post.id.toString())} • ${toBn(post.date)}
                  </small> 
                  <hr>
                  <p class="card-text">${post.para1.substring(0, 210)}...</p> <hr>
                  <small class="details-btn">বিস্তারিত ▶</small>
                </div>
              </div>
            </a>
          </div>
        `
        )
        .join("");
    };
  
    // Create the loading spinner
    const showLoading = () => {
      const loadingElement = document.getElementById("loading");
      loadingElement.style.display = "block";
    };
  
    const hideLoading = () => {
      const loadingElement = document.getElementById("loading");
      loadingElement.style.display = "none";
    };
  
    // Initialize
    showLoading();
    getPosts().finally(hideLoading);
  });
  