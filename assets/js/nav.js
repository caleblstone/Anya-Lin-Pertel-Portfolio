
document.addEventListener("DOMContentLoaded", () => {
    // Function to show the targeted work_box
    const showWorkBox = (targetId) => {
        // Hide all work_box elements
        const allWorkBoxes = document.querySelectorAll(".work_box");
        allWorkBoxes.forEach(box => {
            box.style.display = "none";
        });
    
        // Show the targeted work_box
        const targetBox = document.getElementById(`_${targetId}`);
        if (targetBox) {
            targetBox.style.display = "grid"; // Adjust to your desired display style
        }
    
        // Handle visibility of pet_portrait_blurb
        const petPortraitBlurb = document.getElementById("pet_portrait_blurb");
        if (targetId === "pet_portraits" && petPortraitBlurb) {
            petPortraitBlurb.style.display = "grid"; // Show pet_portrait_blurb
        } else if (petPortraitBlurb) {
            petPortraitBlurb.style.display = "none"; // Hide pet_portrait_blurb in all other cases
        }
    
        // Highlight the currently selected <li>
        highlightSelected(targetId);
    };

    // Function to highlight the currently selected <li>
    const highlightSelected = (targetId) => {
        const allListItems = document.querySelectorAll("#work-list li");
        allListItems.forEach(li => {
            li.style.position = "relative"; // Ensure the circle is positioned relative to the <li>
            li.querySelector(".indicator")?.remove(); // Remove any existing indicator

            // Check if this <li> corresponds to the selected targetId
            const link = li.querySelector("a");
            if (link && link.getAttribute("href").replace("#", "") === targetId) {
                // Add a green circle indicator
                const indicator = document.createElement("div");
                indicator.className = "indicator";
                indicator.style.width = "8px";
                indicator.style.height = "8px";
                indicator.style.backgroundColor = "green";
                indicator.style.borderRadius = "50%";
                indicator.style.position = "absolute";
                indicator.style.left = "-16px"; // 8px to the left of the <li>
                indicator.style.top = "50%";
                indicator.style.transform = "translateY(-50%)";
                li.appendChild(indicator);
            }
        });
    };

    // Function to show only the landing_page
    const showLandingPageCategory = () => {
        // Hide all work_box elements
        const allWorkBoxes = document.querySelectorAll(".work_box");
        allWorkBoxes.forEach(box => {
            if (box.id === "_landing_page") {
                box.style.display = "grid"; // Show the landing_page category
    
                // Hide all description_text elements inside the landing_page category
                const descriptionTexts = box.querySelectorAll(".description_text");
                descriptionTexts.forEach(desc => {
                    desc.style.display = "none";
                });
            } else {
                box.style.display = "none"; // Hide all other categories
            }
        });
    };

    // Function to handle the "pet_portraits" nav click
    const handlePetPortraitsClick = () => {
        // Check if the current path is not the root directory
        if (window.location.pathname !== "/") {
            // Redirect to the root directory with the target hash
            window.location.href = `/#pet_portraits`;
            return; // Stop further execution to allow the page to reload
        }
    
        // Show the "pet_portraits" category
        showWorkBox("pet_portraits");
    
        // Update the browser's history state
        history.pushState({ targetId: "pet_portraits" }, "", "/#pet_portraits");
    };

    // Add event listener for the "pet_portraits" nav
    const petPortraitsNav = document.getElementById("pet_portraits");
    if (petPortraitsNav) {
        petPortraitsNav.addEventListener("click", (event) => {
            event.preventDefault(); // Prevent default anchor behavior
            handlePetPortraitsClick();
        });
    }

    // Get all list items in the "Work" nav
    const workListItems = document.querySelectorAll("#work-list li a");

    // Sort and group categories
    const sortCategories = () => {
        const categories = Array.from(workListItems).map(item => {
            const text = item.textContent.trim();
            const year = parseInt(text, 10);
            return { text, year: isNaN(year) ? null : year };
        });
    
        // Sort categories: years descending, then phrases alphabetically
        categories.sort((a, b) => {
            if (a.year && b.year) return b.year - a.year; // Descending years
            if (a.year) return -1; // Years come before phrases
            if (b.year) return 1;
            return a.text.localeCompare(b.text); // Alphabetical for phrases
        });
    
        // Update the DOM with sorted categories
        const workList = document.querySelector("#work-list");
        workList.innerHTML = ""; // Clear existing list
        categories.forEach(category => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = `#${category.text}`; // Keep underscores in the href
            a.textContent = category.text.replace(/_/g, " "); // Replace underscores with spaces for display
            li.appendChild(a);
    
            // Hide specific categories
            const lowerCaseText = category.text.toLowerCase();
            const categoriesToRemove = [
                "about",
                "cv",
                "landing_page",
                "pet_portrait_text",
                "pet_portraits"
                
            ];
    
            if (categoriesToRemove.includes(lowerCaseText)) {
                console.log(`Removing category: ${lowerCaseText}`); // Log the removal
                li.style.display = "none";
            }
    
            workList.appendChild(li);
        });
    };

    // Add click event listeners to each list item
    const addClickListeners = () => {
        const updatedWorkListItems = document.querySelectorAll("#work-list li a");
        updatedWorkListItems.forEach(item => {
            item.addEventListener("click", (event) => {
                event.preventDefault(); // Prevent default anchor behavior

                // Get the target ID from the href attribute
                const targetId = item.getAttribute("href").replace("#", "");

                // Check if the current path is not the root directory
                if (window.location.pathname !== "/") {
                    // Redirect to the root directory with the target hash
                    window.location.href = `/#${targetId}`;
                    return; // Stop further execution to allow the page to reload
                }

                // Update the browser's history state with the root URL
                history.pushState({ targetId }, "", `/#${targetId}`);

                // Show the targeted work_box
                showWorkBox(targetId);
            });
        });
    };

    // Collapse the #work-list when clicking outside
    document.addEventListener("click", (event) => {
        const workList = document.getElementById("work-list");
        const workNav = document.getElementById("work-nav");

        // Check if the click is outside the #work-list and #work-nav
        if (workList.style.display === "block" && !workList.contains(event.target) && event.target !== workNav) {
            workList.style.display = "none";
        }
    });

    // Handle the browser's back and forward buttons
    window.addEventListener("popstate", (event) => {
        const targetId = event.state ? event.state.targetId : null;

        if (targetId) {
            showWorkBox(targetId);
        } else {
            // If no state, hide all work_box elements
            const allWorkBoxes = document.querySelectorAll(".work_box");
            allWorkBoxes.forEach(box => {
                box.style.display = "none";
            });
        }
    });

    // Handle page load with a hash in the URL
    const initialHash = window.location.hash.replace("#", "");
    if (initialHash) {
        showWorkBox(initialHash);
    } else if (window.location.pathname === "/") {
        // If no hash and on the root directory, show only the landing_page category
        showLandingPageCategory();
    }

    // Initialize sorting and event listeners
    sortCategories();
    addClickListeners();
});