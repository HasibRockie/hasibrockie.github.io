// js/blog.js
document.addEventListener("DOMContentLoaded", function () {
    fetch('data/posts.json')
        .then(response => response.json())
        .then(posts => {
            const blogList = document.getElementById('blog-list');
            posts.forEach(post => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <h2><a href="${post.url}">${post.title}</a></h2>
                    <p>${post.date}</p>
                    <p>${post.summary}</p>
                `;
                blogList.appendChild(listItem);
            });
        })
        .catch(error => console.error('Error fetching posts:', error));
});
