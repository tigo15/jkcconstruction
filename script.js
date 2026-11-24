

const filterButtons = document.querySelectorAll(".filter");
const galleryGrid = document.querySelector(".gallery-grid");

function filterGallery(category) {
    const galleryItems = document.querySelectorAll(".gallery-item");

    galleryItems.forEach(item => {
        const itemCategory = item.dataset.category;

        item.style.display =
            category === "all" || itemCategory === category
                ? ""
                : "none";
    });
}

filterButtons.forEach(button => {
    button.addEventListener("click", () => {

        filterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        filterGallery(button.dataset.filter);
    });
});

function loadSavedProjects() {

    if (!galleryGrid) return;

    let savedProjects = [];

    try {
        savedProjects = JSON.parse(
            localStorage.getItem("jkcGallery") || "[]"
        );
    } catch (error) {
        console.error("Unable to load gallery projects:", error);
        return;
    }

    savedProjects.forEach(project => {

        const article = document.createElement("article");
        article.className = "gallery-item";

        // Match saved categories to the HTML filters
        article.dataset.category =
            project.category.toLowerCase() === "renovation"
                ? "renovations"
                : project.category.toLowerCase();

        const image = document.createElement("img");
        image.src = project.image;
        image.alt = project.title;

        const info = document.createElement("div");
        info.className = "gallery-info";

        const title = document.createElement("strong");
        title.textContent = project.title;

        const category = document.createElement("span");
        category.textContent = project.category;

        info.appendChild(title);
        info.appendChild(category);

        article.appendChild(image);
        article.appendChild(info);

        galleryGrid.appendChild(article);
    });

    // Reapply the currently selected filter
    const activeFilter = document.querySelector(".filter.active");

    if (activeFilter) {
        filterGallery(activeFilter.dataset.filter);
    }
}

loadSavedProjects();

const lightbox = document.getElementById("lightbox");

if (lightbox) {

    const lightboxImage = lightbox.querySelector("img");
    const closeButton = lightbox.querySelector(".close");

    document.addEventListener("click", event => {

        const galleryItem = event.target.closest(".gallery-item");

        if (!galleryItem || !galleryItem.querySelector("img")) return;

        const image = galleryItem.querySelector("img");

        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt;

        lightbox.style.display = "flex";
    });

    function closeLightbox() {
        lightbox.style.display = "none";
        lightboxImage.src = "";
    }

    closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", event => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeLightbox();
        }
    });
}

const imageInput = document.getElementById("projectImages");
const imagePreview = document.getElementById("imagePreview");

let selectedImages = [];

if (imageInput && imagePreview) {

    imageInput.addEventListener("change", function () {

        imagePreview.replaceChildren();
        selectedImages = Array.from(this.files);

        selectedImages.forEach(file => {

            if (!file.type.startsWith("image/")) return;

            const image = document.createElement("img");

            image.src = URL.createObjectURL(file);
            image.alt = "Project photo preview";

            imagePreview.appendChild(image);
        });
    });
}

const galleryForm = document.getElementById("galleryForm");
const formMessage = document.getElementById("formMessage");

if (galleryForm) {

    galleryForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const title = document.getElementById("projectTitle").value.trim();
        const category = document.getElementById("category").value;
        const description = document.getElementById("description").value.trim();

        if (selectedImages.length === 0) {
            formMessage.textContent = "Please select at least one photo.";
            return;
        }

        const submitButton = galleryForm.querySelector(
            'button[type="submit"]'
        );

        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        try {

            const existingProjects = JSON.parse(
                localStorage.getItem("jkcGallery") || "[]"
            );

            const newProjects = await Promise.all(
                selectedImages.map(file => {

                    return new Promise((resolve, reject) => {

                        const reader = new FileReader();

                        reader.onload = () => {
                            resolve({
                                title: title,
                                category: category,
                                description: description,
                                image: reader.result,
                                addedAt: new Date().toISOString()
                            });
                        };

                        reader.onerror = () => reject(
                            new Error("Unable to read image.")
                        );

                        reader.readAsDataURL(file);
                    });
                })
            );

            localStorage.setItem(
                "jkcGallery",
                JSON.stringify(existingProjects.concat(newProjects))
            );

            formMessage.textContent =
                "Your project has been added successfully!";

            galleryForm.reset();
            imagePreview.replaceChildren();
            selectedImages = [];

        } catch (error) {

            console.error(error);

            formMessage.textContent =
                "Unable to save your project. Try using smaller images.";

        } finally {

            submitButton.disabled = false;
            submitButton.textContent = "Add to Gallery";
        }
    });
}
