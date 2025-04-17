// Scroll to search bar when clicking "Browse"
function focusSearch() {
    let searchBar = document.getElementById("search-bar");
    searchBar.focus();
    window.scrollTo({ top: searchBar.offsetTop - 100, behavior: 'smooth' });
   }
   // Simulating product search
   function searchProducts() {
    let searchInput = document.getElementById("search-bar").value.toLowerCase();
    alert("Searching for: " + searchInput);
   }