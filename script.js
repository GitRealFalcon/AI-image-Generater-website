const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const generateBtn = document.querySelector(".generate-btn");
const modelSelect = document.getElementById("select-model");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGalery = document.querySelector(".galery-grid")

// const API_KEY = ""; 


const examplePrompt = [
    "A futuristic cityscape at sunset, with towering glass buildings and flying cars zooming through the sky.",
    "A magical forest, with glowing plants and mystical creatures, bathed in the light of a full moon.",
    "An astronaut floating in space, gazing at Earth with a distant galaxy in the background.",
    "A steampunk-inspired airship soaring above a sprawling Victorian city, with clouds swirling around it.",
    "A cozy, rustic cabin nestled in a snowy mountain range, with smoke rising from the chimney.",
    "A beautiful underwater coral reef teeming with colorful fish and sea creatures, lit by soft sunlight filtering through the water.",
    "A dragon perched atop a cliff, overlooking a vast medieval kingdom as a storm brews on the horizon.",
    "A magical marketplace in an ancient desert city, with vibrant fabrics and exotic goods lining the streets.",
    "A peaceful Japanese garden with a koi pond, stone lanterns, and cherry blossom trees in full bloom.",
    "A sleek, futuristic robot walking through a forest of giant, bioluminescent trees."
];


// set theme based on saved perference or system default
(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})()

// swich theme dark and light theme
const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light")
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

//calculate width and height based on chosen ratio
const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);

    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);
    //Ensure dimensions are multiples of 16 (AI Model requirements)
    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

    return { width: calculatedWidth, height: calculatedHeight };
};


// Replace loading spinner with the actual image
const  updateImageCard = (imgIndex, imgUrl) =>{
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if(!imgCard) return;

    imgCard.classList.remove("loading");
    imgCard.innerHTML = ` <img src="${imgUrl}" class="result-img">
                        <div class="img-overlay">
                            <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </div>`;
}

//Send Request to hugging face API to create images
const generateImages = async (selectModel, imageCount, aspectRatio, promptText) => {
    // const MODEL_URL = `https://api-inference.huggingface.co/models/${selectModel}`;
    // https://api-inference.huggingface.co/models/
    // https://router.huggingface.co/replicate/v1/models/
    const { width, height } = getImageDimensions(aspectRatio);
    generateBtn.setAttribute("disabled", "true");

    
    //Create an array of image generation promises
    const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
        //send request to AI model API
        try {
            const response = await fetch(MODEL_URL, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: promptText,
                    parameters: { width, height },
                    // options: { wait_for_model: true, user_cache: false },
                }),
            });

            if (!response.ok) throw new error((await response.json())?.error);

            // Convert respnse to an image URL and update the image card
            const result = await response.blob();
            updateImageCard(i, URL.createObjectURL(result));
        } catch (error) {
            console.log(error);
            const imgCard = document.getElementById(`img-card-${i}`);
            imgCard.classList.replace("loading","error");
            imgCard.querySelector(".status-text").textContent = "Generation failed check console for more details.";
        }
    })

    await Promise.allSettled(imagePromises);
    generateBtn.removeAttribute("disabled")
};

//Create placeholder cards with loading spinning
const createImageCards = (selectModel, imageCount, aspectRatio, promptText) => {
    gridGalery.innerHTML = "";
    for (let i = 0; i < imageCount; i++) {

        gridGalery.innerHTML += `<div class="img-card loading" id="img-card-${i}" style="aspect-ratio:${aspectRatio}">
                        <div class="status-container">
                            <div class="spinner"></div>
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <p class="status-text">Generating...</p>
                        </div>
                    </div>`
    }

    generateImages(selectModel, imageCount, aspectRatio, promptText);
}
// Handle form Submission
const handleFormSubmit = (e) => {
    e.preventDefault();

    // Get from value
    const selectModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    const promptText = promptInput.value.trim();

    createImageCards(selectModel, imageCount, aspectRatio, promptText);

}

// fill prompt input with random example
promptBtn.addEventListener("click", () => {
    const prompt = examplePrompt[Math.floor(Math.random() * examplePrompt.length)];
    promptInput.value = prompt;
    promptInput.focus();
})

promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);