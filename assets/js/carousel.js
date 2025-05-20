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
  const fullText = "MechE, BUET • IBA-MBA, DU • President's Scout • Ex-Vice-President, BUETJS • Blood Donor";
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



document.addEventListener("DOMContentLoaded", () => {
  const imageSlides = document.querySelectorAll(".image-slide");
  let currentImageIndex = 0;
  const slideInterval = 3000; // Slide change every 3 seconds

  function updateImageCarousel() {
      imageSlides.forEach((slide, index) => {
          slide.classList.remove("active");
          if (index === currentImageIndex) {
              slide.classList.add("active");
          }
      });
      currentImageIndex = (currentImageIndex + 1) % imageSlides.length;
  }

  // Initialize the first slide as active
  updateImageCarousel();

  // Auto-rotate slides every 3 seconds
  setInterval(updateImageCarousel, slideInterval);
});


const words = [
  { text: "A Dreamer", color: "#DA667B" },
  { text: "A Believer", color: "#00007B" },
  { text: "A Learner", color: "#169873" },
  { text: "An Adventurer", color: "#669bbc" },
  { text: "An Engineer", color: "#A167A5" }
];

let currentWordIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;
const typingSpeed = 100;
const deletingSpeed = 50;
const delayBetweenWords = 1500;

const textElement = document.getElementById("text");

function typeEffect() {
  const currentWordObj = words[currentWordIndex];
  const currentWord = currentWordObj.text;
  
  textElement.style.color = currentWordObj.color;  // Set font color

  if (isDeleting) {
      textElement.textContent = currentWord.substring(0, currentCharIndex--);
      if (currentCharIndex < 0) {
          isDeleting = false;
          currentWordIndex = (currentWordIndex + 1) % words.length;
      }
  } else {
      textElement.textContent = currentWord.substring(0, currentCharIndex++);
      if (currentCharIndex > currentWord.length) {
          isDeleting = true;
          setTimeout(typeEffect, delayBetweenWords);
          return;
      }
  }
  setTimeout(typeEffect, isDeleting ? deletingSpeed : typingSpeed);
}

typeEffect();

document.addEventListener("DOMContentLoaded", function() {
  document.querySelector('.quote-container').style.animation = 'fadeInSlideUp 2s ease-out forwards';
});
