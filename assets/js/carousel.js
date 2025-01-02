document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".carousel-slide");
    let currentIndex = 0;
  
    const updateSlides = () => {
      slides.forEach((slide, index) => {
        slide.classList.remove("active", "prev");
        if (index === currentIndex) {
          slide.classList.add("active");
        } else if (index === (currentIndex - 1 + slides.length) % slides.length) {
          slide.classList.add("prev");
        }
      });
    };
  
    const nextSlide = () => {
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlides();
    };
  
    // Start carousel
    updateSlides();
    setInterval(nextSlide, 5000); // Change slide every 5 seconds
  });
  


  document.addEventListener("DOMContentLoaded", () => {
  const shortIntroElement = document.querySelector(".short-intro");
  const fullText = "Mechanical, BUET • IBA-MBA, DU • President's Scout • Ex-Vice-President, BUETJS • Blood Donor";
  let charIndex = 0;
  const typingSpeed = 50; // Typing speed in ms per character

  // Function to type the text character by character
  function typeText() {
    if (charIndex < fullText.length) {
      shortIntroElement.textContent += fullText.charAt(charIndex);
      charIndex++;
      setTimeout(typeText, typingSpeed);
    } else {
      shortIntroElement.style.borderRight = "none"; // Remove cursor effect after typing
    }
  }

  // Start the typing animation
  typeText();
});
