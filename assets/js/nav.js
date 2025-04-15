
// document.addEventListener("DOMContentLoaded", () => {
//     // Function to show the targeted work_box
//     const showWorkBox = (targetId) => {
//         // Hide all work_box elements
//         const allWorkBoxes = document.querySelectorAll(".work_box");
//         allWorkBoxes.forEach(box => {
//             box.style.display = "none";
//         });

//         // Show the targeted work_box
//         const targetBox = document.getElementById(`_${targetId}`);
//         if (targetBox) {
//             targetBox.style.display = "grid"; // Adjust to your desired display style
//         }

//         // Highlight the currently selected <li>
//         highlightSelected(targetId);
//     };

//     // Function to highlight the currently selected <li>
//     const highlightSelected = (targetId) => {
//         const allListItems = document.querySelectorAll("#work-list li");
//         allListItems.forEach(li => {
//             li.style.position = "relative"; // Ensure the circle is positioned relative to the <li>
//             li.querySelector(".indicator")?.remove(); // Remove any existing indicator

//             // Check if this <li> corresponds to the selected targetId
//             const link = li.querySelector("a");
//             if (link && link.getAttribute("href").replace("#", "") === targetId) {
//                 // Add a green circle indicator
//                 const indicator = document.createElement("div");
//                 indicator.className = "indicator";
//                 indicator.style.width = "8px";
//                 indicator.style.height = "8px";
//                 indicator.style.backgroundColor = "green";
//                 indicator.style.borderRadius = "50%";
//                 indicator.style.position = "absolute";
//                 indicator.style.left = "-16px"; // 8px to the left of the <li>
//                 indicator.style.top = "50%";
//                 indicator.style.transform = "translateY(-50%)";
//                 li.appendChild(indicator);
//             }
//         });
//     };

//     // Function to show the highest numbered year
//     const showHighestYear = () => {
//         const allWorkBoxes = document.querySelectorAll(".work_box");
//         let highestYear = null;

//         allWorkBoxes.forEach(box => {
//             const year = parseInt(box.id.replace("_", ""), 10); // Extract the year from the ID
//             if (!highestYear || year > highestYear) {
//                 highestYear = year;
//             }
//         });

//         if (highestYear) {
//             showWorkBox(highestYear.toString());
//         }
//     };

//     // Get all list items in the "Work" nav
//     const workListItems = document.querySelectorAll("#work-list li a");

//     // Sort and group categories
//     const sortCategories = () => {
//         const categories = Array.from(workListItems).map(item => {
//             const text = item.textContent.trim();
//             const year = parseInt(text, 10);
//             return { text, year: isNaN(year) ? null : year };
//         });

//         // Sort categories: years descending, then phrases alphabetically
//         categories.sort((a, b) => {
//             if (a.year && b.year) return b.year - a.year; // Descending years
//             if (a.year) return -1; // Years come before phrases
//             if (b.year) return 1;
//             return a.text.localeCompare(b.text); // Alphabetical for phrases
//         });

//         // Update the DOM with sorted categories
//         const workList = document.querySelector("#work-list");
//         workList.innerHTML = ""; // Clear existing list
//         categories.forEach(category => {
//             const li = document.createElement("li");
//             const a = document.createElement("a");
//             a.href = `#${category.text}`; // Keep underscores in the href
//             a.textContent = category.text.replace(/_/g, " "); // Replace underscores with spaces for display
//             li.appendChild(a);

//             // Hide the "about" category
//             if (category.text.toLowerCase() === "about") {
//                 li.style.display = "none";
//             }

//             workList.appendChild(li);
//         });
//     };

//     // Add click event listeners to each list item
//     const addClickListeners = () => {
//         const updatedWorkListItems = document.querySelectorAll("#work-list li a");
//         updatedWorkListItems.forEach(item => {
//             item.addEventListener("click", (event) => {
//                 event.preventDefault(); // Prevent default anchor behavior

//                 // Get the target ID from the href attribute
//                 const targetId = item.getAttribute("href").replace("#", "");

//                 // Check if the current path is not the root directory
//                 if (window.location.pathname !== "/") {
//                     // Redirect to the root directory with the target hash
//                     window.location.href = `/#${targetId}`;
//                     return; // Stop further execution to allow the page to reload
//                 }

//                 // Update the browser's history state with the root URL
//                 history.pushState({ targetId }, "", `/#${targetId}`);

//                 // Show the targeted work_box
//                 showWorkBox(targetId);
//             });
//         });
//     };

//     // Handle the browser's back and forward buttons
//     window.addEventListener("popstate", (event) => {
//         const targetId = event.state ? event.state.targetId : null;

//         if (targetId) {
//             showWorkBox(targetId);
//         } else {
//             // If no state, hide all work_box elements
//             const allWorkBoxes = document.querySelectorAll(".work_box");
//             allWorkBoxes.forEach(box => {
//                 box.style.display = "none";
//             });
//         }
//     });

//     // Handle page load with a hash in the URL
//     const initialHash = window.location.hash.replace("#", "");
//     if (initialHash) {
//         showWorkBox(initialHash);
//     } else if (window.location.pathname === "/") {
//         // If no hash and on the root directory, show the highest numbered year
//         showHighestYear();
//     }

//     // Initialize sorting and event listeners
//     sortCategories();
//     addClickListeners();
// });

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

    // Function to show the highest numbered year
    const showHighestYear = () => {
        const allWorkBoxes = document.querySelectorAll(".work_box");
        let highestYear = null;

        allWorkBoxes.forEach(box => {
            const year = parseInt(box.id.replace("_", ""), 10); // Extract the year from the ID
            if (!highestYear || year > highestYear) {
                highestYear = year;
            }
        });

        if (highestYear) {
            showWorkBox(highestYear.toString());
        }
    };

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

            // Hide the "about" category
            if (category.text.toLowerCase() === "about") {
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
        // If no hash and on the root directory, show the highest numbered year
        showHighestYear();
    }

    // Initialize sorting and event listeners
    sortCategories();
    addClickListeners();
});