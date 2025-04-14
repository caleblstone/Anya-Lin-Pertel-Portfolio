
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
//     };

//     // Get all list items in the "Work" nav
//     const workListItems = document.querySelectorAll("#work-list li a");

//     // Add click event listeners to each list item
//     workListItems.forEach(item => {
//         item.addEventListener("click", (event) => {
//             event.preventDefault(); // Prevent default anchor behavior

//             // Get the target ID from the href attribute
//             const targetId = item.getAttribute("href").replace("#", "");

//             // Check if the current path is not the root directory
//             if (window.location.pathname !== "/") {
//                 // Redirect to the root directory with the target hash
//                 window.location.href = `/#${targetId}`;
//                 return; // Stop further execution to allow the page to reload
//             }

//             // Update the browser's history state with the root URL
//             history.pushState({ targetId }, "", `/#${targetId}`);

//             // Show the targeted work_box
//             showWorkBox(targetId);
//         });
//     });

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
//     }
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

    // Add click event listeners to each list item
    workListItems.forEach(item => {
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
});